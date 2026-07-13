/**
 * useUniportPayment Hook
 *
 * Main hook for managing payment state and flow
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    getQuote,
    getExecutionStatus,
    type QuoteResult,
    type StatusResult,
    type ExecutionStatus,
} from '../core/intents';
import {
    getSupportedChains,
    getToken,
    isEvmChain,
    type Token,
    type Chain,
} from '../core/tokens';
import {
    getUniportDefaultRefundAddress,
    UNIPORT_FALLBACK_REFUND_ADDRESS,
} from '../core/ens';
import type { PaymentState } from '../types';

export interface UseUniportPaymentOptions {
    recipient: string;
    refundAddress?: string;
    destinationToken: string;
    amount?: string;
    onSuccess?: (result: { txHash: string; amount: string }) => void;
    onError?: (error: Error) => void;
}

export interface UseUniportPaymentReturn {
    // State
    paymentState: PaymentState;
    quote: QuoteResult | null;
    previewQuote: QuoteResult | null;
    previewError: Error | null;
    isLoadingPreview: boolean;
    status: StatusResult | null;
    error: Error | null;

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
        recipient,
        refundAddress: initialRefundAddress,
        destinationToken,
        amount: initialAmount,
        onSuccess,
        onError,
    } = options;

    // Get destination token by name string
    const destToken = getToken(destinationToken);
    if (!destToken) {
        throw new Error(
            `Invalid destinationToken: "${destinationToken}". ` +
            `Use a valid token name like "suiUSDC", "arbitrumUSDC", "ethereumUSDC", or "baseETH". ` +
            `See the supported tokens table in the README.`
        );
    }

    // State
    const [paymentState, setPaymentState] = useState<PaymentState>('idle');
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [previewQuote, setPreviewQuote] = useState<QuoteResult | null>(null);
    const [previewError, setPreviewError] = useState<Error | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [status, setStatus] = useState<StatusResult | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Selection state
    const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [amount, setAmountState] = useState(initialAmount ?? '');
    const [refundAddress, setRefundAddressState] = useState(
        initialRefundAddress ?? ''
    );

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
    const effectiveRefundAddress =
        refundAddress.trim() ||
        (selectedChain && isEvmChain(selectedChain.id)
            ? evmDefaultRefundAddress
            : '');

    // Refs
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
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

            if (!nextAmount || !nextSelectedToken || !nextRefundAddress) {
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
                        dry: true,
                        signal: controller.signal,
                    });
                    setPreviewQuote(result);
                } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        return;
                    }
                    const previewFailure =
                        err instanceof Error
                            ? err
                            : new Error('Failed to fetch estimate');
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
        [destToken, recipient]
    );

    const setAmount = useCallback(
        (newAmount: string) => {
            setAmountState(newAmount);
            schedulePreviewQuote(newAmount, effectiveRefundAddress, selectedToken);
        },
        [effectiveRefundAddress, schedulePreviewQuote, selectedToken]
    );

    const setRefundAddress = useCallback(
        (newRefundAddress: string) => {
            setRefundAddressState(newRefundAddress);
            const nextEffective =
                newRefundAddress.trim() ||
                (selectedChain && isEvmChain(selectedChain.id)
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
            (isEvmChain(chain.id) ? evmDefaultRefundAddress : '');
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
        if (!selectedToken || !amount || !effectiveRefundAddress) {
            setError(new Error('Missing required fields'));
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
                dry: false,
            });

            setQuote(result);
            setPaymentState('awaiting_deposit');
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to get quote');
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
        onError,
    ]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Poll for status
    const pollStatus = useCallback(async () => {
        if (!quote?.depositAddress) return;

        try {
            const result = await getExecutionStatus(
                quote.depositAddress,
                quote.memo
            );
            setStatus(result);

            if (result.status !== lastStatusRef.current) {
                lastStatusRef.current = result.status;

                if (result.status === 'PROCESSING') {
                    setPaymentState('processing');
                } else if (result.isSuccess) {
                    setPaymentState('success');
                    stopPolling();
                    onSuccess?.({
                        txHash: result.destinationTxHashes?.[0] || '',
                        amount: quote.amountOut,
                    });
                } else if (result.isComplete) {
                    setPaymentState('error');
                    stopPolling();
                    const err = new Error(
                        result.status === 'REFUNDED'
                            ? 'Payment was refunded'
                            : 'Payment failed'
                    );
                    setError(err);
                    onError?.(err);
                }
            }
        } catch (err) {
            console.error('Status poll error:', err);
        }
    }, [quote, onSuccess, onError, stopPolling]);

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
        isLoadingPreview,
        status,
        error,
        selectedChain,
        selectedToken,
        amount,
        refundAddress,
        effectiveRefundAddress,
        isUsingDefaultRefundAddress:
            !refundAddress.trim() && !!effectiveRefundAddress,
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
