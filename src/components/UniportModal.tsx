/**
 * UniportModal Component
 */

import React, { useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useUniportPayment } from '../hooks/useUniportPayment';
import type { UniportModalProps } from '../types';

// ============================================================================
// THEME SYSTEM
// ============================================================================

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    overlay: string;
    modalBg: string;
    rowHover: string;
    inputBg: string;
    warningBg: string;
    warningBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    warningText: string;
    btnBg: string;
    btnText: string;
    btnDisabledBg: string;
    btnDisabledText: string;
    iconBtnBg: string;
    iconBtnHover: string;
    iconBtnColor: string;
}

const LIGHT: ThemeColors = {
    overlay: 'rgba(0, 0, 0, 0.42)',
    modalBg: '#ffffff',
    rowHover: '#f5f5f7',
    inputBg: '#f5f5f7',
    warningBg: '#fffbeb',
    warningBorder: 'rgba(245, 158, 11, 0.25)',
    text: '#1c1c1e',
    textSecondary: '#3a3a3c',
    textMuted: '#8e8e93',
    border: '#e5e5ea',
    accent: '#6366f1',
    success: '#30d158',
    error: '#ff3b30',
    warning: '#d97706',
    warningText: '#92400e',
    btnBg: '#1c1c1e',
    btnText: '#ffffff',
    btnDisabledBg: '#e5e5ea',
    btnDisabledText: '#8e8e93',
    iconBtnBg: '#f5f5f7',
    iconBtnHover: '#e5e5ea',
    iconBtnColor: '#3a3a3c',
};

const DARK: ThemeColors = {
    overlay: 'rgba(0, 0, 0, 0.65)',
    modalBg: '#1c1c1e',
    rowHover: '#2c2c2e',
    inputBg: '#2c2c2e',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(235, 235, 245, 0.85)',
    textMuted: '#8e8e93',
    border: '#38383a',
    accent: '#818cf8',
    success: '#30d158',
    error: '#ff453a',
    warning: '#ffd60a',
    warningText: '#ffd60a',
    btnBg: '#6366f1',
    btnText: '#ffffff',
    btnDisabledBg: '#3a3a3c',
    btnDisabledText: '#636366',
    iconBtnBg: '#2c2c2e',
    iconBtnHover: '#3a3a3c',
    iconBtnColor: 'rgba(235, 235, 245, 0.8)',
};

function getTheme(mode: ThemeMode): ThemeColors {
    return mode === 'dark' ? DARK : LIGHT;
}

// ============================================================================
// CSS INJECTION
// ============================================================================

const injectStyles = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('uniport-styles')) return;

    const style = document.createElement('style');
    style.id = 'uniport-styles';
    style.textContent = `
        @keyframes uniport-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes uniport-slide-up {
            from { opacity: 0; transform: translateY(14px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes uniport-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        @keyframes uniport-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.35; }
        }
    `;
    document.head.appendChild(style);
};

// ============================================================================
// ICON WITH FALLBACK
// ============================================================================

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#3b82f6',
    '#14b8a6', '#f97316',
];

function charColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = name.charCodeAt(i) + ((h << 5) - h);
    }
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function TokenAvatar({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
    const [failed, setFailed] = useState(false);

    if (failed || !src) {
        return (
            <div
                aria-label={name}
                style={{
                    width: size, height: size, borderRadius: '50%',
                    background: charColor(name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: Math.round(size * 0.40), fontWeight: 700, color: '#fff',
                    flexShrink: 0, userSelect: 'none', letterSpacing: '-0.01em',
                }}
            >
                {name.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={src} alt={name} width={size} height={size}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
            onError={() => setFailed(true)}
        />
    );
}

// ============================================================================
// SVG ICONS
// ============================================================================

function BackArrow({ color }: { color: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function XMark({ color }: { color: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function ChevronRight({ color }: { color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Spinner({ color }: { color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            style={{ animation: 'uniport-spin 0.75s linear infinite', display: 'block', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 019.95 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

function CopyIcon({ color }: { color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="2" />
        </svg>
    );
}

function CheckMark({ color }: { color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function WarningTriangle({ color }: { color: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function formatPreviewError(error: Error): string {
    if (error.name === 'AbortError') {
        return 'Estimate request was cancelled. Try again.';
    }

    if (error.message === 'Quote request timed out') {
        return 'Could not fetch estimate. Please try again.';
    }

    const normalized = error.message.toLowerCase();

    if (normalized.includes('recipient is not valid')) {
        return 'Recipient address does not match the selected destination chain.';
    }

    if (normalized.includes('refund') && normalized.includes('valid')) {
        return 'Refund address does not match the source chain.';
    }

    if (normalized.includes('amount')) {
        return 'Enter a valid amount to fetch an estimate.';
    }

    return 'Could not fetch estimate. Check the details and try again.';
}

function formatChainLabel(chainId: string): string {
    const labels: Record<string, string> = {
        sui: 'Sui',
        eth: 'Ethereum',
        sol: 'Solana',
        arb: 'Arbitrum',
        base: 'Base',
        op: 'Optimism',
        pol: 'Polygon',
        avax: 'Avalanche',
        bsc: 'BNB Chain',
        near: 'NEAR',
        btc: 'Bitcoin',
        ton: 'TON',
        tron: 'Tron',
        stellar: 'Stellar',
        cardano: 'Cardano',
        xrp: 'XRP Ledger',
        doge: 'Dogecoin',
        ltc: 'Litecoin',
        bch: 'Bitcoin Cash',
        aptos: 'Aptos',
        starknet: 'Starknet',
        bera: 'Berachain',
        zec: 'Zcash',
        gnosis: 'Gnosis',
        monad: 'Monad',
    };

    return labels[chainId] || chainId.toUpperCase();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type ModalStep = 'chain' | 'token' | 'amount';

export function UniportModal({
    open,
    onClose,
    recipient,
    refundAddress,
    destinationToken,
    amount: initialAmount,
    theme: themeMode = 'light',
    onSuccess,
    onError,
}: UniportModalProps) {
    const t = getTheme(themeMode);

    const payment = useUniportPayment({
        recipient, refundAddress, destinationToken,
        amount: initialAmount, onSuccess, onError,
    });

    const [modalStep, setModalStep] = useState<ModalStep>('chain');
    const [copied, setCopied] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    // Portal target — resolved once on mount, never changes
    const [portalRoot, setPortalRoot] = useState<Element | null>(null);
    useEffect(() => {
        setPortalRoot(document.body);
        injectStyles();
    }, []);

    useEffect(() => {
        if (payment.paymentState === 'awaiting_deposit') payment.startPolling();
    }, [payment.paymentState]);

    useEffect(() => { return () => payment.stopPolling(); }, []);

    const handleClose = useCallback(() => {
        payment.reset();
        setModalStep('chain');
        setShowReceipt(false);
        onClose();
    }, [payment, onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        if (open) {
            document.addEventListener('keydown', onKey);
            // Prevent body scroll while modal is open
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', onKey);
                document.body.style.overflow = '';
            };
        }
    }, [open, handleClose]);

    const handleCopy = useCallback(async () => {
        if (payment.quote?.depositAddress) {
            const ok = await payment.copyToClipboard(payment.quote.depositAddress);
            if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
        }
    }, [payment]);

    if (!open || !portalRoot) return null;

    // Derived state
    const { paymentState } = payment;
    const showQR    = paymentState === 'awaiting_deposit' || paymentState === 'processing';
    const isSuccess = paymentState === 'success';
    const isError   = paymentState === 'error';
    const isQuoting = paymentState === 'quoting';
    const canSubmit = !!(
        payment.selectedToken &&
        payment.amount &&
        payment.refundAddress.trim()
    );
    const canPreviewEstimate = !!(
        payment.selectedToken &&
        payment.amount &&
        payment.refundAddress.trim()
    );
    const showBack  = !isSuccess && !isError && (showQR || modalStep !== 'chain');

    // ── Shared style factories (depend on `t`, called during render) ──────────

    const iconBtn: React.CSSProperties = {
        width: 36, height: 36, borderRadius: '50%',
        background: t.iconBtnBg, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s', flexShrink: 0, padding: 0,
    };

    const primaryBtn = (disabled: boolean): React.CSSProperties => ({
        width: '100%', height: 52, borderRadius: '14px', border: 'none',
        background: disabled ? t.btnDisabledBg : t.btnBg,
        color: disabled ? t.btnDisabledText : t.btnText,
        fontSize: '15px', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        fontFamily: 'inherit', letterSpacing: '-0.01em',
    });

    const warningBox: React.CSSProperties = {
        display: 'flex', gap: '9px', alignItems: 'flex-start',
        padding: '11px 13px',
        background: t.warningBg,
        border: `1px solid ${t.warningBorder}`,
        borderRadius: '10px',
    };

    // ── Header ────────────────────────────────────────────────────────────────

    const renderHeader = (title: string) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 18px 0', marginBottom: '12px',
        }}>
            <div style={{ width: 36, display: 'flex' }}>
                {showBack && (
                    <button style={iconBtn}
                        onClick={() => {
                            if (showQR) { payment.cancelQuote(); setModalStep('amount'); }
                            else if (modalStep === 'token') setModalStep('chain');
                            else if (modalStep === 'amount') setModalStep('token');
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = t.iconBtnHover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = t.iconBtnBg; }}
                    >
                        <BackArrow color={t.iconBtnColor} />
                    </button>
                )}
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: t.text, letterSpacing: '-0.015em' }}>
                {title}
            </h2>
            <button style={iconBtn} onClick={handleClose}
                onMouseEnter={e => { e.currentTarget.style.background = t.iconBtnHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.iconBtnBg; }}
            >
                <XMark color={t.iconBtnColor} />
            </button>
        </div>
    );

    // ── Chain step ────────────────────────────────────────────────────────────

    const renderChainStep = () => (
        <>
            {renderHeader('Select network')}
            <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                {payment.chains.map((chain, i) => (
                    <button key={chain.id}
                        onClick={() => { payment.setSelectedChain(chain); setModalStep('token'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            width: '100%', padding: '13px 20px',
                            background: 'transparent', border: 'none',
                            borderBottom: i < payment.chains.length - 1 ? `1px solid ${t.border}` : 'none',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = t.rowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <TokenAvatar src={chain.icon} name={chain.name} size={40} />
                        <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: t.text }}>
                            {chain.name}
                        </span>
                        <ChevronRight color={t.textMuted} />
                    </button>
                ))}
            </div>
        </>
    );

    // ── Token step ────────────────────────────────────────────────────────────

    const renderTokenStep = () => (
        <>
            {renderHeader('Select token')}
            <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                {payment.tokens.map((token, i) => (
                    <button key={token.assetId}
                        onClick={() => { payment.setSelectedToken(token); setModalStep('amount'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            width: '100%', padding: '13px 20px',
                            background: 'transparent', border: 'none',
                            borderBottom: i < payment.tokens.length - 1 ? `1px solid ${t.border}` : 'none',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = t.rowHover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <TokenAvatar src={token.icon} name={token.symbol} size={40} />
                        <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: t.text }}>
                            {token.symbol}
                        </span>
                        <span style={{ fontSize: '13px', color: t.textMuted, fontWeight: 500 }}>
                            {payment.selectedChain?.name}
                        </span>
                    </button>
                ))}
            </div>
        </>
    );

    // ── Amount step ───────────────────────────────────────────────────────────

    const renderAmountStep = () => {
        const tok = payment.selectedToken;
        const ch  = payment.selectedChain;
        return (
            <>
                {renderHeader('Enter amount')}
                <div style={{ padding: '4px 20px 24px' }}>
                    {/* Context chip */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 13px', background: t.inputBg,
                        borderRadius: '12px', marginBottom: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {tok && <TokenAvatar src={tok.icon} name={tok.symbol} size={30} />}
                            <div style={{ marginLeft: -8, marginTop: 12 }}>
                                <TokenAvatar src={payment.destinationToken.icon} name={payment.destinationToken.symbol} size={20} />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>
                                {tok?.symbol} on {ch?.name}
                            </div>
                            <div style={{ fontSize: '12px', color: t.textMuted, marginTop: 1 }}>
                                → {payment.destinationToken.symbol} on {payment.destinationToken.chain.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Big amount input */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                        <input
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={payment.amount}
                            onChange={e => payment.setAmount(e.target.value)}
                            style={{
                                width: '100%', textAlign: 'center',
                                fontSize: '54px', fontWeight: 600,
                                color: payment.amount ? t.text : t.textMuted,
                                background: 'transparent', border: 'none', outline: 'none',
                                caretColor: t.accent, fontFamily: 'inherit',
                                letterSpacing: '-0.04em', lineHeight: 1, padding: 0,
                            }}
                            autoFocus
                        />
                        <div style={{ fontSize: '14px', color: t.textMuted, marginTop: 8 }}>
                            {tok?.symbol}
                        </div>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: t.text,
                                marginBottom: '8px',
                            }}
                        >
                            Refund address on {ch?.name || 'the source chain'}
                        </label>
                        <input
                            type="text"
                            value={payment.refundAddress}
                            onChange={(e) => payment.setRefundAddress(e.target.value)}
                            placeholder={`Enter a ${ch?.name || 'source chain'} refund address`}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            style={{
                                width: '100%',
                                padding: '13px 14px',
                                fontSize: '14px',
                                color: payment.refundAddress ? t.text : t.textMuted,
                                background: t.inputBg,
                                border: `1px solid ${t.border}`,
                                borderRadius: '12px',
                                outline: 'none',
                                fontFamily: 'inherit',
                            }}
                        />
                        <p
                            style={{
                                margin: '8px 0 0',
                                fontSize: '12px',
                                color: t.textMuted,
                                lineHeight: 1.5,
                            }}
                        >
                            Used only if the swap fails. This address must live on the
                            chain the payer is sending from.
                        </p>
                    </div>

                    {/* Live preview */}
                    <div style={{
                        textAlign: 'center', height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, marginBottom: '20px',
                    }}>
                        {canPreviewEstimate && payment.isLoadingPreview && (
                            [0, 0.2, 0.4].map((delay, i) => (
                                <div key={i} style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: t.accent,
                                    animation: `uniport-pulse 1s ease infinite ${delay}s`,
                                }} />
                            ))
                        )}
                        {canPreviewEstimate &&
                            !payment.isLoadingPreview &&
                            payment.previewQuote && (
                            <span style={{ fontSize: '15px', color: t.textSecondary }}>
                                You will receive{' '}
                                <strong style={{ color: t.text }}>
                                    {payment.previewQuote.amountOutFormatted}{' '}
                                    {payment.destinationToken.symbol}
                                </strong>{' '}
                                on{' '}
                                <strong style={{ color: t.text }}>
                                    {formatChainLabel(payment.destinationToken.chain)}
                                </strong>
                            </span>
                        )}
                        {canPreviewEstimate &&
                            !payment.isLoadingPreview &&
                            payment.previewError && (
                            <span style={{ fontSize: '13px', color: t.error }}>
                                {formatPreviewError(payment.previewError)}
                            </span>
                        )}
                        {canPreviewEstimate &&
                            !payment.isLoadingPreview &&
                            !payment.previewQuote &&
                            !payment.previewError && (
                                <span style={{ fontSize: '13px', color: t.textMuted }}>
                                    Fetching estimate…
                                </span>
                            )}
                    </div>

                    {/* Exact-amount warning */}
                    {!!payment.amount && (
                        <div style={{ ...warningBox, marginBottom: '20px' }}>
                            <WarningTriangle color={t.warning} />
                            <p style={{ margin: 0, fontSize: '13px', color: t.warningText, lineHeight: 1.55 }}>
                                You must send{' '}
                                <strong>exactly {payment.amount} {tok?.symbol}</strong>{' '}
                                on <strong>{ch?.name}</strong>. Sending a different amount or asset may result in loss of funds.
                            </p>
                        </div>
                    )}

                    {/* Confirm button */}
                    <button disabled={!canSubmit || isQuoting} onClick={() => payment.fetchQuote()}
                        style={primaryBtn(!canSubmit || isQuoting)}>
                        {isQuoting
                            ? <><Spinner color={t.btnText} /> Getting quote…</>
                            : 'Confirm Payment'
                        }
                    </button>

                    {!payment.refundAddress.trim() && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: t.error, margin: '10px 0 0' }}>
                            Enter a refund address on {ch?.name || 'the source chain'} to continue.
                        </p>
                    )}
                </div>
            </>
        );
    };

    // ── Payment / QR step ─────────────────────────────────────────────────────

    const renderPaymentStep = () => {
        const { quote } = payment;
        const isProcessing = paymentState === 'processing';
        return (
            <>
                {renderHeader(`Send ${payment.amount} ${payment.selectedToken?.symbol ?? ''} on ${payment.selectedChain?.name ?? ''}`)}
                <div style={{ padding: '4px 20px 24px' }}>
                    {quote && (
                        <>
                            {/* QR — always white bg for scannability */}
                            <div style={{
                                background: '#ffffff', borderRadius: '16px', padding: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${t.border}`, marginBottom: '14px',
                            }}>
                                <QRCodeSVG value={quote.depositAddress} size={200} level="M"
                                    bgColor="#ffffff" fgColor="#000000" />
                            </div>

                            {/* Address + copy */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '11px 13px', background: t.inputBg,
                                borderRadius: '10px', marginBottom: '14px',
                                border: `1px solid ${t.border}`,
                            }}>
                                <span style={{
                                    flex: 1, fontSize: '11px', color: t.textSecondary,
                                    fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5,
                                }}>
                                    {quote.depositAddress}
                                </span>
                                <button onClick={handleCopy} title="Copy address"
                                    style={{
                                        flexShrink: 0, width: 34, height: 34, borderRadius: '8px',
                                        background: copied ? `${t.success}18` : t.iconBtnBg,
                                        border: `1px solid ${copied ? t.success + '44' : t.border}`,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', transition: 'all 0.2s',
                                    }}>
                                    {copied ? <CheckMark color={t.success} /> : <CopyIcon color={t.textMuted} />}
                                </button>
                            </div>

                            {/* Send-exactly warning */}
                            <div style={{ ...warningBox, marginBottom: '14px' }}>
                                <WarningTriangle color={t.warning} />
                                <p style={{ margin: 0, fontSize: '13px', color: t.warningText, lineHeight: 1.55 }}>
                                    Only send{' '}
                                    <strong>{payment.amount} {payment.selectedToken?.symbol}</strong>{' '}
                                    on <strong>{payment.selectedChain?.name}</strong> to this address. Other assets may be permanently lost.
                                </p>
                            </div>

                            {/* Details */}
                            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: t.textMuted }}>You'll receive</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>
                                        ≈{quote.amountOutFormatted} {payment.destinationToken.symbol}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: t.textMuted }}>Status</span>
                                    <span style={{
                                        fontSize: '13px', fontWeight: 600,
                                        color: isProcessing ? t.accent : t.warning,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}>
                                        {isProcessing
                                            ? <><Spinner color={t.accent} /> Processing…</>
                                            : <>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: t.warning,
                                                    animation: 'uniport-pulse 1.5s ease infinite',
                                                }} />
                                                Waiting for deposit
                                            </>
                                        }
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </>
        );
    };

    // ── Success step ──────────────────────────────────────────────────────────

    const renderSuccessStep = () => (
        <div style={{ position: 'relative' }}>
            <button style={{ ...iconBtn, position: 'absolute', top: 18, right: 18 }}
                onClick={handleClose}
                onMouseEnter={e => { e.currentTarget.style.background = t.iconBtnHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.iconBtnBg; }}
            >
                <XMark color={t.iconBtnColor} />
            </button>
            <div style={{ padding: '44px 24px 28px', textAlign: 'center' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `${t.success}18`, border: `2px solid ${t.success}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke={t.success} strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
                    Payment sent!
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: t.textMuted, lineHeight: 1.6 }}>
                    {payment.amount} {payment.selectedToken?.symbol}
                    {' → '}≈{payment.quote?.amountOutFormatted} {payment.destinationToken.symbol}
                </p>
                <button onClick={() => setShowReceipt(p => !p)}
                    style={{
                        background: 'transparent', border: 'none', color: t.accent,
                        fontSize: '14px', cursor: 'pointer', textDecoration: 'underline',
                        marginBottom: showReceipt ? 14 : 0, fontFamily: 'inherit',
                    }}>
                    {showReceipt ? 'Hide receipt' : 'View receipt'}
                </button>
                {showReceipt && (
                    <div style={{ background: t.inputBg, borderRadius: '12px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
                        {payment.status?.originTxHashes?.map((hash, i) => (
                            <div key={`o${i}`} style={{ marginBottom: 10 }}>
                                <p style={{ color: t.textMuted, fontSize: '11px', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Source TX · {payment.selectedChain?.name}
                                </p>
                                <a href={`https://etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                                    style={{ color: t.accent, fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}>
                                    {hash.slice(0, 12)}…{hash.slice(-8)} ↗
                                </a>
                            </div>
                        ))}
                        {payment.status?.destinationTxHashes?.map((hash, i) => (
                            <div key={`d${i}`}>
                                <p style={{ color: t.textMuted, fontSize: '11px', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Destination TX
                                </p>
                                <span style={{ color: t.textSecondary, fontSize: '12px', fontFamily: 'monospace' }}>
                                    {hash.slice(0, 12)}…{hash.slice(-8)}
                                </span>
                            </div>
                        ))}
                        {!payment.status?.originTxHashes?.length && !payment.status?.destinationTxHashes?.length && (
                            <p style={{ color: t.textMuted, fontSize: '13px', margin: 0 }}>Loading transaction details…</p>
                        )}
                    </div>
                )}
                <button onClick={handleClose} style={primaryBtn(false)}>Done</button>
            </div>
        </div>
    );

    // ── Error step ────────────────────────────────────────────────────────────

    const renderErrorStep = () => (
        <div style={{ position: 'relative' }}>
            <button style={{ ...iconBtn, position: 'absolute', top: 18, right: 18 }}
                onClick={handleClose}
                onMouseEnter={e => { e.currentTarget.style.background = t.iconBtnHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.iconBtnBg; }}
            >
                <XMark color={t.iconBtnColor} />
            </button>
            <div style={{ padding: '44px 24px 28px', textAlign: 'center' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `${t.error}18`, border: `2px solid ${t.error}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <XMark color={t.error} />
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
                    Payment failed
                </h2>
                <p style={{ margin: '0 0 28px', fontSize: '14px', color: t.textMuted, lineHeight: 1.6 }}>
                    {payment.error?.message || 'Something went wrong. Please try again.'}
                </p>
                <button onClick={() => { payment.reset(); setModalStep('chain'); }}
                    style={{ ...primaryBtn(false), background: 'transparent', border: `1.5px solid ${t.border}`, color: t.text }}>
                    Try again
                </button>
            </div>
        </div>
    );

    // ── Routing ───────────────────────────────────────────────────────────────

    const renderContent = () => {
        if (isSuccess) return renderSuccessStep();
        if (isError)   return renderErrorStep();
        if (showQR)    return renderPaymentStep();
        if (modalStep === 'chain')  return renderChainStep();
        if (modalStep === 'token')  return renderTokenStep();
        return renderAmountStep();
    };

    // ── Portal render — bypasses all parent stacking contexts ─────────────────

    return ReactDOM.createPortal(
        <div
            style={{
                // This overlay must live at the top of the DOM stacking order.
                // By portaling into document.body we escape any parent element that
                // has transform, filter, or backdrop-filter (all of which would
                // otherwise break position:fixed, making it relative to that element
                // rather than the viewport).
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2147483647, // max z-index
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                // Overlay colour + frosted effect applied here (on the backdrop),
                // NOT on the modal card itself.
                backgroundColor: t.overlay,
                backdropFilter: 'blur(18px) saturate(180%)',
                WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                animation: 'uniport-fade-in 0.18s ease',
            }}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '440px',
                    // Solid card — no glassmorphism on the card itself
                    background: t.modalBg,
                    borderRadius: '20px',
                    boxShadow: themeMode === 'light'
                        ? '0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)'
                        : '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    // Only the initial modal mount gets the slide-up animation.
                    // Content transitions (chain→token→amount) use plain renders,
                    // not component remounts, so polling re-renders don't re-trigger it.
                    animation: 'uniport-slide-up 0.22s ease',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {renderContent()}
            </div>
        </div>,
        portalRoot
    );
}
