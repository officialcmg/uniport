/**
 * Uniport Intents Service
 *
 * Core functions for cross-chain swaps via the Uniport backend.
 * All 1Click SDK logic lives server-side — the SDK just fetches.
 */

import { needsMemoDeposit, type Token } from './tokens';
import { checkAppId, getUniportConfig } from './config';
import {
    SETUP_ERROR_PAYER_MESSAGE,
    UniportError,
    fixableByCode,
    type UniportApiErrorBody,
    type UniportErrorCode,
} from './errors';

export * from './errors';

// ============================================================================
// TYPES
// ============================================================================

/** Swap type options */
export type SwapType =
    | 'EXACT_INPUT'
    | 'EXACT_OUTPUT'
    | 'FLEX_INPUT'
    | 'ANY_INPUT';

/** Quote request options */
export interface QuoteOptions {
    /** Origin token (source chain) */
    originToken: Token;
    /** Destination token (target chain) */
    destinationToken: Token;
    /** Human-readable input amount for EXACT_INPUT, output amount for EXACT_OUTPUT. */
    amount: string;
    /** Recipient address on destination chain */
    recipient: string;
    /** Refund address on origin chain (if swap fails) */
    refundTo?: string;
    /** Slippage tolerance in basis points (100 = 1%) */
    slippageTolerance?: number;
    /** Swap type (default: EXACT_INPUT) */
    swapType?: SwapType;
    /** Deadline for the swap (default: 1 hour from now) */
    deadline?: Date;
    /** Dry run - get quote without creating deposit address */
    dry?: boolean;
    /** Your public App ID. Defaults to the one set with configureUniport(). */
    appId?: string;
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

/** What the payer is told when the cause is not one they can act on. */
const GENERIC_PAYER_MESSAGE: Partial<Record<UniportErrorCode, string>> = {
    QUOTE_FAILED: 'Could not get a quote for this payment. Please try again.',
    DEPOSIT_SUBMISSION_FAILED: 'Could not report the deposit. Your payment is not affected.',
    STATUS_CHECK_FAILED: 'Could not check the payment status. Please try again.',
};

/** What the payer is told for each cause they can act on, or that will pass. */
function payerMessage(
    code: string,
    body: UniportApiErrorBody,
    originToken?: Pick<Token, 'decimals' | 'symbol'>
): string | undefined {
    switch (code) {
        case 'NO_LIQUIDITY':
            return 'No route for this amount right now. Try a smaller amount or another network.';
        case 'AMOUNT_TOO_LOW': {
            const minimum = body.minimum;
            let least = '';
            if (minimum?.amount && originToken) {
                const amount = fromSmallestUnits(minimum.amount, originToken.decimals);
                least = ' The minimum is ' + amount + ' ' + originToken.symbol + '.';
            } else if (minimum?.usd) {
                least = ' The minimum is $' + minimum.usd + '.';
            }
            return 'This amount is too small for this route.' + least;
        }
        case 'INVALID_REFUND_ADDRESS':
            return 'That is not a valid refund address for this network.';
        case 'QUOTE_UNVERIFIED':
            return 'Could not confirm this quote. Please try again.';
        default:
            return undefined;
    }
}

/**
 * Turns the API's error answer into a UniportError whose message can be shown
 * to the payer. Exported for tests.
 */
export function toUniportError(
    body: UniportApiErrorBody,
    fallback: {
        code: UniportErrorCode;
        message: string;
        status: number;
    },
    originToken?: Pick<Token, 'decimals' | 'symbol'>
): UniportError {
    const detailMessage = extractDetailMessage(body.details);
    const code = body.code || fallback.code;

    // The app is set up wrongly. The reason is for the developer, so it goes to
    // the console and to `details`; the payer sees a neutral message.
    if (fixableByCode(code) === 'developer') {
        const reason =
            [body.message, detailMessage].filter(Boolean).join(' ') ||
            'The app is not set up correctly.';
        console.error('Uniport [' + code + ']: ' + reason);
        return new UniportError({
            code,
            message: SETUP_ERROR_PAYER_MESSAGE,
            details: body.details ?? body.message,
            status: fallback.status,
        });
    }
    if (fallback.status === 429) {
        return new UniportError({
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a minute and try again.',
            status: 429,
        });
    }

    const forPayer = payerMessage(code, body, originToken);
    if (!forPayer && detailMessage) {
        // An unsorted failure: keep 1Click's reference so it can be raised with them.
        const reference = (body.details as { correlationId?: unknown } | undefined)
            ?.correlationId;
        console.error(
            'Uniport [' + code + ']: ' + detailMessage +
            (typeof reference === 'string' ? ' (1Click reference ' + reference + ')' : '')
        );
    }
    return new UniportError({
        code,
        // 1Click's own sentence is in `details`; it is not written for a payer.
        message: forPayer || GENERIC_PAYER_MESSAGE[fallback.code] || 'Something went wrong. Please try again.',
        details: body.details ?? body.message,
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
    /** Expected input amount in human-readable units */
    amountInFormatted: string;
    /** Minimum accepted input amount (smallest units) */
    minAmountIn?: string;
    /** Friendly amount the payer should send (smallest units) */
    paymentAmountIn: string;
    /** Friendly amount the payer should send in human-readable units */
    paymentAmountInFormatted: string;
    /** Rounded surplus credited to Uniport Intents (smallest units) */
    roundingRemainder: string;
    /** Rounded surplus credited to Uniport Intents in human-readable units */
    roundingRemainderFormatted: string;
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
    /** 1Click's explorer link for each destination hash, index-aligned (newer backends only) */
    destinationTxExplorerUrls?: (string | null)[];
    /** 1Click's explorer link for each origin hash, index-aligned (newer backends only) */
    originTxExplorerUrls?: (string | null)[];
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
    if (decimals === 0) return amount;
    const padded = amount.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals) || '0';
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
}

/** Maximum extra input collected when making EXACT_OUTPUT amounts readable. */
export const MAX_EXACT_OUTPUT_ROUNDING_BPS = 1;

/**
 * Round a smallest-unit amount upward to the shortest decimal representation
 * that adds no more than MAX_EXACT_OUTPUT_ROUNDING_BPS (0.01%). The payer
 * sends at most five significant digits, or a whole number of tokens when
 * the amount is 100,000 or more.
 */
export function roundUpInputAmount(
    amount: string,
    decimals: number,
    maxIncreaseBps = MAX_EXACT_OUTPUT_ROUNDING_BPS
): string {
    if (
        !/^[1-9]\d*$/.test(amount) ||
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        !Number.isInteger(maxIncreaseBps) ||
        maxIncreaseBps < 0
    ) {
        return amount;
    }

    const value = BigInt(amount);
    const maxBps = BigInt(maxIncreaseBps);

    for (let displayDecimals = 0; displayDecimals <= decimals; displayDecimals++) {
        const unit = 10n ** BigInt(decimals - displayDecimals);
        const rounded = ((value + unit - 1n) / unit) * unit;
        if ((rounded - value) * 10000n <= value * maxBps) {
            return rounded.toString();
        }
    }

    return amount;
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

/**
 * Headers for a POST to the backend. The App ID goes on POSTs only: they
 * already need a CORS preflight for their JSON body, so the extra header costs
 * nothing, while a custom header on status polls would add a preflight to each.
 */
function postHeaders(appId: string | undefined): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (appId) headers['X-Uniport-App-Id'] = appId;
    return headers;
}

let warnedAboutMissingAppId = false;

/** Says once, in the console, that a deployed site needs an App ID. */
function warnIfAppIdMissing(appId: string | undefined): void {
    if (appId || warnedAboutMissingAppId || typeof window === 'undefined') return;
    const host = window.location?.hostname ?? '';
    const local =
        host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
    if (local) return;
    warnedAboutMissingAppId = true;
    console.warn(
        'Uniport: no appId is set. Without one the SDK only works on localhost. ' +
        'Create an App ID at https://uniport.dev/dashboard and pass it as the appId prop.'
    );
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
        signal,
    } = options;

    const amountInSmallestUnits = toSmallestUnits(
        amount,
        swapType === 'EXACT_OUTPUT'
            ? destinationToken.decimals
            : originToken.decimals
    );

    const { backendUrl, requestTimeoutMs, appId: configuredAppId } = getUniportConfig();
    const appId = checkAppId(options.appId) ?? configuredAppId;
    warnIfAppIdMissing(appId);
    const { signal: requestSignal, cleanup, didTimeout } = createTimeoutSignal(
        requestTimeoutMs,
        signal
    );

    let response: Response;

    try {
        response = await fetch(`${backendUrl}/api/quote`, {
            method: 'POST',
            headers: postHeaders(appId),
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
                message: 'That took too long. Please try again.',
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
        }, swapType === 'EXACT_INPUT' ? originToken : undefined);
    }

    const data = await response.json();
    const quote = data.quote;
    const paymentAmountIn = swapType === 'EXACT_OUTPUT'
        ? roundUpInputAmount(quote.amountIn, originToken.decimals)
        : quote.amountIn;
    const roundingRemainder = (
        BigInt(paymentAmountIn) - BigInt(quote.amountIn)
    ).toString();

    return {
        depositAddress: quote.depositAddress || '',
        memo: quote.depositMemo,
        amountIn: quote.amountIn,
        amountInFormatted:
            quote.amountInFormatted ||
            fromSmallestUnits(quote.amountIn, originToken.decimals),
        minAmountIn: quote.minAmountIn,
        paymentAmountIn,
        paymentAmountInFormatted: fromSmallestUnits(
            paymentAmountIn,
            originToken.decimals
        ),
        roundingRemainder,
        roundingRemainderFormatted: fromSmallestUnits(
            roundingRemainder,
            originToken.decimals
        ),
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
export async function submitDepositTx({ appId, ...body }: {
    txHash: string;
    depositAddress: string;
    memo?: string;
    nearSenderAccount?: string;
    /** Overrides the App ID set with configureUniport. Sent as a header, not in the body. */
    appId?: string;
}): Promise<void> {
    const { backendUrl, requestTimeoutMs } = getUniportConfig();
    const { signal, cleanup } = createTimeoutSignal(requestTimeoutMs);

    let response: Response;

    try {
        response = await fetch(`${backendUrl}/api/deposit`, {
            method: 'POST',
            headers: postHeaders(checkAppId(appId) ?? getUniportConfig().appId),
            signal,
            body: JSON.stringify(body),
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
