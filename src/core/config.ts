/**
 * Uniport SDK Configuration
 *
 * The SDK uses Uniport's hosted backend by default. An app is identified by
 * its public App ID, created in the dashboard at https://uniport.dev/dashboard.
 * Without one the SDK only works on localhost.
 */

export interface UniportConfig {
    /**
     * Your app's public App ID (`app_...`). It can also be passed as the
     * `appId` prop on the components, which takes precedence.
     */
    appId?: string;
    /** Internal backend override. Standard integrations should not set this. */
    backendUrl?: string;
    /** Request timeout in milliseconds for backend calls. */
    requestTimeoutMs?: number;
}

export interface ResolvedUniportConfig {
    appId?: string;
    backendUrl: string;
    requestTimeoutMs: number;
}

/** Default hosted backend URL */
export const DEFAULT_HOSTED_BACKEND_URL =
    'https://api.uniport.dev';

/** Default timeout for backend requests */
export const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

const APP_ID_FORMAT = /^app_[0-9A-Za-z]{22}$/;

/**
 * Checks a value before it is used as an App ID. A secret key must never reach
 * the browser, so one is refused outright; anything else that does not look
 * like an App ID is passed on with a warning, and the backend will refuse it.
 */
export function checkAppId(appId: string | undefined): string | undefined {
    const value = appId?.trim();
    if (!value) return undefined;
    if (value.startsWith('sk_') || value.startsWith('whsec_')) {
        throw new Error(
            'Uniport: a secret key was passed as appId. Secret keys must stay on your server; ' +
            'use the public App ID (app_...) from https://uniport.dev/dashboard.'
        );
    }
    if (!APP_ID_FORMAT.test(value)) {
        console.warn(
            `Uniport: "${value}" does not look like an App ID (app_ followed by 22 characters). ` +
            'Copy it from https://uniport.dev/dashboard.'
        );
    }
    return value;
}

let configuredAppId: string | undefined;
let configuredBackendUrl: string | undefined;
let configuredRequestTimeoutMs: number | undefined;

function normalizeBackendUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

export function configureUniport(config: UniportConfig): void {
    if (config.appId !== undefined) {
        configuredAppId = checkAppId(config.appId);
    }

    if (config.backendUrl !== undefined) {
        configuredBackendUrl = config.backendUrl
            ? normalizeBackendUrl(config.backendUrl)
            : undefined;
    }

    if (config.requestTimeoutMs !== undefined) {
        configuredRequestTimeoutMs =
            config.requestTimeoutMs > 0
                ? config.requestTimeoutMs
                : DEFAULT_REQUEST_TIMEOUT_MS;
    }
}

export function getUniportConfig(): ResolvedUniportConfig {
    const backendUrl =
        configuredBackendUrl ||
        DEFAULT_HOSTED_BACKEND_URL;

    return {
        appId: configuredAppId,
        backendUrl: normalizeBackendUrl(backendUrl),
        requestTimeoutMs:
            configuredRequestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    };
}
