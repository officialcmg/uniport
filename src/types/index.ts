/**
 * Uniport SDK Types
 *
 * Component props and UI state types
 */

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/** What onSuccess receives when a payment completes. */
export interface PaymentSuccess {
    /** The first destination-chain transaction hash, or '' if none was reported. */
    txHash: string;
    /** The quoted amount delivered, in the destination token's smallest units. */
    amount: string;
    /**
     * The payment's deposit address. Send it to your server, which should
     * confirm the payment with GET https://api.uniport.dev/v1/payments/{depositAddress}
     * before fulfilling an order.
     */
    depositAddress: string;
    /** The deposit memo, on chains that use one. Pass it as ?memo= when confirming. */
    depositMemo?: string;
    /** 1Click's reference for the quote, useful when asking for support. */
    correlationId: string;
}

/** Props for the UniportButton component */
export interface UniportButtonProps {
    /** Your public App ID from https://uniport.dev/dashboard. Required on deployed sites. */
    appId?: string;
    /** Recipient address on the destination chain */
    recipient: string;
    /** Optional source-chain refund address to prefill in the modal */
    refundAddress?: string;
    /** Destination token name (e.g. 'suiUSDC', 'ethereumUSDC', 'baseETH'). See supported tokens table in README. */
    destinationToken: string;
    /** Request a specific amount (in destination token units) */
    amount?: string;
    /** Button label */
    label?: string;
    /** Button variant */
    variant?: 'default' | 'compact' | 'outline';
    /** Disable the button */
    disabled?: boolean;
    /** Class name for custom styling */
    className?: string;
    /** Color theme for the modal */
    theme?: 'light' | 'dark';
    /** Callback when payment completes */
    onSuccess?: (result: PaymentSuccess) => void;
    /** Callback when payment fails */
    onError?: (error: Error) => void;
    /** Callback when modal opens/closes */
    onOpenChange?: (open: boolean) => void;
}

/** Props for the UniportModal component */
export interface UniportModalProps {
    /** Your public App ID from https://uniport.dev/dashboard. Required on deployed sites. */
    appId?: string;
    /** Whether the modal is open */
    open: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Recipient address on the destination chain */
    recipient: string;
    /** Optional source-chain refund address to prefill */
    refundAddress?: string;
    /** Destination token name (e.g. 'suiUSDC', 'ethereumUSDC', 'baseETH') */
    destinationToken: string;
    /** Exact destination amount; omit to let the payer enter an input amount */
    amount?: string;
    /** Color theme */
    theme?: 'light' | 'dark';
    /** Callback when payment completes */
    onSuccess?: (result: PaymentSuccess) => void;
    /** Callback when payment fails */
    onError?: (error: Error) => void;
}

/** Payment state for UI */
export type PaymentState =
    | 'idle'
    | 'selecting'
    | 'quoting'
    | 'awaiting_deposit'
    | 'processing'
    | 'success'
    | 'error';
