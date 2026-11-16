/**
 * UniportModal Component
 */

import React, { useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useUniportPayment } from '../hooks/useUniportPayment';
import { CHAINS, getExplorerTxUrl, usesEvmAddress, type ChainId } from '../core/tokens';
import { UNIPORT_ENS_NAME } from '../core/ens';
import { formatDisplayAmount, isAppSetupError, isRateLimitError } from '../core/intents';
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

function SearchIcon({ color }: { color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/** The Uniport mark, drawn in whatever colour the text around it has. */
function UniportMark({ size = 12 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 1560 1560" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M805.4 1558.5C840.4 1553.9 873.3 1539.7 901.1 1517.1C905.2 1513.8 1045.5 1374 1213 1206.3C1444.7 974.5 1519 899.6 1523.2 893.5C1548.3 857.8 1560 821.6 1560 780C1560 735.3 1545.2 693.3 1517.2 659C1513.9 654.9 1435.7 576.1 1343.6 484L1176 316.5L1062.7 430C985 507.8 946.2 547.4 939.2 556C887 619.8 860.4 679.1 846 763.9C843.5 778.6 840 805.9 835.5 845.5C829.7 896.7 825.3 923.7 818.5 951C802 1017.1 775.1 1068.6 728 1124.1C722.3 1130.9 668.1 1186.1 607.6 1246.8L497.5 1357L574.5 1434.1C616.9 1476.5 654.8 1513.8 658.9 1517.1C688.1 1540.8 720.9 1554.5 760.5 1559.3C768.7 1560.3 795.1 1559.8 805.4 1558.5ZM496.6 1130.8C558.2 1069 612.3 1014.2 616.7 1009C665.3 951.5 693.9 893.5 709 822.1C714.5 796.1 717.8 773.6 724.5 714.5C730.5 661.5 734.6 636.8 742.1 606.6C757.8 543.3 786.8 488.5 833.1 434.5C838.8 427.9 892.7 373.1 952.9 312.7L1062.5 203L985.5 125.9C943.1 83.5 905.2 46.2 901.1 42.9C866.2 14.6 824.9 -0 779.7 0C738 0.1 702.3 11.7 666.5 36.8C660.4 41.1 585.5 115.3 353.7 347C186 514.5 46.2 654.8 42.9 658.9C14.6 693.8 -0 735.1 0 780.3C0.1 822 11.7 857.8 36.8 893.5C41 899.5 85.2 944.4 212.9 1072.2C306.7 1166.2 383.7 1243 384 1243C384.3 1243 435 1192.5 496.6 1130.8Z" />
        </svg>
    );
}

/** Lists longer than this get a search box. */
const SEARCH_THRESHOLD = 8;

function formatPreviewError(error: Error): string {
    // These already carry a message written for the payer.
    if (isAppSetupError(error) || isRateLimitError(error)) {
        return error.message;
    }

    if (error.name === 'AbortError') {
        return 'Estimate request was cancelled. Try again.';
    }

    if (error.message === 'Quote request timed out') {
        return 'Could not fetch estimate. Please try again.';
    }

    const normalized = error.message.toLowerCase();

    if (normalized.includes('trustline')) {
        return 'This Stellar recipient must enable the selected asset before it can receive funds.';
    }

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
    return CHAINS[chainId as ChainId]?.name ?? chainId.toUpperCase();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type ModalStep = 'chain' | 'token' | 'amount';

export function UniportModal({
    appId,
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
        appId, recipient, refundAddress, destinationToken,
        amount: initialAmount, onSuccess, onError,
    });

    const [modalStep, setModalStep] = useState<ModalStep>('chain');
    const [copiedField, setCopiedField] = useState<'address' | 'memo' | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [chainQuery, setChainQuery] = useState('');
    const [tokenQuery, setTokenQuery] = useState('');

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
        setChainQuery('');
        setTokenQuery('');
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

    const handleCopy = useCallback(async (field: 'address' | 'memo', text: string) => {
        const ok = await payment.copyToClipboard(text);
        if (ok) { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); }
    }, [payment]);

    if (!open || !portalRoot) return null;

    // Derived state
    const { paymentState } = payment;
    const showQR    = paymentState === 'awaiting_deposit' || paymentState === 'processing';
    const isSuccess = paymentState === 'success';
    const isError   = paymentState === 'error';
    const isQuoting = paymentState === 'quoting';
    const isExactOutput = initialAmount !== undefined;
    const canPreviewEstimate = !!(
        payment.selectedToken &&
        payment.amount &&
        (isExactOutput || payment.effectiveRefundAddress)
    );
    const canSubmit = !!(
        canPreviewEstimate &&
        payment.previewQuote &&
        !payment.previewError &&
        !payment.isLoadingPreview
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

    // ── Search box ────────────────────────────────────────────────────────────

    const renderSearch = (value: string, onChange: (value: string) => void, label: string) => (
        <div style={{ padding: '0 18px 10px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '0 12px', height: 40,
                background: t.inputBg, borderRadius: '10px',
            }}>
                <SearchIcon color={t.textMuted} />
                <input
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={label}
                    placeholder={label}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    // Set inline so a host page's focus styles (rings, coloured
                    // borders) don't show on this input.
                    style={{
                        flex: 1, minWidth: 0, height: '100%',
                        background: 'transparent', border: 'none',
                        outline: 'none', boxShadow: 'none',
                        // 16px keeps iOS from zooming the page on focus.
                        fontSize: '16px', color: t.text, fontFamily: 'inherit',
                        padding: 0, margin: 0, borderRadius: 0,
                        WebkitAppearance: 'none', appearance: 'none',
                    }}
                />
                {value && (
                    <button type="button" aria-label="Clear search" onClick={() => onChange('')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: '50%', padding: 0,
                            border: 'none', background: 'transparent', cursor: 'pointer',
                        }}>
                        <XMark color={t.textMuted} />
                    </button>
                )}
            </div>
        </div>
    );

    const plainList: React.CSSProperties = { overflowY: 'auto', maxHeight: 420 };
    // A steady height while searching, so the modal doesn't jump as results narrow.
    const searchableList: React.CSSProperties = { overflowY: 'auto', height: 'min(420px, 52vh)' };

    const renderNoMatches = (what: string, query: string) => (
        <p style={{ margin: 0, padding: '28px 20px', textAlign: 'center', fontSize: '14px', color: t.textMuted }}>
            No {what} match “{query.trim()}”.
        </p>
    );

    const matches = (text: string, query: string) =>
        text.toLowerCase().includes(query.trim().toLowerCase());

    // ── Chain step ────────────────────────────────────────────────────────────

    const renderChainStep = () => {
        const chains = payment.chains.filter(chain => matches(chain.name, chainQuery));
        return (
        <>
            {renderHeader('Select network')}
            {payment.chains.length > SEARCH_THRESHOLD && renderSearch(chainQuery, setChainQuery, 'Search networks')}
            <div style={payment.chains.length > SEARCH_THRESHOLD ? searchableList : plainList}>
                {chains.length === 0 && renderNoMatches('networks', chainQuery)}
                {chains.map((chain, i) => (
                    <button key={chain.id}
                        onClick={() => { payment.setSelectedChain(chain); setTokenQuery(''); setModalStep('token'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            width: '100%', padding: '13px 20px',
                            background: 'transparent', border: 'none',
                            borderBottom: i < chains.length - 1 ? `1px solid ${t.border}` : 'none',
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
    };

    // ── Token step ────────────────────────────────────────────────────────────

    const renderTokenStep = () => {
        const tokens = payment.tokens.filter(token => matches(token.symbol, tokenQuery));
        return (
        <>
            {renderHeader('Select token')}
            {payment.tokens.length > SEARCH_THRESHOLD && renderSearch(tokenQuery, setTokenQuery, 'Search tokens')}
            <div style={payment.tokens.length > SEARCH_THRESHOLD ? searchableList : plainList}>
                {tokens.length === 0 && renderNoMatches('tokens', tokenQuery)}
                {tokens.map((token, i) => (
                    <button key={token.assetId}
                        onClick={() => { payment.setSelectedToken(token); setModalStep('amount'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            width: '100%', padding: '13px 20px',
                            background: 'transparent', border: 'none',
                            borderBottom: i < tokens.length - 1 ? `1px solid ${t.border}` : 'none',
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
    };

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
                                → {payment.destinationToken.symbol} on {formatChainLabel(payment.destinationToken.chain)}
                            </div>
                        </div>
                    </div>

                    {/* Big amount input */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                        <input
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={payment.amount}
                            onChange={e => payment.setAmount(e.target.value)}
                            readOnly={isExactOutput}
                            style={{
                                width: '100%', textAlign: 'center',
                                fontSize: '54px', fontWeight: 600,
                                color: payment.amount ? t.text : t.textMuted,
                                background: 'transparent', border: 'none', outline: 'none',
                                caretColor: t.accent, fontFamily: 'inherit',
                                letterSpacing: '-0.04em', lineHeight: 1, padding: 0,
                            }}
                            autoFocus={!isExactOutput}
                        />
                        <div style={{ fontSize: '14px', color: t.textMuted, marginTop: 8 }}>
                            {isExactOutput
                                ? payment.destinationToken.symbol
                                : tok?.symbol}
                        </div>
                    </div>

                    {!isExactOutput && <div style={{ marginBottom: '18px' }}>
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
                            {ch && usesEvmAddress(ch.id) && (
                                <span style={{ fontWeight: 400, color: t.textMuted }}> (optional)</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={payment.refundAddress}
                            onChange={(e) => payment.setRefundAddress(e.target.value)}
                            placeholder={
                                ch && usesEvmAddress(ch.id)
                                    ? `Optional — defaults to ${UNIPORT_ENS_NAME}`
                                    : `Enter a ${ch?.name || 'source chain'} refund address`
                            }
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
                            {payment.isUsingDefaultRefundAddress
                                ? `Used only if the swap fails. You can enter your own address, or leave blank to use Uniport's default (${UNIPORT_ENS_NAME}).`
                                : 'Used only if the swap fails. This address must live on the chain the payer is sending from.'}
                        </p>
                        {ch?.id === 'stellar' && tok?.symbol !== 'XLM' && (
                            <p
                                style={{
                                    margin: '6px 0 0',
                                    fontSize: '12px',
                                    color: t.warning,
                                    lineHeight: 1.5,
                                }}
                            >
                                This refund address must already have a trustline for {tok?.symbol} on Stellar, or a refund cannot be delivered to it.
                            </p>
                        )}
                    </div>}

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
                                {isExactOutput ? 'You will send ' : 'You will receive '}
                                <strong style={{ color: t.text }}>
                                    {isExactOutput
                                        ? payment.previewQuote.paymentAmountInFormatted
                                        : formatDisplayAmount(payment.previewQuote.amountOutFormatted)}{' '}
                                    {isExactOutput
                                        ? tok?.symbol
                                        : payment.destinationToken.symbol}
                                </strong>{' '}
                                on{' '}
                                <strong style={{ color: t.text }}>
                                    {isExactOutput
                                        ? ch?.name
                                        : formatChainLabel(payment.destinationToken.chain)}
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
                    {!!payment.amount && !isExactOutput && (
                        <div style={{ ...warningBox, marginBottom: '20px' }}>
                            <WarningTriangle color={t.warning} />
                            <p style={{ margin: 0, fontSize: '13px', color: t.warningText, lineHeight: 1.55 }}>
                                You must send{' '}
                                <strong>exactly {payment.amount} {tok?.symbol}</strong>{' '}
                                on <strong>{ch?.name}</strong>. Sending a different amount or asset may result in loss of funds.
                            </p>
                        </div>
                    )}

                    {isExactOutput && payment.previewQuote && (
                        <div style={{ ...warningBox, marginBottom: '20px' }}>
                            <WarningTriangle color={t.warning} />
                            <p style={{ margin: 0, fontSize: '13px', color: t.warningText, lineHeight: 1.55 }}>
                                To receive <strong>exactly {payment.amount} {payment.destinationToken.symbol}</strong>,
                                send <strong>{payment.previewQuote.paymentAmountInFormatted} {tok?.symbol}</strong> on <strong>{ch?.name}</strong>.
                                {payment.previewQuote.roundingRemainder !== '0' && (
                                    <> The rounded surplus is {payment.previewQuote.roundingRemainderFormatted} {tok?.symbol}.</>
                                )}
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

                    {!isExactOutput && !payment.effectiveRefundAddress && (
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
        const sendAmount = quote?.paymentAmountInFormatted || payment.amount;
        return (
            <>
                {renderHeader(`Send ${sendAmount} ${payment.selectedToken?.symbol ?? ''} on ${payment.selectedChain?.name ?? ''}`)}
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
                                borderRadius: '10px', marginBottom: quote.memo ? '10px' : '14px',
                                border: `1px solid ${t.border}`,
                            }}>
                                <span style={{
                                    flex: 1, fontSize: '11px', color: t.textSecondary,
                                    fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5,
                                }}>
                                    {quote.depositAddress}
                                </span>
                                <button onClick={() => handleCopy('address', quote.depositAddress)} title="Copy address"
                                    style={{
                                        flexShrink: 0, width: 34, height: 34, borderRadius: '8px',
                                        background: copiedField === 'address' ? `${t.success}18` : t.iconBtnBg,
                                        border: `1px solid ${copiedField === 'address' ? t.success + '44' : t.border}`,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', transition: 'all 0.2s',
                                    }}>
                                    {copiedField === 'address' ? <CheckMark color={t.success} /> : <CopyIcon color={t.textMuted} />}
                                </button>
                            </div>

                            {/* Memo — required by some chains (Stellar, TON, XRP). Just as
                                load-bearing as the address: omitting it can strand funds. */}
                            {quote.memo && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '11px 13px', background: `${t.warning}0f`,
                                    borderRadius: '10px', marginBottom: '14px',
                                    border: `1px solid ${t.warning}44`,
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.warning, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Memo required
                                        </p>
                                        <span style={{
                                            fontSize: '13px', color: t.text,
                                            fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4,
                                        }}>
                                            {quote.memo}
                                        </span>
                                    </div>
                                    <button onClick={() => handleCopy('memo', quote.memo!)} title="Copy memo"
                                        style={{
                                            flexShrink: 0, width: 34, height: 34, borderRadius: '8px',
                                            background: copiedField === 'memo' ? `${t.success}18` : t.iconBtnBg,
                                            border: `1px solid ${copiedField === 'memo' ? t.success + '44' : t.border}`,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', transition: 'all 0.2s',
                                        }}>
                                        {copiedField === 'memo' ? <CheckMark color={t.success} /> : <CopyIcon color={t.textMuted} />}
                                    </button>
                                </div>
                            )}

                            {/* Send-exactly warning */}
                            <div style={{ ...warningBox, marginBottom: '14px' }}>
                                <WarningTriangle color={t.warning} />
                                <p style={{ margin: 0, fontSize: '13px', color: t.warningText, lineHeight: 1.55 }}>
                                    Only send{' '}
                                    <strong>{sendAmount} {payment.selectedToken?.symbol}</strong>{' '}
                                    on <strong>{payment.selectedChain?.name}</strong> to this address
                                    {quote.memo && <> <strong>with the memo above</strong></>}. Other assets may be permanently lost
                                    {quote.memo && <>, and omitting the memo may make your deposit unrecoverable</>}.
                                </p>
                            </div>

                            {/* Details */}
                            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: t.textMuted }}>You'll receive</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>
                                        {isExactOutput ? '' : '≈'}{formatDisplayAmount(quote.amountOutFormatted)} {payment.destinationToken.symbol}
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

    // Prefer the explorer link 1Click returns; fall back to our own per-chain table.
    const txUrl = (reported: string | null | undefined, chain: ChainId | undefined, hash: string) =>
        reported?.startsWith('https://') ? reported : chain ? getExplorerTxUrl(chain, hash) : undefined;

    // Link to the chain's block explorer; plain text if no explorer is mapped.
    const renderTxHash = (hash: string, url: string | undefined) =>
        url ? (
            <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ color: t.accent, fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}>
                {hash.slice(0, 12)}…{hash.slice(-8)} ↗
            </a>
        ) : (
            <span style={{ color: t.textSecondary, fontSize: '12px', fontFamily: 'monospace' }}>
                {hash.slice(0, 12)}…{hash.slice(-8)}
            </span>
        );

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
                    {payment.quote?.paymentAmountInFormatted || payment.amount} {payment.selectedToken?.symbol}
                    {' → '}{isExactOutput ? '' : '≈'}{formatDisplayAmount(payment.quote?.amountOutFormatted)} {payment.destinationToken.symbol}
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
                                {renderTxHash(hash, txUrl(payment.status?.originTxExplorerUrls?.[i], payment.selectedChain?.id, hash))}
                            </div>
                        ))}
                        {payment.status?.destinationTxHashes?.map((hash, i) => (
                            <div key={`d${i}`}>
                                <p style={{ color: t.textMuted, fontSize: '11px', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Destination TX · {CHAINS[payment.destinationToken.chain].name}
                                </p>
                                {renderTxHash(hash, txUrl(payment.status?.destinationTxExplorerUrls?.[i], payment.destinationToken.chain, hash))}
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
                <a
                    href="https://uniport.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        flexShrink: 0, padding: '11px 16px 13px',
                        borderTop: `1px solid ${t.border}`,
                        fontSize: '12px', fontWeight: 500, lineHeight: 1,
                        color: t.textMuted, textDecoration: 'none',
                    }}
                >
                    Powered by
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: t.textSecondary, fontWeight: 600 }}>
                        <UniportMark size={12} />
                        Uniport
                    </span>
                </a>
            </div>
        </div>,
        portalRoot
    );
}
