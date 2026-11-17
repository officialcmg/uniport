/**
 * Every error the SDK reports is a UniportError with a code. `fixableBy` says
 * who can do something about it, which decides what the payer is shown:
 *
 *   developer  the app is set up wrongly. The payer sees a neutral message;
 *              the real reason goes to the console and to onError.
 *   payer      the payer can change something (amount, refund address).
 *              `message` says what.
 *   service    nobody can fix it right now (network, 1Click, Uniport).
 *              `message` asks the payer to try again.
 */

export type UniportErrorCode =
    // The app's setup, found before any request is made
    | 'MISSING_RECIPIENT'
    | 'INVALID_DESTINATION_TOKEN'
    | 'INVALID_RECIPIENT'
    | 'INVALID_AMOUNT'
    | 'SECRET_KEY_AS_APP_ID'
    // The app's setup, reported by the API
    | 'APP_ID_REQUIRED'
    | 'APP_NOT_FOUND'
    | 'ORIGIN_NOT_ALLOWED'
    | 'RECIPIENT_NOT_ALLOWED'
    | 'RECIPIENT_NOT_READY'
    | 'VALIDATION_ERROR'
    // Something the payer can change
    | 'NO_LIQUIDITY'
    | 'AMOUNT_TOO_LOW'
    | 'INVALID_REFUND_ADDRESS'
    // The payment ended badly after funds were sent
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_FAILED'
    // The service
    | 'QUOTE_FAILED'
    | 'QUOTE_UNVERIFIED'
    | 'DEPOSIT_SUBMISSION_FAILED'
    | 'STATUS_CHECK_FAILED'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR'
    | 'REQUEST_TIMEOUT'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';

export type UniportErrorFixableBy = 'developer' | 'payer' | 'service';

const DEVELOPER_CODES: ReadonlySet<string> = new Set([
    'MISSING_RECIPIENT',
    'INVALID_DESTINATION_TOKEN',
    'INVALID_RECIPIENT',
    'INVALID_AMOUNT',
    'SECRET_KEY_AS_APP_ID',
    'APP_ID_REQUIRED',
    'APP_NOT_FOUND',
    'ORIGIN_NOT_ALLOWED',
    'RECIPIENT_NOT_ALLOWED',
    'RECIPIENT_NOT_READY',
    'VALIDATION_ERROR',
]);

const PAYER_CODES: ReadonlySet<string> = new Set([
    'NO_LIQUIDITY',
    'AMOUNT_TOO_LOW',
    'INVALID_REFUND_ADDRESS',
]);

/** Who can do something about an error with this code. */
export function fixableByCode(code: string | undefined): UniportErrorFixableBy {
    if (code && DEVELOPER_CODES.has(code)) return 'developer';
    if (code && PAYER_CODES.has(code)) return 'payer';
    return 'service';
}

/** What a payer is shown when the app itself is set up wrongly. */
export const SETUP_ERROR_PAYER_MESSAGE =
    'Payments are not available on this site right now. Please contact the site owner.';

export interface UniportApiErrorBody {
    code?: UniportErrorCode;
    message?: string;
    details?: unknown;
    /** With AMOUNT_TOO_LOW, the least the route will take, when known. */
    minimum?: { amount?: string; usd?: string };
}

export class UniportError extends Error {
    code: UniportErrorCode;
    /** Who can do something about it. See the top of this file. */
    fixableBy: UniportErrorFixableBy;
    /**
     * More for the developer: the API's own answer, or for setup errors the
     * sentence that says what to change.
     */
    details?: unknown;
    status?: number;

    constructor(params: {
        code: UniportErrorCode;
        message: string;
        details?: unknown;
        status?: number;
    }) {
        super(params.message);
        this.name = 'UniportError';
        this.code = params.code;
        this.fixableBy = fixableByCode(params.code);
        this.details = params.details;
        this.status = params.status;
    }
}

// Read the code rather than use instanceof: each entry point of the package is
// bundled with its own copy of the UniportError class.
export function errorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
}

/** True for errors caused by how the app is set up, which retrying will not fix. */
export function isAppSetupError(error: unknown): error is UniportError {
    return fixableByCode(errorCode(error)) === 'developer' && errorCode(error) !== undefined;
}

/** True when the backend refused a request because too many were sent. */
export function isRateLimitError(error: unknown): error is UniportError {
    return errorCode(error) === 'RATE_LIMITED';
}

/** Turns anything thrown into a UniportError, keeping one that already is. */
export function toUniportErrorFromUnknown(error: unknown, fallbackMessage: string): UniportError {
    if (errorCode(error) !== undefined && error instanceof Error) return error as UniportError;
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && typeof (error as { message?: unknown }).message === 'string'
              ? (error as { message: string }).message
              : fallbackMessage;
    // fetch() rejects with a TypeError when the request never reached the server.
    const code: UniportErrorCode = error instanceof TypeError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR';
    return new UniportError({ code, message: message || fallbackMessage, details: error });
}
