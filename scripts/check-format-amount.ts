/**
 * Self-check for formatDisplayAmount — run with: npx tsx scripts/check-format-amount.ts
 * Uses real ugly-decimal quote outputs reproduced live against the 1Click
 * API (see chat history / TODO) to make sure display rounding actually
 * makes them readable without breaking clean amounts or edge cases.
 */
import assert from 'node:assert';
import { formatDisplayAmount } from '../src/core/intents';

// Real amountOutFormatted values seen from live quotes (18-decimal ETH,
// 9-decimal SUI, 6-decimal USDC destinations) — this is the actual problem.
assert.equal(formatDisplayAmount('0.002703957684923543'), '0.00270396');
assert.equal(formatDisplayAmount('0.002791420700458485'), '0.00279142');
assert.equal(formatDisplayAmount('5.071227'), '5.07123');
assert.equal(formatDisplayAmount('13.504261458'), '13.5043');
assert.equal(formatDisplayAmount('86.56529765'), '86.5653');

// Clean amounts pass through unchanged (no trailing zeros added/removed weirdly)
assert.equal(formatDisplayAmount('5.0'), '5');
assert.equal(formatDisplayAmount('18.20559'), '18.2056');
assert.equal(formatDisplayAmount('100'), '100');

// Edge cases: never crash, never show something worse than the input
assert.equal(formatDisplayAmount(undefined), '');
assert.equal(formatDisplayAmount(''), '');
assert.equal(formatDisplayAmount('0'), '0');
assert.equal(formatDisplayAmount('not-a-number'), 'not-a-number');
// Sub-micro amounts and huge amounts fall back to the raw string rather than
// risk scientific notation or an overly-aggressive round to zero.
assert.equal(formatDisplayAmount('0.0000001'), '0.0000001');
assert.equal(formatDisplayAmount('99999999999999999999999'), '99999999999999999999999');

console.log('OK — formatDisplayAmount verified against live ugly-decimal cases');
