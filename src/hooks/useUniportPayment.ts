/**
 * useUniportPayment Hook
 *
 * Main hook for managing payment state and flow
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    getQuote,
    getExecutionStatus,
    type QuoteResult,
    type StatusResult,
    type ExecutionStatus,
    type SwapType,
    isRateLimitError,
    toUniportErrorFromUnknown,
    UniportError,
} from '../core/intents';
import { checkPaymentSetup, reportSetupError } from '../core/setup';
import { useHostname } from './useHostname';
import {
    ALL_TOKENS,
    getSupportedChains,
    getToken,
    usesEvmAddress,
    type Token,
    type Chain,
} from '../core/tokens';
import {
    getUniportDefaultRefundAddress,
    UNIPORT_FALLBACK_REFUND_ADDRESS,
} from '../core/ens';
import type { PaymentState, PaymentSuccess } from '../types';

export interface UseUniportPaymentOptions {
    /** Your public App ID. Defaults to the one set with configureUniport(). */
    appId?: string;
    recipient: string;
    refundAddress?: string;
    destinationToken: string;
    /** Exact destination amount; omit to let the payer enter an input amount. */
    amount?: string;
    onSuccess?: (result: PaymentSuccess) => void;
    /** Always a UniportError: read `code` and `fixableBy`. */
    onError?: (error: UniportError) => void;
}

export interface UseUniportPaymentReturn {
    // State
    /**
     * Set when the values passed in are wrong (missing recipient, unknown
     * token, and so on). No request is made while it is set.
     */
    setupError: UniportError | null;
    /** True after several status checks in a row have failed. Checking carries on. */
    statusTrouble: boolean;
    paymentState: PaymentState;
    quote: QuoteResult | null;
    previewQuote: QuoteResult | null;
    previewError: UniportError | null;
    isLoadingPreview: boolean;
    status: StatusResult | null;
    error: UniportError | null;

    // Selected values
    selectedChain: Chain | null;
    selectedToken: Token | null;
    amount: string;
    refundAddress: string;
    /** refundAddress if provided, otherwise the resolved default (EVM only). May be empty on non-EVM chains. */
    effectiveRefundAddress: string;
    /** True when effectiveRefundAddress is the Uniport default rather than user input. */
    isUsingDefaultRefundAddress: boolean;
    destinationToken: Token;

    // Data
    chains: Chain[];
    tokens: Token[];

    // Actions
    setSelectedChain: (chain: Chain) => void;
    setSelectedToken: (token: Token) => void;
    setAmount: (amount: string) => void;
    setRefundAddress: (refundAddress: string) => void;
    fetchQuote: () => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;
    cancelQuote: () => void;
    reset: () => void;
    copyToClipboard: (text: string) => Promise<boolean>;
}

export function useUniportPayment(
    options: UseUniportPaymentOptions
): UseUniportPaymentReturn {
    const {
        appId,
        recipient,
        refundAddress: initialRefundAddress,
        destinationToken,
        amount: initialAmount,
        onSuccess,
        onError,
    } = options;
    const swapType: Extract<SwapType, 'EXACT_INPUT' | 'EXACT_OUTPUT'> =
        initialAmount === undefined ? 'EXACT_INPUT' : 'EXACT_OUTPUT';

    // What is wrong with the values passed in, if anything. Nothing throws here:
    // a setup mistake must not take the host page down.
    const hostname = useHostname();
    const setupError = useMemo(
        () => checkPaymentSetup({ appId, recipient, destinationToken, amount: initialAmount, hostname }),
        [appId, recipient, destinationToken, initialAmount, hostname]
    );
    const setupErrorKey = setupError ? setupError.code + ':' + String(setupError.details) : '';

    // With an unknown destinationToken there is no token to work with. A stand-in
    // keeps the rest of the hook well-formed; setupError stops it being used.
    const destToken = getToken(destinationToken) ?? ALL_TOKENS[0];

    // State
    const [paymentState, setPaymentState] = useState<PaymentState>('idle');
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [previewQuote, setPreviewQuote] = useState<QuoteResult | null>(null);
    const [previewError, setPreviewError] = useState<UniportError | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [status, setStatus] = useState<StatusResult | null>(null);
    const [error, setError] = useState<UniportError | null>(null);
    const [statusTrouble, setStatusTrouble] = useState(false);

    // Selection state
    const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [amount, setAmountState] = useState(initialAmount ?? '');
    const [refundAddress, setRefundAddressState] = useState(
        initialRefundAddress ?? ''
    );
    useEffect(() => setAmountState(initialAmount ?? ''), [initialAmount]);

    // Default refund address for EVM chains (resolved from uniport.eth),
    // used only when the payer doesn't provide their own refund address.
    const [evmDefaultRefundAddress, setEvmDefaultRefundAddress] = useState(
        UNIPORT_FALLBACK_REFUND_ADDRESS
    );
    useEffect(() => {
        let cancelled = false;
        getUniportDefaultRefundAddress().then((address) => {
            if (!cancelled) setEvmDefaultRefundAddress(address);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // The refund address actually sent with quotes: the payer's input if
    // provided, otherwise the Uniport default — but only on EVM source chains.
    const effectiveRefundAddress = swapType === 'EXACT_OUTPUT'
        ? ''
        : refundAddress.trim() ||
          (selectedChain && usesEvmAddress(selectedChain.id)
              ? evmDefaultRefundAddress
              : '');

    // Refs
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    // The poll timer outlives renders, so it reads the latest callbacks from here.
    const callbacksRef = useRef({ onSuccess, onError });
    useEffect(() => {
        callbacksRef.current = { onSuccess, onError };
    });
    const pollPausedUntilRef = useRef(0);
    const pollFailuresRef = useRef(0);

    // Tell the developer about a setup mistake once, in the console and through onError.
    useEffect(() => {
        if (!setupError) return;
        reportSetupError(setupError);
        callbacksRef.current.onError?.(setupError);
        // Keyed on what the problem is, not on the error object.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setupErrorKey]);
    // Goes up each time polling stops, so a reply still in flight for a payment
    // that was cancelled or reset is recognised and dropped.
    const pollGenerationRef = useRef(0);
    const lastStatusRef = useRef<ExecutionStatus | null>(null);
    const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const previewAbortRef = useRef<AbortController | null>(null);

    // Get available chains/tokens — exclude the destination chain from source chains
    const chains = getSupportedChains().filter((c) => c.id !== destToken.chain);
    const tokens = selectedChain?.tokens || [];

    const schedulePreviewQuote = useCallback(
        (
            nextAmount: string,
            nextRefundAddress: string,
            nextSelectedToken: Token | null
        ) => {
            setPreviewQuote(null);
            setPreviewError(null);

            if (previewDebounceRef.current) {
                clearTimeout(previewDebounceRef.current);
            }

            if (previewAbortRef.current) {
                previewAbortRef.current.abort();
                previewAbortRef.current = null;
            }

            if (
                setupError ||
                !nextAmount ||
                !nextSelectedToken ||
                (swapType !== 'EXACT_OUTPUT' && !nextRefundAddress)
            ) {
                setIsLoadingPreview(false);
                return;
            }

            setIsLoadingPreview(true);

            previewDebounceRef.current = setTimeout(async () => {
                const controller = new AbortController();
                previewAbortRef.current = controller;

                try {
                    const result = await getQuote({
                        originToken: nextSelectedToken,
                        destinationToken: destToken,
                        amount: nextAmount,
                        recipient,
                        refundTo: nextRefundAddress,
                        swapType,
                        dry: true,
                        appId,
                        signal: controller.signal,
                    });
                    setPreviewQuote(result);
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        return;
                    }
                    const previewFailure = toUniportErrorFromUnknown(
                        err,
                        'Failed to fetch estimate'
                    );
                    setPreviewError(previewFailure);
                    console.warn('Preview quote failed:', previewFailure);
                } finally {
                    if (previewAbortRef.current === controller) {
                        previewAbortRef.current = null;
                    }
                    setIsLoadingPreview(false);
                }
            }, 250);
        },
        [appId, destToken, recipient, swapType, setupError]
    );

    const setAmount = useCallback(
        (newAmount: string) => {
            // An app-set amount is the payment target; the payer can't change it.
            if (swapType === 'EXACT_OUTPUT') return;
            setAmountState(newAmount);
            schedulePreviewQuote(newAmount, effectiveRefundAddress, selectedToken);
        },
        [effectiveRefundAddress, schedulePreviewQuote, selectedToken, swapType]
    );

    const setRefundAddress = useCallback(
        (newRefundAddress: string) => {
            setRefundAddressState(newRefundAddress);
            const nextEffective =
                newRefundAddress.trim() ||
                (selectedChain && usesEvmAddress(selectedChain.id)
                    ? evmDefaultRefundAddress
                    : '');
            schedulePreviewQuote(amount, nextEffective, selectedToken);
        },
        [amount, evmDefaultRefundAddress, schedulePreviewQuote, selectedChain, selectedToken]
    );

    // Handle chain selection
    const handleChainSelect = useCallback((chain: Chain) => {
        const nextToken = chain.tokens[0] || null;
        setSelectedChain(chain);
        setSelectedToken(nextToken);
        setPaymentState('selecting');
        const nextEffective =
            refundAddress.trim() ||
            (usesEvmAddress(chain.id) ? evmDefaultRefundAddress : '');
        schedulePreviewQuote(amount, nextEffective, nextToken);
    }, [amount, evmDefaultRefundAddress, refundAddress, schedulePreviewQuote]);

    // Handle token selection
    const handleTokenSelect = useCallback((token: Token) => {
        setSelectedToken(token);
        setPaymentState('selecting');
        schedulePreviewQuote(amount, effectiveRefundAddress, token);
    }, [amount, effectiveRefundAddress, schedulePreviewQuote]);

    // Fetch quote (real, non-dry)
    const fetchQuote = useCallback(async () => {
        if (setupError) {
            setError(setupError);
            setPaymentState('error');
            return;
        }
        if (
            !selectedToken ||
            !amount ||
            (swapType !== 'EXACT_OUTPUT' && !effectiveRefundAddress)
        ) {
            setError(new UniportError({
                code: 'VALIDATION_ERROR',
                message: 'Choose a token, an amount and a refund address first.',
            }));
            return;
        }

        setPaymentState('quoting');
        setError(null);

        try {
            const result = await getQuote({
                originToken: selectedToken,
                destinationToken: destToken,
                amount,
                recipient,
                refundTo: effectiveRefundAddress,
                swapType,
                dry: false,
                appId,
            });

            setQuote(result);
            setPaymentState('awaiting_deposit');
        } catch (err) {
            const error = toUniportErrorFromUnknown(err, 'Failed to get quote');
            setError(error);
            setPaymentState('error');
            onError?.(error);
        }
    }, [
        selectedToken,
        amount,
        effectiveRefundAddress,
        recipient,
        destToken,
        swapType,
        appId,
        onError,
        setupError,
    ]);

    // Stop polling
    const stopPolling = useCallback(() => {
        pollGenerationRef.current += 1;
        pollFailuresRef.current = 0;
        setStatusTrouble(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Poll for status
    const pollStatus = useCallback(async () => {
        if (!quote?.depositAddress) return;
        if (Date.now() < pollPausedUntilRef.current) return;
        const generation = pollGenerationRef.current;

        try {
            const result = await getExecutionStatus(
                quote.depositAddress,
                quote.memo
            );
            if (generation !== pollGenerationRef.current) return;
            setStatus(result);

            if (result.status !== lastStatusRef.current) {
                lastStatusRef.current = result.status;

                if (result.status === 'PROCESSING') {
                    setPaymentState('processing');
                } else if (result.isSuccess) {
                    setPaymentState('success');
                    stopPolling();
                    callbacksRef.current.onSuccess?.({
                        txHash: result.destinationTxHashes?.[0] || '',
                        amount: quote.amountOut,
                        depositAddress: quote.depositAddress,
                        depositMemo: quote.memo,
                        correlationId: quote.correlationId,
                    });
                } else if (result.isComplete) {
                    setPaymentState('error');
                    stopPolling();
                    const refunded = result.status === 'REFUNDED';
                    const err = new UniportError({
                        code: refunded ? 'PAYMENT_REFUNDED' : 'PAYMENT_FAILED',
                        message: refunded ? 'Payment was refunded' : 'Payment failed',
                        details: result,
                    });
                    setError(err);
                    callbacksRef.current.onError?.(err);
                }
            }
        } catch (err) {
            if (generation !== pollGenerationRef.current) return;
            // Asked to slow down: leave the status alone for half a minute.
            if (isRateLimitError(err)) pollPausedUntilRef.current = Date.now() + 30_000;
            // Checking carries on; after a few failures in a row the payer is told.
            pollFailuresRef.current += 1;
            if (pollFailuresRef.current >= 3) setStatusTrouble(true);
            console.error('Status poll error:', err);
        }
    }, [quote, stopPolling]);

    // Start polling
    const startPolling = useCallback(() => {
        if (pollingRef.current) return;
        pollStatus();
        pollingRef.current = setInterval(pollStatus, 3000);
    }, [pollStatus]);

    // Copy to clipboard
    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Reset state
    const reset = useCallback(() => {
        stopPolling();
        if (previewDebounceRef.current) {
            clearTimeout(previewDebounceRef.current);
        }
        if (previewAbortRef.current) {
            previewAbortRef.current.abort();
            previewAbortRef.current = null;
        }
        setPaymentState('idle');
        setQuote(null);
        setPreviewQuote(null);
        setIsLoadingPreview(false);
        setStatus(null);
        setError(null);
        setPreviewError(null);
        setSelectedChain(null);
        setSelectedToken(null);
        setAmountState(initialAmount ?? '');
        setRefundAddressState(initialRefundAddress ?? '');
        lastStatusRef.current = null;
    }, [initialAmount, initialRefundAddress, stopPolling]);

    // Cancel active quote without clearing chain/token/amount selection.
    // Use this for mid-flow back navigation (QR → amount).
    const cancelQuote = useCallback(() => {
        stopPolling();
        setPaymentState('selecting');
        setQuote(null);
        setStatus(null);
        setError(null);
        lastStatusRef.current = null;
    }, [stopPolling]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
            if (previewDebounceRef.current) {
                clearTimeout(previewDebounceRef.current);
            }
            if (previewAbortRef.current) {
                previewAbortRef.current.abort();
                previewAbortRef.current = null;
            }
        };
    }, [stopPolling]);

    return {
        paymentState,
        quote,
        previewQuote,
        previewError,
        setupError,
        statusTrouble,
        isLoadingPreview,
        status,
        error,
        selectedChain,
        selectedToken,
        amount,
        refundAddress,
        effectiveRefundAddress,
        isUsingDefaultRefundAddress:
            swapType !== 'EXACT_OUTPUT' &&
            !refundAddress.trim() &&
            !!effectiveRefundAddress,
        destinationToken: destToken,
        chains,
        tokens,
        setSelectedChain: handleChainSelect,
        setSelectedToken: handleTokenSelect,
        setAmount,
        setRefundAddress,
        fetchQuote,
        startPolling,
        stopPolling,
        cancelQuote,
        reset,
        copyToClipboard,
    };
}
