/**
 * UniportButton Component
 *
 * Drop-in button that opens the Uniport payment modal
 *
 * @example
 * ```tsx
 * import { UniportButton } from 'uniport-sdk'
 *
 * <UniportButton
 *   recipient="0x..."
 *   destinationToken="arbitrumUSDC"
 *   onSuccess={(result) => console.log('Paid!', result)}
 * />
 * ```
 */

import React, { useState } from 'react';
import { UniportModal } from './UniportModal';
import type { UniportButtonProps } from '../types';

type ButtonVariant = NonNullable<UniportButtonProps['variant']>;
type ButtonTheme = NonNullable<UniportButtonProps['theme']>;

const sharedButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const buttonStyles: Record<
    ButtonTheme,
    Record<ButtonVariant, React.CSSProperties>
> = {
    light: {
        default: {
            ...sharedButtonStyle,
            gap: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            background: '#1c1c1e',
            border: '1px solid #1c1c1e',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(28, 28, 30, 0.18)',
        },
        compact: {
            ...sharedButtonStyle,
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#ffffff',
            background: '#1c1c1e',
            border: '1px solid #1c1c1e',
            borderRadius: '8px',
            boxShadow: '0 6px 18px rgba(28, 28, 30, 0.16)',
        },
        outline: {
            ...sharedButtonStyle,
            gap: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1c1c1e',
            background: 'transparent',
            border: '1px solid #1c1c1e',
            borderRadius: '12px',
        },
    },
    dark: {
        default: {
            ...sharedButtonStyle,
            gap: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#111113',
            background: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
        },
        compact: {
            ...sharedButtonStyle,
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#111113',
            background: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.28)',
        },
        outline: {
            ...sharedButtonStyle,
            gap: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.72)',
            borderRadius: '12px',
        },
    },
};

const disabledButtonStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
};

function getButtonStyle(
    variant: ButtonVariant,
    theme: ButtonTheme,
    disabled: boolean
): React.CSSProperties {
    return {
        ...buttonStyles[theme][variant],
        ...(disabled ? disabledButtonStyle : {}),
    };
}

export function UniportButton({
    recipient,
    refundAddress,
    destinationToken,
    amount,
    label = 'Pay with Crypto',
    variant = 'default',
    disabled = false,
    className,
    theme = 'light',
    onSuccess,
    onError,
    onOpenChange,
}: UniportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        if (!disabled) {
            setIsOpen(true);
            onOpenChange?.(true);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        onOpenChange?.(false);
    };

    const style = getButtonStyle(variant, theme, disabled);

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={className}
                style={style}
            >
                <UniportIcon />
                {label}
            </button>

            <UniportModal
                open={isOpen}
                onClose={handleClose}
                recipient={recipient}
                refundAddress={refundAddress}
                destinationToken={destinationToken}
                amount={amount}
                theme={theme}
                onSuccess={onSuccess}
                onError={onError}
            />
        </>
    );
}

function UniportIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
