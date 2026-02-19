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
import { initUniport, UniportButton } from 'uniport-sdk'

// Initialize once at app startup
// Get your API key from https://partners.near-intents.org/
initUniport({
  apiKey: 'your-near-intents-api-key',
})

// Add the payment button
<UniportButton
  recipient="0x..." // Your Sui wallet address
  onSuccess={(result) => console.log('Paid!', result.txHash)}
/>
```

That's it! Users can now pay you from 21+ blockchains. The token received is USDC on Sui by default.

## UniportButton Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `recipient` | `string` | ✅ | - | Recipient wallet address |
| `destinationToken` | - | ❌ | `'suiUSDC'` | Token to receive on Sui |
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

| Chain | Tokens |
|-------|--------|
| **Sui** (destination) | SUI, USDC |
| **Ethereum** | ETH, USDC, USDT, WBTC, DAI, AAVE, UNI, LINK, SHIB, PEPE, TURBO, SAFE |
| **Solana** | SOL, USDC, USDT, TRUMP, WIF, MELANIA |
| **Bitcoin** | BTC |
| **Optimism** | ETH, USDC, USDT, OP |
| **Base** | ETH, USDC, cbBTC, BRETT |
| **Polygon** | POL, USDC, USDT |
| **Arbitrum** | ETH, USDC, USDT, ARB, GMX |
| **Avalanche** | AVAX, USDC, USDT |
| **BSC** | BNB, USDC, USDT |
| **TON** | TON, USDT |
| **Tron** | TRX, USDT |
| **NEAR** | wNEAR, USDC, USDT |
| **Cardano** | ADA |
| **XRP Ledger** | XRP |
| **Dogecoin** | DOGE |
| **Litecoin** | LTC |
| **Bitcoin Cash** | BCH |
| **Aptos** | APT |
| **Starknet** | STRK |
| **Berachain** | BERA |
| **Zcash** | ZEC |

## Features

- 🌐 Accept payments from 21+ blockchains
- ⚡ Sub-minute settlement via NEAR Intents
- 💎 Premium glassmorphism UI
- 📱 Mobile-responsive modal
- 🔧 Zero wallet connection required from payers

## Advanced Usage

For custom implementations, the SDK also exports `UniportModal`, `useUniportPayment` hook, and core functions like `getQuote` and `getExecutionStatus`. See the source code for details.

## License

MIT
