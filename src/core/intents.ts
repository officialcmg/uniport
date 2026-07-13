/**
 * Uniport Intents Service
 *
 * Core functions for cross-chain swaps via the Uniport backend.
 * All 1Click SDK logic lives server-side — the SDK just fetches.
 */

import { needsMemoDeposit, type Token } from './tokens';
import { getUniportConfig } from './config';

// ============================================================================
// TYPES
// ============================================================================

/** Swap type options */
export type SwapType =
    | 'EXACT_INPUT'
    | 'EXACT_OUTPUT'
    | 'FLEX_INPUT'
    | 'ANY_INPUT';

/** Stable backend error codes returned by Uniport */
export type UniportErrorCode =
    | 'VALIDATION_ERROR'
    | 'QUOTE_FAILED'
    | 'DEPOSIT_SUBMISSION_FAILED'
    | 'STATUS_CHECK_FAILED'
    | 'INTERNAL_ERROR'
    | 'REQUEST_TIMEOUT'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';

export interface UniportApiErrorBody {
    code?: UniportErrorCode;
    message?: string;
    details?: unknown;
}

export class UniportError extends Error {
    code: UniportErrorCode;
    details?: unknown;
    status?: number;

    constructor(params: {
        code: UniportErrorCode;
        message: string;
        details?: unknown;
        status?: number;
    }) {
        super(params.message);
        this.name = 'UniportError';
        this.code = params.code;
        this.details = params.details;
        this.status = params.status;
    }
}

/** Quote request options */
export interface QuoteOptions {
    /** Origin token (source chain) */
    originToken: Token;
    /** Destination token (target chain) */
    destinationToken: Token;
    /** Amount in human-readable format (e.g., "1.5" for 1.5 USDC) */
    amount: string;
    /** Recipient address on destination chain */
    recipient: string;
    /** Refund address on origin chain (if swap fails) */
    refundTo: string;
    /** Slippage tolerance in basis points (100 = 1%) */
    slippageTolerance?: number;
    /** Swap type (default: EXACT_INPUT) */
    swapType?: SwapType;
    /** Deadline for the swap (default: 1 hour from now) */
    deadline?: Date;
    /** Dry run - get quote without creating deposit address */
    dry?: boolean;
    /** Referral identifier for tracking */
    referral?: string;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

function extractDetailMessage(details: unknown): string | undefined {
    if (typeof details === 'string' && details.trim()) {
        return details;
    }

    if (Array.isArray(details)) {
        const firstString = details.find(
            (detail): detail is string =>
                typeof detail === 'string' && detail.trim().length > 0
        );
        return firstString;
    }

    if (
        typeof details === 'object' &&
        details !== null &&
        'message' in details &&
        typeof (details as { message?: unknown }).message === 'string'
    ) {
        const message = (details as { message: string }).message.trim();
        return message || undefined;
    }

    return undefined;
}

function toUniportError(
    body: UniportApiErrorBody,
    fallback: {
        code: UniportErrorCode;
        message: string;
        status: number;
    }
): UniportError {
    const detailMessage = extractDetailMessage(body.details);
    return new UniportError({
        code: body.code || fallback.code,
        message: detailMessage || body.message || fallback.message,
        details: body.details,
        status: fallback.status,
    });
}

function createTimeoutSignal(
    timeoutMs: number,
    externalSignal?: AbortSignal
): {
    cleanup: () => void;
    didTimeout: () => boolean;
    signal: AbortSignal;
} {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    const abortFromExternal = () => controller.abort();
    externalSignal?.addEventListener('abort', abortFromExternal, {
        once: true,
    });

    return {
        signal: controller.signal,
        didTimeout: () => timedOut,
        cleanup: () => {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', abortFromExternal);
        },
    };
}

/** Quote result with deposit info */
export interface QuoteResult {
    /** Unique deposit address to send funds */
    depositAddress: string;
    /** Memo (required for some chains like Stellar) */
    memo?: string;
    /** Expected input amount (smallest units) */
    amountIn: string;
    /** Expected output amount (smallest units) */
    amountOut: string;
    /** Human-readable output amount */
    amountOutFormatted: string;
    /** Estimated USD value of output */
    amountOutUsd?: string;
    /** Deadline for the swap */
    deadline?: string;
    /** When the quote becomes inactive */
    timeWhenInactive?: string;
    /** Correlation ID for tracking */
    correlationId: string;
}

/** Execution status */
export type ExecutionStatus =
    | 'PENDING_DEPOSIT'
    | 'KNOWN_DEPOSIT_TX'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'INCOMPLETE_DEPOSIT'
    | 'REFUNDED'
    | 'FAILED';

/** Status result */
export interface StatusResult {
    /** Current status */
    status: ExecutionStatus;
    /** Whether the swap is complete (success or failed) */
    isComplete: boolean;
    /** Whether the swap succeeded */
    isSuccess: boolean;
    /** Correlation ID for tracking */
    correlationId: string;
    /** Destination chain transaction hashes (if available) */
    destinationTxHashes?: string[];
    /** Origin chain transaction hashes (if available) */
    originTxHashes?: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert human-readable amount to smallest units
 */
export function toSmallestUnits(amount: string, decimals: number): string {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return `${whole}${paddedFraction}`.replace(/^0+/, '') || '0';
}

/**
 * Convert smallest units to human-readable amount
 */
export function fromSmallestUnits(amount: string, decimals: number): string {
    const padded = amount.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals) || '0';
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * Generate a deadline timestamp
 */
export function generateDeadline(hoursFromNow = 1): string {
    const deadline = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    return deadline.toISOString();
}

/**
 * Round a human-readable amount string to a fixed number of significant
 * digits, for display only — never use this for values sent on-chain.
 *
 * Intents routing (e.g. an EXACT_INPUT quote into an 18-decimal token) can
 * produce amounts like "0.002703957684923543", which are exact but not
 * readable. This trims them to something a payer can actually glance at
 * (e.g. "0.0027040") while leaving the underlying quote data untouched.
 */
export function formatDisplayAmount(
    amount: string | undefined,
    significantDigits = 6
): string {
    if (!amount) return amount ?? '';
    const num = Number(amount);
    // Non-numeric, zero, or extreme magnitudes: show as-is rather than risk
    // a misleading rounding (e.g. scientific notation for tiny amounts).
    if (!Number.isFinite(num) || num === 0) return amount;
    const abs = Math.abs(num);
    if (abs < 1e-6 || abs >= 1e21) return amount;

    return new Intl.NumberFormat('en-US', {
        maximumSignificantDigits: significantDigits,
        useGrouping: false,
    }).format(num);
}

// ============================================================================
// CORE SERVICE FUNCTIONS
// ============================================================================

/**
 * Get a quote for a cross-chain swap
 */
export async function getQuote(options: QuoteOptions): Promise<QuoteResult> {
    const {
        originToken,
        destinationToken,
        amount,
        recipient,
        refundTo,
        slippageTolerance = 100, // 1% default
        swapType = 'EXACT_INPUT',
        deadline,
        dry = false,
        referral = 'uniport',
        signal,
    } = options;

    const amountInSmallestUnits = toSmallestUnits(amount, originToken.decimals);

    const { backendUrl, requestTimeoutMs } = getUniportConfig();
    const { signal: requestSignal, cleanup, didTimeout } = createTimeoutSignal(
        requestTimeoutMs,
        signal
    );

    let response: Response;

    try {
        response = await fetch(`${backendUrl}/api/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: requestSignal,
            body: JSON.stringify({
                dry,
                swapType,
                slippageTolerance,
                depositMode: needsMemoDeposit(originToken.chain) ? 'MEMO' : undefined,
                originAsset: originToken.assetId,
                destinationAsset: destinationToken.assetId,
                amount: amountInSmallestUnits,
                refundTo,
                recipient,
                deadline: deadline?.toISOString() || generateDeadline(1),
                referral,
            }),
        });
    } catch (error) {
        cleanup();
        if (isAbortError(error)) {
            if (signal?.aborted && !didTimeout()) {
                throw error;
            }
            throw new UniportError({
                code: 'REQUEST_TIMEOUT',
                message: 'Quote request timed out',
            });
        }
        throw error;
    }

    cleanup();

    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => ({})) as UniportApiErrorBody;
        throw toUniportError(errorBody, {
            code: 'QUOTE_FAILED',
            message: 'Quote failed.',
            status: response.status,
        });
    }

    const data = await response.json();
    const quote = data.quote;

    return {
        depositAddress: quote.depositAddress || '',
        memo: quote.depositMemo,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        amountOutFormatted: quote.amountOutFormatted,
        amountOutUsd: quote.amountOutUsd,
        deadline: quote.deadline,
        timeWhenInactive: quote.timeWhenInactive,
        correlationId: data.correlationId,
    };
}

/**
 * Submit a deposit transaction hash to speed up processing
 */
export async function submitDepositTx(params: {
    txHash: string;
    depositAddress: string;
    memo?: string;
    nearSenderAccount?: string;
}): Promise<void> {
    const { backendUrl, requestTimeoutMs } = getUniportConfig();
    const { signal, cleanup } = createTimeoutSignal(requestTimeoutMs);

    let response: Response;

    try {
        response = await fetch(`${backendUrl}/api/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal,
            body: JSON.stringify(params),
        });
    } catch (error) {
        cleanup();
        if (isAbortError(error)) {
            throw new UniportError({
                code: 'REQUEST_TIMEOUT',
                message: 'Deposit submission timed out',
            });
        }
        throw error;
    }

    cleanup();

    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => ({})) as UniportApiErrorBody;
        throw toUniportError(errorBody, {
            code: 'DEPOSIT_SUBMISSION_FAILED',
            message: 'Submit deposit failed.',
            status: response.status,
        });
    }
}

/**
 * Get the execution status of a swap
 */
export async function getExecutionStatus(
    depositAddress: string,
    memo?: string
): Promise<StatusResult> {
    const { backendUrl, requestTimeoutMs } = getUniportConfig();
    const url = new URL(
        `${backendUrl}/api/status/${encodeURIComponent(depositAddress)}`
    );
    if (memo) {
        url.searchParams.set('memo', memo);
    }

    const { signal, cleanup } = createTimeoutSignal(requestTimeoutMs);

    let response: Response;

    try {
        response = await fetch(url.toString(), { signal });
    } catch (error) {
        cleanup();
        if (isAbortError(error)) {
            throw new UniportError({
                code: 'REQUEST_TIMEOUT',
                message: 'Status check timed out',
            });
        }
        throw error;
    }

    cleanup();

    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => ({})) as UniportApiErrorBody;
        throw toUniportError(errorBody, {
            code: 'STATUS_CHECK_FAILED',
            message: 'Status check failed.',
            status: response.status,
        });
    }

    return await response.json();
}

/**
 * Poll execution status until complete
 */
export async function pollExecutionStatus(
    depositAddress: string,
    options?: {
        memo?: string;
        interval?: number;
        timeout?: number;
        onStatusChange?: (status: StatusResult) => void;
    }
): Promise<StatusResult> {
    const {
        memo,
        interval = 5000,
        timeout = 600000,
        onStatusChange,
    } = options || {};

    const startTime = Date.now();
    let lastStatus: ExecutionStatus | null = null;

    while (Date.now() - startTime < timeout) {
        const status = await getExecutionStatus(depositAddress, memo);

        if (status.status !== lastStatus) {
            lastStatus = status.status;
            onStatusChange?.(status);
        }

        if (status.isComplete) {
            return status;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout waiting for swap completion after ${timeout}ms`);
}
