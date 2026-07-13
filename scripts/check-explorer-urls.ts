/**
 * Self-check for getExplorerTxUrl — run with: npx tsx scripts/check-explorer-urls.ts
 * Fails loudly (non-zero exit) if any chain lacks an explorer URL or the
 * hash is not embedded in the produced URL.
 */
import assert from 'node:assert';
import { CHAINS, getExplorerTxUrl, type ChainId } from '../src/core/tokens';

const HASH = '0xdeadbeef1234567890';

const chainIds = Object.keys(CHAINS) as ChainId[];
assert(chainIds.length > 0, 'CHAINS is empty');

for (const id of chainIds) {
    const url = getExplorerTxUrl(id, HASH);
    assert(url, `no explorer URL for chain: ${id}`);
    assert(url.startsWith('https://'), `${id}: not https: ${url}`);
    assert(url.includes(HASH), `${id}: hash missing from URL: ${url}`);
}

// Spot-check known-correct formats
assert.equal(getExplorerTxUrl('eth', 'abc'), 'https://etherscan.io/tx/abc');
assert.equal(getExplorerTxUrl('sui', 'abc'), 'https://suivision.xyz/txblock/abc');
assert.equal(getExplorerTxUrl('sol', 'abc'), 'https://solscan.io/tx/abc');
assert.equal(getExplorerTxUrl('arb', 'abc'), 'https://arbiscan.io/tx/abc');

console.log(`OK — explorer URLs verified for ${chainIds.length} chains`);
