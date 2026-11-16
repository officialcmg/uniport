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
  appId="app_..."
  recipient="0x..."
  destinationToken="arbitrumUSDC"
  onSuccess={(result) => console.log('Paid', result.depositAddress)}
/>
```

Get your `appId` at [uniport.dev/dashboard](https://uniport.dev/dashboard): create an app and add the websites it runs on. The App ID is public, so it is safe in browser code; what it controls is which sites may use it. On `localhost` the SDK works without one, which is enough to try it out. Deployed sites need one.

The SDK uses Uniport's hosted backend. No secret key or backend of your own is needed.

## UniportButton Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `appId` | `string` | On deployed sites | Your public App ID from the dashboard. Optional on `localhost`. Can also be set once with `configureUniport({ appId })` |
| `recipient` | `string` | Yes | Recipient wallet address on the destination chain |
| `destinationToken` | `string` | Yes | Destination token name from the supported token table |
| `amount` | `string` | No | Exact destination amount. If omitted, the payer enters an input amount in the modal |
| `refundAddress` | `string` | No | Source-chain refund address to prefill in the modal |
| `label` | `string` | No | Button label |
| `variant` | `'default' \| 'compact' \| 'outline'` | No | Button style |
| `disabled` | `boolean` | No | Disable the button |
| `className` | `string` | No | Custom CSS class |
| `theme` | `'light' \| 'dark'` | No | Modal theme |
| `onSuccess` | `(result) => void` | No | Called when payment completes, with `{ txHash, amount, depositAddress, depositMemo, correlationId }` |
| `onError` | `(error) => void` | No | Called when payment fails |
| `onOpenChange` | `(open) => void` | No | Called when modal opens or closes |

If `refundAddress` is omitted, the payer can enter it inside the modal. The refund address is on the source chain the payer sends from.

When `amount` is set, the payer can't change it in the modal.

## Confirming a payment

`onSuccess` receives `{ txHash, amount, depositAddress, depositMemo, correlationId }`. It runs in the payer's browser, so do not grant goods or access on its word alone. Send `depositAddress` to your server and have it check the payment:

```ts
const res = await fetch(
  `https://api.uniport.dev/v1/payments/${encodeURIComponent(depositAddress)}`
)
if (!res.ok) throw new Error('Try again shortly')
const payment = await res.json()

const paid =
  payment.status === 'SUCCESS' &&
  payment.amountOut !== null &&
  payment.appId === process.env.UNIPORT_APP_ID &&
  // EVM (0x) addresses only. On other chains, such as Solana, compare exactly.
  payment.recipient.toLowerCase() === MY_WALLET.toLowerCase() &&
  payment.destinationAsset === EXPECTED_ASSET_ID &&
  BigInt(payment.amountOut) >= EXPECTED_AMOUNT
```

`amountOut` is `null` until the payment is delivered. If `record` is `unavailable`, Uniport could not read its record just now, so `appId` is `null`: ask again shortly. Also record each payment you accept, so it cannot be used for two orders: store `payment.depositAddress` and `payment.depositMemo` from the response, not the values the browser sent, because the same address can be written in more than one way. Add `?memo=` with `depositMemo` on chains that use a memo. No secret is needed for this call.

When `amount` is supplied, the modal requests that exact destination amount and rounds the quoted input upward to a shorter number, by at most 0.01% (one cent per $100). The payer sends at most five significant digits (a whole number of tokens for amounts of 100,000 or more). Rounded surplus and failed-swap refunds are credited to Uniport's configured Intents account. When `amount` is omitted, the payer enters an exact input amount and receives the quoted output.

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
| Stellar | `stellarXLM` | XLM |
| Stellar | `stellarUSDC` | USDC |
| Ethereum | `ethereumETH` | ETH |
| Ethereum | `ethereumUSDC` | USDC |
| Ethereum | `ethereumUSDT` | USDT |
| Ethereum | `ethereumUSD1` | USD1 |
| Ethereum | `ethereumWBTC` | WBTC |
| Ethereum | `ethereumCbBTC` | cbBTC |
| Ethereum | `ethereumWstETH` | wstETH |
| Ethereum | `ethereumXAUT` | XAUT |
| Ethereum | `ethereumDAI` | DAI |
| Ethereum | `ethereumAAVE` | AAVE |
| Ethereum | `ethereumUNI` | UNI |
| Ethereum | `ethereumLINK` | LINK |
| Ethereum | `ethereumAURORA` | AURORA |
| Ethereum | `ethereumSHIB` | SHIB |
| Ethereum | `ethereumPEPE` | PEPE |
| Ethereum | `ethereumTURBO` | TURBO |
| Ethereum | `ethereumSAFE` | SAFE |
| Arbitrum | `arbitrumETH` | ETH |
| Arbitrum | `arbitrumUSDC` | USDC |
| Arbitrum | `arbitrumUSDT` | USDT0 |
| Arbitrum | `arbitrumARB` | ARB |
| Base | `baseETH` | ETH |
| Base | `baseUSDC` | USDC |
| Base | `baseCbBTC` | cbBTC |
| Base | `baseVVV` | VVV |
| Base | `baseKAITO` | KAITO |
| Sui | `suiSUI` | SUI |
| Sui | `suiUSDC` | USDC |
| Optimism | `optimismETH` | ETH |
| Optimism | `optimismUSDC` | USDC |
| Optimism | `optimismUSDT` | USDT |
| Optimism | `optimismUSDT0` | USDT0 |
| Optimism | `optimismOP` | OP |
| Solana | `solanaSOL` | SOL |
| Solana | `solanaUSDC` | USDC |
| Solana | `solanaUSDT` | USDT |
| Solana | `solanaUSD1` | USD1 |
| Solana | `solanaWIF` | $WIF |
| Solana | `solanaPENGU` | PENGU |
| Bitcoin | `bitcoinBTC` | BTC |
| Polygon | `polygonPOL` | POL |
| Polygon | `polygonUSDC` | USDC |
| Polygon | `polygonUSDT` | USDT |
| Avalanche | `avalancheAVAX` | AVAX |
| Avalanche | `avalancheUSDC` | USDC |
| Avalanche | `avalancheUSDT` | USDT |
| BNB Chain | `bscBNB` | BNB |
| BNB Chain | `bscUSDC` | USDC |
| BNB Chain | `bscUSDT` | USDT |
| BNB Chain | `bscASTER` | ASTER |
| TON | `tonTON` | GRAM |
| TON | `tonUSDT` | USDT |
| Tron | `tronTRX` | TRX |
| Tron | `tronUSDT` | USDT |
| NEAR | `nearNEAR` | wNEAR |
| NEAR | `nearUSDC` | USDC |
| NEAR | `nearUSDT` | USDT |
| NEAR | `nearRHEA` | RHEA |
| NEAR | `nearAURORA` | AURORA |
| Cardano | `cardanoADA` | ADA |
| XRP Ledger | `xrpXRP` | XRP |
| Dogecoin | `dogecoinDOGE` | DOGE |
| Litecoin | `litecoinLTC` | LTC |
| Bitcoin Cash | `bitcoinCashBCH` | BCH |
| Aptos | `aptosAPT` | APT |
| Aptos | `aptosUSDC` | USDC |
| Aptos | `aptosUSDT` | USDT |
| Starknet | `starknetSTRK` | STRK |
| Berachain | `berachainBERA` | BERA |
| Berachain | `berachainUSDT0` | USDT0 |
| Zcash | `zcashZEC` | ZEC |
| Gnosis | `gnosisUSDC` | USDC |
| Gnosis | `gnosisUSDT` | USDT |
| Gnosis | `gnosisXDAI` | xDAI |
| Gnosis | `gnosisEURe` | EURe |
| Gnosis | `gnosisGNO` | GNO |
| Gnosis | `gnosisCOW` | COW |
| Gnosis | `gnosisWETH` | WETH |
| Monad | `monadMON` | MON |
| Monad | `monadUSDC` | USDC |
| Monad | `monadUSDT0` | USDT0 |
| Scroll | `scrollETH` | ETH |
| Scroll | `scrollUSDT` | USDT |
| Hyperliquid | `hyperliquidUSDC` | USDC |
| Hyperliquid | `hyperliquidNEAR` | wNEAR |
| Plasma | `plasmaUSDT0` | USDT0 |
| Plasma | `plasmaXPL` | XPL |
| Robinhood Chain | `robinhoodETH` | ETH |
| Robinhood Chain | `robinhoodUSDG` | USDG |
| Robinhood Chain | `robinhoodCASHCAT` | CASHCAT |
| X Layer | `xlayerOKB` | OKB |
| X Layer | `xlayerUSDC` | USDC |
| X Layer | `xlayerUSDT0` | USDT0 |
| Dash | `dashDASH` | DASH |
| ADI Chain | `adiADI` | ADI |

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
- `configureUniport` — set `appId` once for the core functions
- `getQuote`
- `submitDepositTx`
- `getExecutionStatus`
- `getExplorerTxUrl` — block-explorer transaction URL for a given chain
- `isEvmChain` — whether a `ChainId` is EVM-compatible
- `usesEvmAddress` — whether a `ChainId` uses 0x EVM accounts (every EVM chain, plus HyperCore)
- `resolveEnsName` — resolve any `.eth` name via the ENSIdeas API
- `formatDisplayAmount` — rounds a human-readable amount to 6 significant digits for UI display only (never use the result for on-chain amounts)
- `needsMemoDeposit` — whether a `ChainId` requires a memo alongside its deposit address
- token constants such as `arbitrumUSDC`, `ethereumUSDC`, and `solanaSOL`

## Errors

Backend request failures are surfaced as typed `UniportError` instances from the core module. Timeouts, quote failures, deposit submission failures, and status failures are normalized by the SDK before they reach your UI.

Four codes mean the app's setup needs fixing. The payer sees a neutral message, and the reason is logged to the browser console:

| Code | Meaning | Fix |
|------|---------|-----|
| `APP_ID_REQUIRED` | The site is not `localhost` and no `appId` was passed | Create an app in the dashboard and pass its ID |
| `APP_NOT_FOUND` | The App ID is unknown, mistyped or disabled | Copy it again from the dashboard |
| `ORIGIN_NOT_ALLOWED` | The App ID is being used on a site that is not on its list | Add the site to the app's allowed origins |
| `RECIPIENT_NOT_ALLOWED` | The app only accepts payments to listed addresses, and `recipient` is not one | Use a listed address, or change the list |

`RATE_LIMITED` means too many requests in a short time; the payer is asked to wait a minute.

## License

MIT
