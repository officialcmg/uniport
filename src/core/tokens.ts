/**
 * Uniport Token Definitions
 * 
 * Importable token constants for the Uniport SDK.
 * Usage: import { arbitrumUSDC, solanaSOL, suiSUI, CHAINS } from 'uniport-sdk'
 * 
 * Token naming convention: {chain}{Symbol}
 * Example: arbitrumUSDC, ethereumETH, suiSUI
 */

// ============================================================================
// TOKEN ICONS - Shared across chains (same token = same icon)
// ============================================================================

export const TOKEN_ICONS = {
    // Stablecoins
    USDC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    USDT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    DAI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeEC495271d0F/logo.png',

    // Major tokens
    ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    WETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    BTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    WBTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',

    // L1s & L2s
    SUI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
    SOL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    NEAR: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
    ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    OP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    POL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    BASE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',

    // Other L1s
    ADA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
    XRP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
    DOGE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
    LTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
    BCH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png',
    TON: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png',
    TRX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
    XLM: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png',
    APT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',

    // DeFi & Others
    AAVE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437BFc5Ac33E2DDaE9/logo.png',
    UNI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    SHIB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
    PEPE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',

    // Ecosystem tokens
    STRK: 'https://coin-images.coingecko.com/coins/images/26433/large/starknet.png',
    BERA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/31645.png',
    GNO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6810e776880C02933D47DB1b9fc05908e5386b96/logo.png',
    MON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33868.png',
    ZEC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zcash/info/logo.png',

    // Meme coins
    TRUMP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/35336.png',
    WIF: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png',
    BRETT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29743.png',
    TURBO: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24911.png',

    // Default fallback
    DEFAULT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
} as const;

// ============================================================================
// CHAIN ICONS
// ============================================================================

export const CHAIN_ICONS = {
    sui: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
    eth: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    arb: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    base: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
    op: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    sol: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    btc: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    near: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
    pol: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    avax: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    bsc: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    ton: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png',
    tron: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
    stellar: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png',
    cardano: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
    aptos: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
    gnosis: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png',
    starknet: 'https://coin-images.coingecko.com/coins/images/26433/large/starknet.png',
    bera: 'https://s2.coinmarketcap.com/static/img/coins/64x64/31645.png',
    monad: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33868.png',
    doge: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
    ltc: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
    bch: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png',
    xrp: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
    zec: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zcash/info/logo.png',
    scroll: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type ChainId = keyof typeof CHAIN_ICONS;

/** Chains that use EVM-style addresses (0x...), as opposed to chain-specific formats. */
export const EVM_CHAINS: ChainId[] = [
    'eth', 'arb', 'base', 'op', 'pol', 'avax', 'bsc', 'gnosis', 'bera', 'monad', 'scroll',
];

export function isEvmChain(chain: ChainId): boolean {
    return EVM_CHAINS.includes(chain);
}

/**
 * Chains whose deposit transactions require a memo/tag alongside the deposit
 * address (1Click's `depositMode: MEMO`), without which funds can be lost.
 *
 * This list is verified empirically against the live 1Click API, not derived
 * from documentation — deposit-mode requirements vary per chain and per
 * asset in ways the API's own docs don't fully specify. Confirmed via direct
 * quote requests: Stellar requires MEMO (rejects quotes without it); TON and
 * XRP do not use MEMO mode at all (their assets settle with SIMPLE deposits
 * and never populate a memo). If a new memo-requiring chain is added, verify
 * it live the same way before adding it here.
 */
export const CHAINS_REQUIRING_MEMO: ChainId[] = ['stellar'];

export function needsMemoDeposit(chain: ChainId): boolean {
    return CHAINS_REQUIRING_MEMO.includes(chain);
}

// ============================================================================
// BLOCK EXPLORERS
// ============================================================================

/** Per-chain transaction explorer URL builders */
const EXPLORER_TX_URLS: Record<ChainId, (hash: string) => string> = {
    eth: (h) => `https://etherscan.io/tx/${h}`,
    arb: (h) => `https://arbiscan.io/tx/${h}`,
    base: (h) => `https://basescan.org/tx/${h}`,
    op: (h) => `https://optimistic.etherscan.io/tx/${h}`,
    pol: (h) => `https://polygonscan.com/tx/${h}`,
    avax: (h) => `https://snowtrace.io/tx/${h}`,
    bsc: (h) => `https://bscscan.com/tx/${h}`,
    gnosis: (h) => `https://gnosisscan.io/tx/${h}`,
    bera: (h) => `https://berascan.com/tx/${h}`,
    monad: (h) => `https://monadvision.com/tx/${h}`,
    sui: (h) => `https://suivision.xyz/txblock/${h}`,
    sol: (h) => `https://solscan.io/tx/${h}`,
    btc: (h) => `https://mempool.space/tx/${h}`,
    near: (h) => `https://nearblocks.io/txns/${h}`,
    ton: (h) => `https://tonviewer.com/transaction/${h}`,
    tron: (h) => `https://tronscan.org/#/transaction/${h}`,
    stellar: (h) => `https://stellar.expert/explorer/public/tx/${h}`,
    cardano: (h) => `https://cardanoscan.io/transaction/${h}`,
    aptos: (h) => `https://explorer.aptoslabs.com/txn/${h}?network=mainnet`,
    starknet: (h) => `https://voyager.online/tx/${h}`,
    doge: (h) => `https://dogechain.info/tx/${h}`,
    ltc: (h) => `https://litecoinspace.org/tx/${h}`,
    bch: (h) => `https://blockchair.com/bitcoin-cash/transaction/${h}`,
    xrp: (h) => `https://xrpscan.com/tx/${h}`,
    zec: (h) => `https://blockchair.com/zcash/transaction/${h}`,
    scroll: (h) => `https://scrollscan.com/tx/${h}`,
};

/** Build a block-explorer URL for a transaction hash on a given chain. */
export function getExplorerTxUrl(
    chain: ChainId,
    hash: string
): string | undefined {
    return EXPLORER_TX_URLS[chain]?.(hash);
}

export interface Token {
    /** Readable name: arbitrumUSDC, suiSUI */
    name: string;
    /** Backward-compatible identifiers accepted by the SDK */
    aliases?: string[];
    /** Display symbol: USDC, SUI, ETH */
    symbol: string;
    /** 1Click API asset ID */
    assetId: string;
    /** Chain identifier */
    chain: ChainId;
    /** Token decimals */
    decimals: number;
    /** Token icon URL */
    icon: string;
    /** Chain icon URL */
    chainIcon: string;
    /** Contract address on the chain (if applicable) */
    contractAddress?: string;
}

export interface Chain {
    id: ChainId;
    name: string;
    icon: string;
    tokens: Token[];
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

function createToken(
    chain: ChainId,
    symbol: string,
    assetId: string,
    decimals: number,
    contractAddress?: string,
    options?: {
        name?: string;
        aliases?: string[];
    }
): Token {
    const normalizedSymbol = symbol.replace('$', '').replace(' ', '');
    const canonicalPrefix = TOKEN_NAME_PREFIXES[chain] || chain;
    const legacyName = `${chain}${normalizedSymbol}`;
    const name = options?.name || `${canonicalPrefix}${normalizedSymbol}`;
    const icon = TOKEN_ICONS[symbol as keyof typeof TOKEN_ICONS] || TOKEN_ICONS.DEFAULT;
    const chainIcon = CHAIN_ICONS[chain];
    const aliases = new Set(options?.aliases || []);

    if (legacyName !== name) {
        aliases.add(legacyName);
    }

    return {
        name,
        aliases: aliases.size > 0 ? Array.from(aliases) : undefined,
        symbol,
        assetId,
        chain,
        decimals,
        icon,
        chainIcon,
        contractAddress,
    };
}

const TOKEN_NAME_PREFIXES: Partial<Record<ChainId, string>> = {
    eth: 'ethereum',
    arb: 'arbitrum',
    op: 'optimism',
    sol: 'solana',
    btc: 'bitcoin',
    pol: 'polygon',
    avax: 'avalanche',
    doge: 'dogecoin',
    ltc: 'litecoin',
    bch: 'bitcoinCash',
    bera: 'berachain',
    zec: 'zcash',
};

// ============================================================================
// SUI TOKENS
// ============================================================================

export const suiSUI = createToken('sui', 'SUI', 'nep141:sui.omft.near', 9);
export const suiUSDC = createToken('sui', 'USDC', 'nep141:sui-c1b81ecaf27933252d31a963bc5e9458f13c18ce.omft.near', 6, '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC');

// ============================================================================
// ETHEREUM TOKENS
// ============================================================================

export const ethereumETH = createToken('eth', 'ETH', 'nep141:eth.omft.near', 18);
export const ethereumUSDC = createToken('eth', 'USDC', 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near', 6, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
export const ethereumUSDT = createToken('eth', 'USDT', 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near', 6, '0xdac17f958d2ee523a2206206994597c13d831ec7');
export const ethereumWBTC = createToken('eth', 'WBTC', 'nep141:eth-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.omft.near', 8, '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599');
export const ethereumDAI = createToken('eth', 'DAI', 'nep141:eth-0x6b175474e89094c44da98b954eedeac495271d0f.omft.near', 18, '0x6b175474e89094c44da98b954eedeac495271d0f');
export const ethereumAAVE = createToken('eth', 'AAVE', 'nep141:eth-0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.omft.near', 18, '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9');
export const ethereumUNI = createToken('eth', 'UNI', 'nep141:eth-0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.omft.near', 18, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984');
export const ethereumLINK = createToken('eth', 'LINK', 'nep141:eth-0x514910771af9ca656af840dff83e8264ecf986ca.omft.near', 18, '0x514910771af9ca656af840dff83e8264ecf986ca');
export const ethereumSHIB = createToken('eth', 'SHIB', 'nep141:eth-0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce.omft.near', 18, '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce');
export const ethereumPEPE = createToken('eth', 'PEPE', 'nep141:eth-0x6982508145454ce325ddbe47a25d4ec3d2311933.omft.near', 18, '0x6982508145454ce325ddbe47a25d4ec3d2311933');
export const ethereumTURBO = createToken('eth', 'TURBO', 'nep141:eth-0xa35923162c49cf95e6bf26623385eb431ad920d3.omft.near', 18, '0xa35923162c49cf95e6bf26623385eb431ad920d3');
export const ethereumSAFE = createToken('eth', 'SAFE', 'nep141:eth-0x5afe3855358e112b5647b952709e6165e1c1eeee.omft.near', 18, '0x5afe3855358e112b5647b952709e6165e1c1eeee');

// ============================================================================
// ARBITRUM TOKENS
// ============================================================================

export const arbitrumETH = createToken('arb', 'ETH', 'nep141:arb.omft.near', 18);
export const arbitrumUSDC = createToken('arb', 'USDC', 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near', 6, '0xaf88d065e77c8cc2239327c5edb3a432268e5831');
export const arbitrumUSDT = createToken('arb', 'USDT', 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near', 6, '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9');
export const arbitrumARB = createToken('arb', 'ARB', 'nep141:arb-0x912ce59144191c1204e64559fe8253a0e49e6548.omft.near', 18, '0x912ce59144191c1204e64559fe8253a0e49e6548');
export const arbitrumGMX = createToken('arb', 'GMX', 'nep141:arb-0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a.omft.near', 18, '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a');

// ============================================================================
// BASE TOKENS
// ============================================================================

export const baseETH = createToken('base', 'ETH', 'nep141:base.omft.near', 18);
export const baseUSDC = createToken('base', 'USDC', 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near', 6, '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
export const baseCbBTC = createToken('base', 'cbBTC', 'nep141:base-0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf.omft.near', 8, '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', { name: 'baseCbBTC' });
export const baseBRETT = createToken('base', 'BRETT', 'nep141:base-0x532f27101965dd16442e59d40670faf5ebb142e4.omft.near', 18, '0x532f27101965dd16442e59d40670faf5ebb142e4');

// ============================================================================
// SCROLL TOKENS
// ============================================================================

export const scrollETH = createToken('scroll', 'ETH', 'nep245:v2_1.omni.hot.tg:534352_11111111111111111111', 18);
export const scrollUSDT = createToken('scroll', 'USDT', 'nep245:v2_1.omni.hot.tg:534352_4RG3Q2wFsMQmd45m5m89RjsLfupA', 6, '0xf55bec9cafdbe8730f096aa55dad6d22d44099df');

// ============================================================================
// OPTIMISM TOKENS
// ============================================================================

export const optimismETH = createToken('op', 'ETH', 'nep245:v2_1.omni.hot.tg:10_11111111111111111111', 18);
export const optimismUSDC = createToken('op', 'USDC', 'nep245:v2_1.omni.hot.tg:10_A2ewyUyDp6qsue1jqZsGypkCxRJ', 6, '0x0b2c639c533813f4aa9d7837caf62653d097ff85');
export const optimismUSDT = createToken('op', 'USDT', 'nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo', 6, '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58');
export const optimismOP = createToken('op', 'OP', 'nep245:v2_1.omni.hot.tg:10_vLAiSt9KfUGKpw5cD3vsSyNYBo7', 18, '0x4200000000000000000000000000000000000042');

// ============================================================================
// SOLANA TOKENS
// ============================================================================

export const solanaSOL = createToken('sol', 'SOL', 'nep141:sol.omft.near', 9);
export const solanaUSDC = createToken('sol', 'USDC', 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near', 6, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const solanaUSDT = createToken('sol', 'USDT', 'nep141:sol-c800a4bd850783ccb82c2b2c7e84175443606352.omft.near', 6, 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
export const solanaTRUMP = createToken('sol', 'TRUMP', 'nep141:sol-c58e6539c2f2e097c251f8edf11f9c03e581f8d4.omft.near', 6, '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN');
export const solanaWIF = createToken('sol', '$WIF', 'nep141:sol-b9c68f94ec8fd160137af8cdfe5e61cd68e2afba.omft.near', 6, 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm');
export const solanaMELANIA = createToken('sol', 'MELANIA', 'nep141:sol-d600e625449a4d9380eaf5e3265e54c90d34e260.omft.near', 6, 'FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P');

// ============================================================================
// BITCOIN
// ============================================================================

export const bitcoinBTC = createToken('btc', 'BTC', 'nep141:btc.omft.near', 8);

// ============================================================================
// POLYGON TOKENS
// ============================================================================

export const polygonPOL = createToken('pol', 'POL', 'nep245:v2_1.omni.hot.tg:137_11111111111111111111', 18);
export const polygonUSDC = createToken('pol', 'USDC', 'nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L', 6, '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359');
export const polygonUSDT = createToken('pol', 'USDT', 'nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr', 6, '0xc2132d05d31c914a87c6611c10748aeb04b58e8f');

// ============================================================================
// AVALANCHE TOKENS
// ============================================================================

export const avalancheAVAX = createToken('avax', 'AVAX', 'nep245:v2_1.omni.hot.tg:43114_11111111111111111111', 18);
export const avalancheUSDC = createToken('avax', 'USDC', 'nep245:v2_1.omni.hot.tg:43114_3atVJH3r5c4GqiSYmg9fECvjc47o', 6, '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e');
export const avalancheUSDT = createToken('avax', 'USDT', 'nep245:v2_1.omni.hot.tg:43114_372BeH7ENZieCaabwkbWkBiTTgXp', 6, '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7');

// ============================================================================
// BSC TOKENS
// ============================================================================

export const bscBNB = createToken('bsc', 'BNB', 'nep245:v2_1.omni.hot.tg:56_11111111111111111111', 18);
export const bscUSDC = createToken('bsc', 'USDC', 'nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r', 18, '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d');
export const bscUSDT = createToken('bsc', 'USDT', 'nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g', 18, '0x55d398326f99059ff775485246999027b3197955');

// ============================================================================
// TON TOKENS
// ============================================================================

export const tonTON = createToken('ton', 'TON', 'nep245:v2_1.omni.hot.tg:1117_', 9);
export const tonUSDT = createToken('ton', 'USDT', 'nep245:v2_1.omni.hot.tg:1117_3tsdfyziyc7EJbP2aULWSKU4toBaAcN4FdTgfm5W1mC4ouR', 6, 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');

// ============================================================================
// TRON TOKENS
// ============================================================================

export const tronTRX = createToken('tron', 'TRX', 'nep141:tron.omft.near', 6);
export const tronUSDT = createToken('tron', 'USDT', 'nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near', 6, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');

// ============================================================================
// OTHER L1 TOKENS
// ============================================================================

export const cardanoADA = createToken('cardano', 'ADA', 'nep141:cardano.omft.near', 6);
export const rippleXRP = createToken('xrp', 'XRP', 'nep141:xrp.omft.near', 6);
export const dogecoinDOGE = createToken('doge', 'DOGE', 'nep141:doge.omft.near', 8);
export const litecoinLTC = createToken('ltc', 'LTC', 'nep141:ltc.omft.near', 8);
export const bitcoinCashBCH = createToken('bch', 'BCH', 'nep141:bch.omft.near', 8);
export const aptosAPT = createToken('aptos', 'APT', 'nep141:aptos.omft.near', 8);
export const starknetSTRK = createToken('starknet', 'STRK', 'nep141:starknet.omft.near', 18);
export const berachainBERA = createToken('bera', 'BERA', 'nep141:bera.omft.near', 18);
export const zcashZEC = createToken('zec', 'ZEC', 'nep141:zec.omft.near', 8);
export const stellarXLM = createToken('stellar', 'XLM', 'nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7AhLyPMDwS8uJgQV24KaAPXtwyVWu2KXbbfQU6NXRCz', 7);
export const stellarUSDC = createToken('stellar', 'USDC', 'nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu', 7, 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');

// NEAR tokens
export const nearNEAR = createToken('near', 'wNEAR', 'nep141:wrap.near', 24, 'wrap.near', {
    name: 'nearNEAR',
    aliases: ['nearwNEAR'],
});
export const nearUSDC = createToken('near', 'USDC', 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', 6, '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1');
export const nearUSDT = createToken('near', 'USDT', 'nep141:usdt.tether-token.near', 6, 'usdt.tether-token.near');

// ============================================================================
// CHAIN DEFINITIONS
// ============================================================================

export const CHAINS: Record<ChainId, Chain> = {
    sui: {
        id: 'sui',
        name: 'Sui',
        icon: CHAIN_ICONS.sui,
        tokens: [suiSUI, suiUSDC],
    },
    eth: {
        id: 'eth',
        name: 'Ethereum',
        icon: CHAIN_ICONS.eth,
        tokens: [ethereumETH, ethereumUSDC, ethereumUSDT, ethereumWBTC, ethereumDAI, ethereumAAVE, ethereumUNI, ethereumLINK, ethereumSHIB, ethereumPEPE, ethereumTURBO, ethereumSAFE],
    },
    arb: {
        id: 'arb',
        name: 'Arbitrum',
        icon: CHAIN_ICONS.arb,
        tokens: [arbitrumETH, arbitrumUSDC, arbitrumUSDT, arbitrumARB, arbitrumGMX],
    },
    base: {
        id: 'base',
        name: 'Base',
        icon: CHAIN_ICONS.base,
        tokens: [baseETH, baseUSDC, baseCbBTC, baseBRETT],
    },
    scroll: {
        id: 'scroll',
        name: 'Scroll',
        icon: CHAIN_ICONS.scroll,
        tokens: [scrollETH, scrollUSDT],
    },
    op: {
        id: 'op',
        name: 'Optimism',
        icon: CHAIN_ICONS.op,
        tokens: [optimismETH, optimismUSDC, optimismUSDT, optimismOP],
    },
    sol: {
        id: 'sol',
        name: 'Solana',
        icon: CHAIN_ICONS.sol,
        tokens: [solanaSOL, solanaUSDC, solanaUSDT, solanaTRUMP, solanaWIF, solanaMELANIA],
    },
    btc: {
        id: 'btc',
        name: 'Bitcoin',
        icon: CHAIN_ICONS.btc,
        tokens: [bitcoinBTC],
    },
    pol: {
        id: 'pol',
        name: 'Polygon',
        icon: CHAIN_ICONS.pol,
        tokens: [polygonPOL, polygonUSDC, polygonUSDT],
    },
    avax: {
        id: 'avax',
        name: 'Avalanche',
        icon: CHAIN_ICONS.avax,
        tokens: [avalancheAVAX, avalancheUSDC, avalancheUSDT],
    },
    bsc: {
        id: 'bsc',
        name: 'BNB Chain',
        icon: CHAIN_ICONS.bsc,
        tokens: [bscBNB, bscUSDC, bscUSDT],
    },
    ton: {
        id: 'ton',
        name: 'TON',
        icon: CHAIN_ICONS.ton,
        tokens: [tonTON, tonUSDT],
    },
    tron: {
        id: 'tron',
        name: 'Tron',
        icon: CHAIN_ICONS.tron,
        tokens: [tronTRX, tronUSDT],
    },
    near: {
        id: 'near',
        name: 'NEAR',
        icon: CHAIN_ICONS.near,
        tokens: [nearNEAR, nearUSDC, nearUSDT],
    },
    cardano: {
        id: 'cardano',
        name: 'Cardano',
        icon: CHAIN_ICONS.cardano,
        tokens: [cardanoADA],
    },
    xrp: {
        id: 'xrp',
        name: 'XRP Ledger',
        icon: CHAIN_ICONS.xrp,
        tokens: [rippleXRP],
    },
    doge: {
        id: 'doge',
        name: 'Dogecoin',
        icon: CHAIN_ICONS.doge,
        tokens: [dogecoinDOGE],
    },
    ltc: {
        id: 'ltc',
        name: 'Litecoin',
        icon: CHAIN_ICONS.ltc,
        tokens: [litecoinLTC],
    },
    bch: {
        id: 'bch',
        name: 'Bitcoin Cash',
        icon: CHAIN_ICONS.bch,
        tokens: [bitcoinCashBCH],
    },
    aptos: {
        id: 'aptos',
        name: 'Aptos',
        icon: CHAIN_ICONS.aptos,
        tokens: [aptosAPT],
    },
    starknet: {
        id: 'starknet',
        name: 'Starknet',
        icon: CHAIN_ICONS.starknet,
        tokens: [starknetSTRK],
    },
    bera: {
        id: 'bera',
        name: 'Berachain',
        icon: CHAIN_ICONS.bera,
        tokens: [berachainBERA],
    },
    zec: {
        id: 'zec',
        name: 'Zcash',
        icon: CHAIN_ICONS.zec,
        tokens: [zcashZEC],
    },
    gnosis: {
        id: 'gnosis',
        name: 'Gnosis',
        icon: CHAIN_ICONS.gnosis,
        tokens: [],
    },
    monad: {
        id: 'monad',
        name: 'Monad',
        icon: CHAIN_ICONS.monad,
        tokens: [],
    },
    stellar: {
        id: 'stellar',
        name: 'Stellar',
        icon: CHAIN_ICONS.stellar,
        tokens: [stellarXLM, stellarUSDC],
    },
};

// ============================================================================
// ALL TOKENS - Flat list for easy iteration
// ============================================================================

export const ALL_TOKENS: Token[] = Object.values(CHAINS).flatMap(chain => chain.tokens);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Get token by name, e.g. getToken('arbitrumUSDC') */
export function getToken(name: string): Token | undefined {
    return ALL_TOKENS.find((token) =>
        token.name === name || token.aliases?.includes(name)
    );
}

/** Get all tokens for a specific chain */
export function getTokensByChain(chainId: ChainId): Token[] {
    return CHAINS[chainId]?.tokens || [];
}

/** Get token by asset ID */
export function getTokenByAssetId(assetId: string): Token | undefined {
    return ALL_TOKENS.find(t => t.assetId === assetId);
}

/** Get all supported chains */
export function getSupportedChains(): Chain[] {
    return Object.values(CHAINS).filter(c => c.tokens.length > 0);
}


// Export for convenience
export default {
    CHAINS,
    ALL_TOKENS,
    TOKEN_ICONS,
    CHAIN_ICONS,
    getToken,
    getTokensByChain,
    getTokenByAssetId,
    getSupportedChains,

};
