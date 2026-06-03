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

## Core Exports

The package exports:

- `UniportButton`
- `UniportModal`
- `useUniportPayment`
- `getQuote`
- `submitDepositTx`
- `getExecutionStatus`
- token constants such as `arbitrumUSDC`, `ethereumUSDC`, and `solanaSOL`

## Errors

Backend request failures are surfaced as typed `UniportError` instances from the core module. Timeouts, quote failures, deposit submission failures, and status failures are normalized by the SDK before they reach your UI.

## License

MIT
