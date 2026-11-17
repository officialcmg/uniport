/**
 * Checks the values an app passes in, before any request is made.
 *
 * The button, the modal and the payment hook all run this one check, so a
 * mistake is reported the same way whichever of them the app uses. Nothing
 * here throws: a setup mistake must not take the host page down.
 */

import { getUniportConfig, looksLikeSecretKey } from './config';
import { SETUP_ERROR_PAYER_MESSAGE, UniportError, type UniportErrorCode } from './errors';
import { getToken, usesEvmAddress } from './tokens';

export interface PaymentSetup {
    appId?: string;
    recipient?: string;
    destinationToken?: string;
    amount?: string;
    /**
     * The hostname of the page the payment runs on. When given, a site that is
     * not localhost and has no App ID is reported before the API refuses it.
     */
    hostname?: string;
}

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** localhost and its relatives, where the API needs no App ID. */
function isLocalHost(hostname: string): boolean {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname === '::1' ||
        hostname.endsWith('.localhost')
    );
}

function setupError(code: UniportErrorCode, whatToChange: string): UniportError {
    // `message` is what a payer may be shown; `details` is for the developer.
    return new UniportError({ code, message: SETUP_ERROR_PAYER_MESSAGE, details: whatToChange });
}

/**
 * Returns the first problem with how the payment is set up, or null if there
 * is none. The error's `details` says what to change.
 */
export function checkPaymentSetup(setup: PaymentSetup): UniportError | null {
    const { recipient, destinationToken, amount } = setup;

    // First, so that a secret key is caught whatever else is wrong.
    if (looksLikeSecretKey(setup.appId)) {
        return setupError(
            'SECRET_KEY_AS_APP_ID',
            'A secret key was passed as appId. Secret keys must stay on your server; ' +
            'use the public App ID (app_...) from https://uniport.dev/dashboard.'
        );
    }

    if (typeof destinationToken !== 'string' || !destinationToken.trim()) {
        return setupError(
            'INVALID_DESTINATION_TOKEN',
            'destinationToken is required. Pass a token name such as "arbitrumUSDC".'
        );
    }
    const token = getToken(destinationToken);
    if (!token) {
        return setupError(
            'INVALID_DESTINATION_TOKEN',
            '"' + destinationToken + '" is not a supported destinationToken. ' +
            'Use a name such as "arbitrumUSDC", "baseUSDC" or "suiUSDC"; ' +
            'the full list is at https://uniport.dev/docs/chains-and-tokens.'
        );
    }

    if (typeof recipient !== 'string' || !recipient.trim()) {
        return setupError(
            'MISSING_RECIPIENT',
            'recipient is required: the address on ' + token.chain + ' that should receive the payment.'
        );
    }
    // The value is sent as it is, so spaces around it would reach the API.
    if (recipient !== recipient.trim()) {
        return setupError(
            'INVALID_RECIPIENT',
            'recipient has spaces around it. Pass the address on its own.'
        );
    }
    // Only where the format is certain. Other chains are left to the API,
    // which knows their formats better than a pattern here would.
    if (usesEvmAddress(token.chain) && !EVM_ADDRESS.test(recipient)) {
        return setupError(
            'INVALID_RECIPIENT',
            '"' + recipient + '" is not a valid address for ' + destinationToken +
            '. It should be 0x followed by 40 hex characters.'
        );
    }

    if (amount !== undefined) {
        // A string, exactly as it will be sent: no spaces, no number type.
        const value = typeof amount === 'string' ? amount : '';
        if (!/^\d+(\.\d+)?$/.test(value) || Number(value) <= 0) {
            return setupError(
                'INVALID_AMOUNT',
                'amount must be a positive number written as a string, such as "25" or "0.5". Got "' + amount + '". ' +
                'Leave it out to let the payer choose.'
            );
        }
        const decimals = value.split('.')[1]?.length ?? 0;
        if (decimals > token.decimals) {
            return setupError(
                'INVALID_AMOUNT',
                'amount "' + amount + '" has more decimal places than ' + destinationToken +
                ' allows (' + token.decimals + ').'
            );
        }
    }

    // The API refuses a deployed site with no App ID; say so before asking it.
    const appId = setup.appId?.trim() || getUniportConfig().appId;
    if (!appId && setup.hostname) {
        if (!isLocalHost(setup.hostname)) {
            return setupError(
                'APP_ID_REQUIRED',
                'This site needs a Uniport App ID. Create one at https://uniport.dev/dashboard ' +
                'and pass it as appId. Only localhost works without one.'
            );
        }
    }

    return null;
}

/**
 * Checks an amount the payer typed, before a quote is asked for.
 *   'ok'          ask for the quote
 *   'incomplete'  still being typed (empty, "0", "0."): wait, say nothing
 *   an error      tell the payer
 */
export function checkTypedAmount(
    amount: string,
    token: { decimals: number; symbol: string }
): 'ok' | 'incomplete' | UniportError {
    const value = amount.trim();
    if (value === '' || /^0*\.?0*$/.test(value) || /^\d+\.$/.test(value)) return 'incomplete';
    if (!/^\d*\.?\d+$/.test(value)) {
        return new UniportError({ code: 'INVALID_INPUT', message: 'Enter the amount as a number, such as 25 or 0.5.' });
    }
    const decimals = value.split('.')[1]?.length ?? 0;
    if (decimals > token.decimals) {
        return new UniportError({
            code: 'INVALID_INPUT',
            message: token.symbol + ' has at most ' + token.decimals + ' decimal places.',
        });
    }
    return 'ok';
}

const reported = new Set<string>();

/** Logs a setup error for the developer, once per distinct problem. */
export function reportSetupError(error: UniportError): void {
    const line = 'Uniport [' + error.code + ']: ' + String(error.details ?? 'The payment is not set up correctly.');
    if (reported.has(line)) return;
    reported.add(line);
    console.error(line);
}
