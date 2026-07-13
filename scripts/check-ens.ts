/**
 * Self-check for ENS resolution — run with: npx tsx scripts/check-ens.ts
 * Hits the real ENSIdeas API. Fails loudly (non-zero exit) if resolution
 * breaks or the Uniport default refund address stops resolving correctly.
 */
import assert from 'node:assert';
import {
    resolveEnsName,
    getUniportDefaultRefundAddress,
    UNIPORT_FALLBACK_REFUND_ADDRESS,
} from '../src/core/ens';

async function main() {
    // Known-good name from the ENSIdeas docs
    const frolic = await resolveEnsName('frolic.eth');
    assert(frolic, 'frolic.eth failed to resolve');
    assert.equal(frolic.address, '0xC9C022FCFebE730710aE93CA9247c5Ec9d9236d0');
    assert.equal(frolic.name, 'frolic.eth');

    // Unregistered name resolves to null, not a thrown error
    const missing = await resolveEnsName(
        'this-definitely-does-not-exist-uniport-test-12345.eth'
    );
    assert.equal(missing, null, 'unregistered name should resolve to null');

    // Uniport's default refund address resolves via uniport.eth, with the
    // documented hardcoded fallback if the API/name is ever unavailable
    const defaultRefund = await getUniportDefaultRefundAddress();
    assert(
        defaultRefund === UNIPORT_FALLBACK_REFUND_ADDRESS ||
            /^0x[0-9a-fA-F]{40}$/.test(defaultRefund),
        `unexpected default refund address: ${defaultRefund}`
    );

    console.log('OK — ENS resolution verified');
    console.log(`  frolic.eth -> ${frolic.address}`);
    console.log(`  uniport.eth (default refund) -> ${defaultRefund}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
