# Uniport SDK

[![npm version](https://img.shields.io/npm/v/uniport-sdk.svg)](https://www.npmjs.com/package/uniport-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cross-chain payment SDK for accepting crypto payments into a destination token you choose.

[GitHub Repository](https://github.com/officialcmg/uniport)

## Installation

```bash
npm install uniport-sdk
```

## Quick Start

```tsx
import { UniportButton } from 'uniport-sdk'

<UniportButton
  recipient="0x..."
  destinationToken="arbitrumUSDC"
  onSuccess={(result) => console.log('Paid', result.txHash)}
/>
```

The SDK uses Uniport's hosted backend. No API key or backend URL is required for standard integration.

## UniportButton Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `recipient` | `string` | Yes | Recipient wallet address on the destination chain |
| `destinationToken` | `string` | Yes | Destination token name from the supported token table |
| `amount` | `string` | No | Fixed amount in destination token units |
| `refundAddress` | `string` | No | Source-chain refund address to prefill in the modal |
| `label` | `string` | No | Button label |
| `variant` | `'default' \| 'compact' \| 'outline'` | No | Button style |
| `disabled` | `boolean` | No | Disable the button |
| `className` | `string` | No | Custom CSS class |
| `theme` | `'light' \| 'dark'` | No | Modal theme |
| `onSuccess` | `(result) => void` | No | Called when payment completes |
| `onError` | `(error) => void` | No | Called when payment fails |
| `onOpenChange` | `(open) => void` | No | Called when modal opens or closes |

If `refundAddress` is omitted, the payer can enter it inside the modal. The refund address is on the source chain the payer sends from.

**EVM source chains only:** if the payer leaves the refund address blank, it defaults to Uniport's own address (resolved from `uniport.eth`, with a hardcoded fallback if resolution fails) rather than blocking the payment. This exists because the underlying 1Click API currently requires an explicit refund address — it cannot yet auto-refund to the depositing wallet. On non-EVM chains (Sui, Solana, Bitcoin, etc.) a refund address is still required from the payer, since there is no Uniport-controlled address on those chains to fall back to.

## Supported Token Naming

Use the canonical token names below as `destinationToken`. Examples:

- `arbitrumUSDC`
- `ethereumUSDC`
- `solanaSOL`
- `bitcoinBTC`

Legacy short aliases such as `arbUSDC` and `ethUSDC` are still accepted for backward compatibility, but the canonical names below are the stable prop names to document and ship against.

| Chain | Token Name | Symbol |
|-------|------------|--------|
| Sui | `suiSUI` | SUI |
| Sui | `suiUSDC` | USDC |
| Ethereum | `ethereumETH` | ETH |
| Ethereum | `ethereumUSDC` | USDC |
| Ethereum | `ethereumUSDT` | USDT |
| Ethereum | `ethereumWBTC` | WBTC |
| Ethereum | `ethereumDAI` | DAI |
| Ethereum | `ethereumAAVE` | AAVE |
| Ethereum | `ethereumUNI` | UNI |
| Ethereum | `ethereumLINK` | LINK |
| Ethereum | `ethereumSHIB` | SHIB |
| Ethereum | `ethereumPEPE` | PEPE |
| Ethereum | `ethereumTURBO` | TURBO |
| Ethereum | `ethereumSAFE` | SAFE |
| Solana | `solanaSOL` | SOL |
| Solana | `solanaUSDC` | USDC |
| Solana | `solanaUSDT` | USDT |
| Solana | `solanaTRUMP` | TRUMP |
| Solana | `solanaWIF` | $WIF |
| Solana | `solanaMELANIA` | MELANIA |
| Bitcoin | `bitcoinBTC` | BTC |
| Arbitrum | `arbitrumETH` | ETH |
| Arbitrum | `arbitrumUSDC` | USDC |
| Arbitrum | `arbitrumUSDT` | USDT |
| Arbitrum | `arbitrumARB` | ARB |
| Arbitrum | `arbitrumGMX` | GMX |
| Base | `baseETH` | ETH |
| Base | `baseUSDC` | USDC |
| Base | `baseCbBTC` | cbBTC |
| Base | `baseBRETT` | BRETT |
| Scroll | `scrollETH` | ETH |
| Scroll | `scrollUSDT` | USDT |
| Optimism | `optimismETH` | ETH |
| Optimism | `optimismUSDC` | USDC |
| Optimism | `optimismUSDT` | USDT |
| Optimism | `optimismOP` | OP |
| Polygon | `polygonPOL` | POL |
| Polygon | `polygonUSDC` | USDC |
| Polygon | `polygonUSDT` | USDT |
| Avalanche | `avalancheAVAX` | AVAX |
| Avalanche | `avalancheUSDC` | USDC |
| Avalanche | `avalancheUSDT` | USDT |
| BNB Chain | `bscBNB` | BNB |
| BNB Chain | `bscUSDC` | USDC |
| BNB Chain | `bscUSDT` | USDT |
| TON | `tonTON` | TON |
| TON | `tonUSDT` | USDT |
| Tron | `tronTRX` | TRX |
| Tron | `tronUSDT` | USDT |
| NEAR | `nearNEAR` | wNEAR |
| NEAR | `nearUSDC` | USDC |
| NEAR | `nearUSDT` | USDT |
| Cardano | `cardanoADA` | ADA |
| XRP Ledger | `xrpXRP` | XRP |
| Dogecoin | `dogecoinDOGE` | DOGE |
| Litecoin | `litecoinLTC` | LTC |
| Bitcoin Cash | `bitcoinCashBCH` | BCH |
| Aptos | `aptosAPT` | APT |
| Starknet | `starknetSTRK` | STRK |
| Berachain | `berachainBERA` | BERA |
| Zcash | `zcashZEC` | ZEC |
| Stellar | `stellarXLM` | XLM |
| Stellar | `stellarUSDC` | USDC |

## Display amounts

Cross-chain quotes routinely land on odd decimals — e.g. paying exactly 5 USDC
may quote as `0.002703957684923543 ETH` on the destination side. The built-in
`UniportModal` rounds all displayed estimates to 6 significant digits via
`formatDisplayAmount` so payers see something readable (e.g. `0.0027040`).
This is display-only: the actual quote, deposit amount, and settlement values
are never altered — only the text shown in the UI is rounded.

## Memo-required chains

Some chains (currently: Stellar) require a memo alongside the deposit address
— sending funds without it can make the deposit unrecoverable. `UniportModal`
automatically requests the correct deposit mode for these chains and displays
the memo prominently, with its own copy button, right next to the deposit
address. `needsMemoDeposit(chain)` is exported if you need this in custom UI.

Note: the underlying 1Click API's own documentation suggests TON and XRP may
also need this, but that isn't the case for the chains actively supported
today (verified directly against the live API) — only Stellar currently
requires it. If this changes, `CHAINS_REQUIRING_MEMO` in `core/tokens.ts` is
the single place to update.

Stellar also has a chain-specific quirk worth knowing: non-native assets
(e.g. Stellar USDC) require the receiving address to have an established
trustline for that asset, or funds cannot be delivered. `UniportModal` warns
about this when a refund address is entered for a non-XLM Stellar token.

## Core Exports

The package exports:

- `UniportButton`
- `UniportModal`
- `useUniportPayment`
- `getQuote`
- `submitDepositTx`
- `getExecutionStatus`
- `getExplorerTxUrl` — block-explorer transaction URL for a given chain
- `isEvmChain` — whether a `ChainId` is EVM-compatible
- `resolveEnsName` — resolve any `.eth` name via the ENSIdeas API
- `formatDisplayAmount` — rounds a human-readable amount to 6 significant digits for UI display only (never use the result for on-chain amounts)
- `needsMemoDeposit` — whether a `ChainId` requires a memo alongside its deposit address
- token constants such as `arbitrumUSDC`, `ethereumUSDC`, and `solanaSOL`

## Errors

Backend request failures are surfaced as typed `UniportError` instances from the core module. Timeouts, quote failures, deposit submission failures, and status failures are normalized by the SDK before they reach your UI.

## License

MIT
