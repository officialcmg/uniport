/**
 * Self-check for Stellar chain support — run with: npx tsx scripts/check-stellar.ts
 *
 * Verifies, against the real 1Click API (no mocks):
 *  1. Stellar tokens resolve correctly in our token table (real assetIds).
 *  2. needsMemoDeposit() correctly flags Stellar and only Stellar among the
 *     chains verified live (TON, XRP do NOT use MEMO mode — confirmed
 *     empirically, contradicting the 1Click SDK's generic docstring example).
 *  3. A Stellar quote actually succeeds end-to-end through the real backend
 *     when depositMode: MEMO is sent, and fails without it — proving the
 *     fix is both correct and necessary, not just plausible.
 *
 * Requires the backend running locally on PORT (default 3001) with a valid
 * NEAR_API_KEY. Start it with: npm run dev --prefix ../uniport-backend
 */
import assert from 'node:assert';
import {
    CHAINS,
    needsMemoDeposit,
    stellarXLM,
    stellarUSDC,
} from '../src/core/tokens';

const BACKEND_URL = process.env.UNIPORT_BACKEND_URL || 'http://localhost:3001';

async function quote(body: Record<string, unknown>) {
    const res = await fetch(`${BACKEND_URL}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, body: await res.json() };
}

async function main() {
    // 1. Token table
    assert.equal(stellarXLM.chain, 'stellar');
    assert.equal(stellarXLM.decimals, 7);
    assert.equal(
        stellarXLM.assetId,
        'nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7AhLyPMDwS8uJgQV24KaAPXtwyVWu2KXbbfQU6NXRCz'
    );
    assert.equal(stellarUSDC.decimals, 7);
    assert.equal(CHAINS.stellar.tokens.length, 2);

    // 2. needsMemoDeposit — Stellar yes, verified non-memo chains no
    assert.equal(needsMemoDeposit('stellar'), true);
    assert.equal(needsMemoDeposit('ton'), false);
    assert.equal(needsMemoDeposit('xrp'), false);
    assert.equal(needsMemoDeposit('eth'), false);

    // 3. Live backend round-trip (skipped with a clear message if backend is down)
    const arbUsdc =
        'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near';
    const refundTo = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const recipient = '0x2527D02599Ba641c19FEa793cD0F167589a0f10D';

    let withMemo: Awaited<ReturnType<typeof quote>>;
    let withoutMemo: Awaited<ReturnType<typeof quote>>;
    try {
        withMemo = await quote({
            dry: true,
            depositMode: 'MEMO',
            originAsset: stellarXLM.assetId,
            destinationAsset: arbUsdc,
            amount: '50000000',
            refundTo,
            recipient,
        });
        withoutMemo = await quote({
            dry: true,
            originAsset: stellarXLM.assetId,
            destinationAsset: arbUsdc,
            amount: '50000000',
            refundTo,
            recipient,
        });
    } catch (err) {
        console.warn(
            `SKIPPED live backend check — is the backend running at ${BACKEND_URL}? (${(err as Error).message})`
        );
        console.log('OK — Stellar token table and needsMemoDeposit verified (live backend check skipped)');
        return;
    }

    assert.equal(withMemo.ok, true, `expected MEMO quote to succeed, got: ${JSON.stringify(withMemo.body)}`);
    assert.equal(
        withoutMemo.ok,
        false,
        'expected quote without depositMode to fail for Stellar (this is the exact bug the fix addresses)'
    );
    assert.match(
        JSON.stringify(withoutMemo.body),
        /depositMode/i,
        'expected the failure reason to mention depositMode'
    );

    console.log('OK — Stellar chain support verified end-to-end against the live backend + 1Click API');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
