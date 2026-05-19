# Uniport

[![npm version](https://img.shields.io/npm/v/uniport-sdk.svg)](https://www.npmjs.com/package/uniport-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cross-chain payment SDK. Accept crypto payments from any blockchain with one line of code.

[GitHub Repository](https://github.com/officialcmg/uniport)

## Installation

```bash
npm install uniport-sdk
```

## Quick Start

```tsx
import { UniportButton } from 'uniport-sdk'

// That's it — no initialization needed!
<UniportButton
  recipient="0x..."
  destinationToken="suiUSDC"
  onSuccess={(result) => console.log('Paid!', result.txHash)}
/>
```

That's it! No API keys, no initialization. Users can now pay you from 21+ blockchains.

## UniportButton Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `recipient` | `string` | ✅ | - | Recipient wallet address on the destination chain |
| `destinationToken` | `string` | ✅ | - | Token to receive. **Must be a valid token name from the table below.** |
| `amount` | `string` | ❌ | - | Fixed amount (user selects if omitted) |
| `refundAddress` | `string` | ❌ | - | Refund address if payment fails* |
| `label` | `string` | ❌ | `'Pay with Crypto'` | Button text |
| `variant` | `'default' \| 'compact' \| 'outline'` | ❌ | `'default'` | Button style |
| `disabled` | `boolean` | ❌ | `false` | Disable the button |
| `className` | `string` | ❌ | - | Custom CSS class |
| `onSuccess` | `(result) => void` | ❌ | - | Called when payment completes |
| `onError` | `(error) => void` | ❌ | - | Called when payment fails |
| `onOpenChange` | `(open) => void` | ❌ | - | Called when modal opens/closes |

> *Note: In a future version, refund address input will be added directly in the modal UI, removing the need to pass it as a prop.

### Button Variants

- **`default`** - Gradient purple button with shadow (recommended)
- **`compact`** - Smaller version for tight spaces
- **`outline`** - Transparent with purple border

## Supported Chains & Tokens

> **Important**: The `destinationToken` prop must be set to one of the **exact string values** shown in the **Token Name** column below. For example: `destinationToken="suiUSDC"` or `destinationToken="arbitrumUSDC"`.

| Chain | Token Name (use in `destinationToken`) | Symbol |
|-------|---------------------------------------|--------|
| **Sui** | `suiSUI` | SUI |
| **Sui** | `suiUSDC` | USDC |
| **Ethereum** | `ethETH` | ETH |
| **Ethereum** | `ethUSDC` | USDC |
| **Ethereum** | `ethUSDT` | USDT |
| **Ethereum** | `ethWBTC` | WBTC |
| **Ethereum** | `ethDAI` | DAI |
| **Ethereum** | `ethAAVE` | AAVE |
| **Ethereum** | `ethUNI` | UNI |
| **Ethereum** | `ethLINK` | LINK |
| **Ethereum** | `ethSHIB` | SHIB |
| **Ethereum** | `ethPEPE` | PEPE |
| **Ethereum** | `ethTURBO` | TURBO |
| **Ethereum** | `ethSAFE` | SAFE |
| **Solana** | `solSOL` | SOL |
| **Solana** | `solUSDC` | USDC |
| **Solana** | `solUSDT` | USDT |
| **Solana** | `solTRUMP` | TRUMP |
| **Solana** | `sol$WIF` | $WIF |
| **Solana** | `solMELANIA` | MELANIA |
| **Bitcoin** | `btcBTC` | BTC |
| **Arbitrum** | `arbETH` | ETH |
| **Arbitrum** | `arbUSDC` | USDC |
| **Arbitrum** | `arbUSDT` | USDT |
| **Arbitrum** | `arbARB` | ARB |
| **Arbitrum** | `arbGMX` | GMX |
| **Base** | `baseETH` | ETH |
| **Base** | `baseUSDC` | USDC |
| **Base** | `basecbBTC` | cbBTC |
| **Base** | `baseBRETT` | BRETT |
| **Optimism** | `opETH` | ETH |
| **Optimism** | `opUSDC` | USDC |
| **Optimism** | `opUSDT` | USDT |
| **Optimism** | `opOP` | OP |
| **Polygon** | `polPOL` | POL |
| **Polygon** | `polUSDC` | USDC |
| **Polygon** | `polUSDT` | USDT |
| **Avalanche** | `avaxAVAX` | AVAX |
| **Avalanche** | `avaxUSDC` | USDC |
| **Avalanche** | `avaxUSDT` | USDT |
| **BNB Chain** | `bscBNB` | BNB |
| **BNB Chain** | `bscUSDC` | USDC |
| **BNB Chain** | `bscUSDT` | USDT |
| **TON** | `tonTON` | TON |
| **TON** | `tonUSDT` | USDT |
| **Tron** | `tronTRX` | TRX |
| **Tron** | `tronUSDT` | USDT |
| **NEAR** | `nearwNEAR` | wNEAR |
| **NEAR** | `nearUSDC` | USDC |
| **NEAR** | `nearUSDT` | USDT |
| **Cardano** | `cardanoADA` | ADA |
| **XRP Ledger** | `xrpXRP` | XRP |
| **Dogecoin** | `dogeDOGE` | DOGE |
| **Litecoin** | `ltcLTC` | LTC |
| **Bitcoin Cash** | `bchBCH` | BCH |
| **Aptos** | `aptosAPT` | APT |
| **Starknet** | `starknetSTRK` | STRK |
| **Berachain** | `beraBERA` | BERA |
| **Zcash** | `zecZEC` | ZEC |

## Features

- 🌐 Accept payments from 21+ blockchains
- ⚡ Sub-minute settlement via NEAR Intents
- 💎 Premium glassmorphism UI
- 📱 Mobile-responsive modal
- 🔧 Zero wallet connection required from payers
- 🔑 Zero API keys needed for developers

## Advanced Usage

For custom implementations, the SDK also exports `UniportModal`, `useUniportPayment` hook, and core functions like `getQuote` and `getExecutionStatus`. See the source code for details.

## License

MIT
