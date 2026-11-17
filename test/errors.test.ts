import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configureUniport } from '../src/core/config';
import { fixableByCode, isAppSetupError, toUniportErrorFromUnknown, UniportError } from '../src/core/errors';
import { toUniportError } from '../src/core/intents';
import { checkPaymentSetup } from '../src/core/setup';

const EVM = '0x71C95911E9a5D330f4D621842EC243EE1343292e';
const good = { recipient: EVM, destinationToken: 'baseUSDC' };

// The setup check logs for the developer; keep the test output quiet.
const quiet = <T>(run: () => T): T => {
    const original = console.error;
    console.error = () => {};
    try {
        return run();
    } finally {
        console.error = original;
    }
};

test('a correct setup has no problem', () => {
    assert.equal(checkPaymentSetup(good), null);
    assert.equal(checkPaymentSetup({ ...good, amount: '25' }), null);
    assert.equal(checkPaymentSetup({ ...good, amount: '0.5', appId: 'app_0000000000000000000000' }), null);
});

test('destinationToken: missing, empty and unknown', () => {
    for (const destinationToken of [undefined, '', '   ', 'notAToken', 'baseusdc ']) {
        const error = checkPaymentSetup({ recipient: EVM, destinationToken });
        assert.equal(error?.code, 'INVALID_DESTINATION_TOKEN', String(destinationToken));
        assert.equal(error?.fixableBy, 'developer');
    }
});

test('recipient: missing', () => {
    for (const recipient of [undefined, '', '   ']) {
        assert.equal(checkPaymentSetup({ ...good, recipient })?.code, 'MISSING_RECIPIENT');
    }
});

test('recipient: wrong format is caught on EVM chains only', () => {
    assert.equal(checkPaymentSetup({ ...good, recipient: '0x123' })?.code, 'INVALID_RECIPIENT');
    assert.equal(checkPaymentSetup({ ...good, recipient: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' })?.code, 'INVALID_RECIPIENT');
    // Not EVM: left for the API to judge.
    assert.equal(checkPaymentSetup({ recipient: 'anything-goes-here', destinationToken: 'suiUSDC' }), null);
});

test('amount: must be a positive number within the token\'s decimals', () => {
    for (const amount of ['0', '-1', 'abc', '', '1e3', '1,5', '.5', '5.']) {
        assert.equal(checkPaymentSetup({ ...good, amount })?.code, 'INVALID_AMOUNT', amount);
    }
    // USDC has 6 decimals.
    assert.equal(checkPaymentSetup({ ...good, amount: '1.1234567' })?.code, 'INVALID_AMOUNT');
    assert.equal(checkPaymentSetup({ ...good, amount: '1.123456' }), null);
});

test('a secret key is caught first, and is never echoed back', () => {
    for (const appId of ['sk_live_abc123', 'whsec_abc123', '  sk_test_1']) {
        const error = checkPaymentSetup({ appId, recipient: undefined, destinationToken: undefined });
        assert.equal(error?.code, 'SECRET_KEY_AS_APP_ID');
        assert.ok(!String(error?.details).includes('abc123'));
        assert.ok(!error?.message.includes('abc123'));
    }
});

test('App ID: needed on a deployed site, not on localhost, and not before the hostname is known', () => {
    assert.equal(checkPaymentSetup({ ...good, hostname: 'shop.example.com' })?.code, 'APP_ID_REQUIRED');
    for (const hostname of [undefined, 'localhost', '127.0.0.1', 'app.localhost', '[::1]']) {
        assert.equal(checkPaymentSetup({ ...good, hostname }), null, String(hostname));
    }
    assert.equal(checkPaymentSetup({ ...good, hostname: 'shop.example.com', appId: 'app_0000000000000000000000' }), null);
    // An App ID set once with configureUniport counts too.
    configureUniport({ appId: 'app_0000000000000000000000' });
    assert.equal(checkPaymentSetup({ ...good, hostname: 'shop.example.com' }), null);
    configureUniport({ appId: '' });
    assert.equal(checkPaymentSetup({ ...good, hostname: 'shop.example.com' })?.code, 'APP_ID_REQUIRED');
});

test('setup errors show the payer a neutral message and keep the reason in details', () => {
    const error = checkPaymentSetup({ ...good, recipient: '' });
    assert.match(error!.message, /not available on this site/);
    assert.match(String(error!.details), /recipient is required/);
    assert.ok(isAppSetupError(error));
});

const quoteFailed = { code: 'QUOTE_FAILED' as const, message: 'Quote failed.', status: 400 };

test('API errors: causes the payer can act on get a sentence', () => {
    const none = toUniportError({ code: 'NO_LIQUIDITY', message: 'x' }, quoteFailed);
    assert.equal(none.code, 'NO_LIQUIDITY');
    assert.equal(none.fixableBy, 'payer');
    assert.match(none.message, /No route for this amount/);

    const btc = { decimals: 8, symbol: 'BTC' };
    const low = toUniportError({ code: 'AMOUNT_TOO_LOW', message: 'x', minimum: { amount: '8300' } }, quoteFailed, btc);
    assert.equal(low.message, 'This amount is too small for this route. The minimum is 0.000083 BTC.');
    const usd = toUniportError({ code: 'AMOUNT_TOO_LOW', message: 'x', minimum: { usd: '100' } }, quoteFailed, btc);
    assert.equal(usd.message, 'This amount is too small for this route. The minimum is $100.');
    const bare = toUniportError({ code: 'AMOUNT_TOO_LOW', message: 'x' }, quoteFailed);
    assert.equal(bare.message, 'This amount is too small for this route.');

    assert.match(toUniportError({ code: 'INVALID_REFUND_ADDRESS', message: 'x' }, quoteFailed).message, /not a valid refund address/);
});

test('API errors: setup problems are neutral for the payer', () => {
    quiet(() => {
        for (const code of ['APP_ID_REQUIRED', 'APP_NOT_FOUND', 'ORIGIN_NOT_ALLOWED', 'RECIPIENT_NOT_ALLOWED', 'INVALID_RECIPIENT', 'RECIPIENT_NOT_READY', 'VALIDATION_ERROR'] as const) {
            const error = toUniportError({ code, message: 'Developer-only reason.' }, quoteFailed);
            assert.equal(error.code, code);
            assert.equal(error.fixableBy, 'developer');
            assert.ok(!error.message.includes('Developer-only'), code);
        }
    });
});

test('API errors: 429 becomes RATE_LIMITED, and unknown causes keep 1Click\'s sentence', () => {
    assert.equal(toUniportError({}, { ...quoteFailed, status: 429 }).code, 'RATE_LIMITED');
    const unknown = quiet(() => toUniportError({ code: 'QUOTE_FAILED', message: 'Quote failed.', details: { message: 'Something new', correlationId: 'abc' } }, quoteFailed));
    assert.equal(unknown.code, 'QUOTE_FAILED');
    assert.equal(unknown.fixableBy, 'service');
    assert.equal(unknown.message, 'Something new');
    // An API from before the codes existed sends no code at all.
    assert.equal(quiet(() => toUniportError({ details: { message: 'No liquidity available' } }, quoteFailed)).code, 'QUOTE_FAILED');
});

test('anything thrown becomes a UniportError', () => {
    const existing = new UniportError({ code: 'NO_LIQUIDITY', message: 'm' });
    assert.equal(toUniportErrorFromUnknown(existing, 'fallback'), existing);
    assert.equal(toUniportErrorFromUnknown(new TypeError('Failed to fetch'), 'fallback').code, 'NETWORK_ERROR');
    assert.equal(toUniportErrorFromUnknown(new Error('boom'), 'fallback').code, 'UNKNOWN_ERROR');
    assert.equal(toUniportErrorFromUnknown('text', 'fallback').message, 'fallback');
    assert.equal(toUniportErrorFromUnknown(undefined, 'fallback').fixableBy, 'service');
});

test('every code is sorted into who can fix it', () => {
    assert.equal(fixableByCode('MISSING_RECIPIENT'), 'developer');
    assert.equal(fixableByCode('AMOUNT_TOO_LOW'), 'payer');
    assert.equal(fixableByCode('PAYMENT_REFUNDED'), 'service');
    assert.equal(fixableByCode(undefined), 'service');
    assert.equal(fixableByCode('SOMETHING_FROM_A_NEWER_API'), 'service');
});
