/**
 * Sampled chain-pair quote smoke test against the PRODUCTION Railway backend.
 *
 * Not exhaustive by design — this hits the real hosted backend (rate-limited
 * to 100 req/min) so it samples a representative cross-section instead of
 * every possible pair: major-chain USDC routes, a couple of native-token
 * routes, and the newly-added Scroll chain. All quotes are dry-run (no
 * deposit address generated, no funds moved).
 *
 * Run with: npx tsx scripts/check-prod-quotes.ts
 */
import {
    arbitrumUSDC,
    baseUSDC,
    ethereumUSDC,
    suiUSDC,
    solanaUSDC,
    optimismUSDC,
    polygonUSDC,
    scrollUSDT,
    scrollETH,
    solanaSOL,
    suiSUI,
    type Token,
} from '../src/core/tokens';
import { toSmallestUnits } from '../src/core/intents';

const PROD_BACKEND_URL = 'https://uniport-backend-production.up.railway.app';

// [origin, destination, human-readable amount in origin token units]
const PAIRS: [Token, Token, string][] = [
    [arbitrumUSDC, baseUSDC, '5'],
    [arbitrumUSDC, suiUSDC, '5'],
    [arbitrumUSDC, solanaUSDC, '5'],
    [baseUSDC, ethereumUSDC, '5'],
    [ethereumUSDC, arbitrumUSDC, '5'],
    [optimismUSDC, polygonUSDC, '5'],
    [suiUSDC, arbitrumUSDC, '5'],
    [solanaUSDC, baseUSDC, '5'],
    [solanaSOL, suiSUI, '0.1'],
    [scrollUSDT, arbitrumUSDC, '5'],
    [scrollETH, baseUSDC, '0.01'],
    [arbitrumUSDC, scrollUSDT, '5'],
];

const DUMMY_EVM = '0x2527D02599Ba641c19FEa793cD0F167589a0f10D';
const DUMMY_SUI = '0xa6f2d3ed71e4cce768fc27bade39dfb1ed18e6ad4c78eeca1f5c31a8fe7c6c89';
const DUMMY_SOL = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

function refundForChain(chain: string): string {
    if (chain === 'sui') return DUMMY_SUI;
    if (chain === 'sol') return DUMMY_SOL;
    return DUMMY_EVM;
}

function recipientForChain(chain: string): string {
    if (chain === 'sui') return DUMMY_SUI;
    if (chain === 'sol') return DUMMY_SOL;
    return DUMMY_EVM;
}

async function quoteOne(origin: Token, destination: Token, amount: string) {
    const body = {
        dry: true,
        originAsset: origin.assetId,
        destinationAsset: destination.assetId,
        amount: toSmallestUnits(amount, origin.decimals),
        refundTo: refundForChain(origin.chain),
        recipient: recipientForChain(destination.chain),
    };

    const label = `${origin.name} -> ${destination.name}`;
    try {
        const res = await fetch(`${PROD_BACKEND_URL}/api/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data: any = await res.json();
        if (!res.ok) {
            console.log(`FAIL  ${label}: ${data.details?.message || data.message}`);
            return false;
        }
        console.log(
            `OK    ${label}: ${amount} ${origin.symbol} -> ${data.quote.amountOutFormatted} ${destination.symbol}`
        );
        return true;
    } catch (err) {
        console.log(`ERROR ${label}: ${(err as Error).message}`);
        return false;
    }
}

async function main() {
    console.log(`Sampling ${PAIRS.length} quotes against ${PROD_BACKEND_URL}\n`);
    let passed = 0;
    for (const [origin, destination, amount] of PAIRS) {
        const ok = await quoteOne(origin, destination, amount);
        if (ok) passed++;
        // Small delay — polite to the shared production instance, well within its 100 req/min limit.
        await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`\n${passed}/${PAIRS.length} quotes succeeded`);
    if (passed !== PAIRS.length) process.exitCode = 1;
}

main();
