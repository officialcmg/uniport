/**
 * Uniport SDK Configuration
 *
 * The SDK uses Uniport's hosted backend by default. An app is identified by
 * its public App ID, created in the dashboard at https://uniport.dev/dashboard.
 * Without one the SDK only works on localhost.
 */

import { SETUP_ERROR_PAYER_MESSAGE, UniportError } from './errors';

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

/** True for a value that is a secret key, whatever its letter case. */
export function looksLikeSecretKey(value: string | undefined): boolean {
    const lower = value?.trim().toLowerCase() ?? '';
    return lower.startsWith('sk_') || lower.startsWith('whsec_');
}

interface ConfigStore {
    appId?: string;
    backendUrl?: string;
    requestTimeoutMs?: number;
    warnedAppIds: Set<string>;
}

/**
 * The package ships three entry points ('uniport-sdk', '/core', '/components'),
 * each bundled on its own. The settings live on globalThis so that a value set
 * through one entry point is seen by the others.
 */
const STORE_KEY = Symbol.for('uniport-sdk.config');
const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: ConfigStore };
const store: ConfigStore = (globalStore[STORE_KEY] ??= { warnedAppIds: new Set() });

/**
 * Checks a value before it is used as an App ID. A secret key must never reach
 * the browser, so one is refused outright; anything else that does not look
 * like an App ID is passed on with a warning, and the backend will refuse it.
 */
export function checkAppId(appId: string | undefined): string | undefined {
    const value = appId?.trim();
    if (!value) return undefined;
    if (looksLikeSecretKey(value)) {
        throw new UniportError({
            code: 'SECRET_KEY_AS_APP_ID',
            message: SETUP_ERROR_PAYER_MESSAGE,
            details:
                'A secret key was passed as appId. Secret keys must stay on your server; ' +
                'use the public App ID (app_...) from https://uniport.dev/dashboard.',
        });
    }
    if (!APP_ID_FORMAT.test(value) && !store.warnedAppIds.has(value)) {
        store.warnedAppIds.add(value);
        console.warn(
            `Uniport: "${value}" does not look like an App ID (app_ followed by 22 characters). ` +
            'Copy it from https://uniport.dev/dashboard.'
        );
    }
    return value;
}

function normalizeBackendUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

export function configureUniport(config: UniportConfig): void {
    if (config.appId !== undefined) {
        store.appId = checkAppId(config.appId);
    }

    if (config.backendUrl !== undefined) {
        store.backendUrl = config.backendUrl
            ? normalizeBackendUrl(config.backendUrl)
            : undefined;
    }

    if (config.requestTimeoutMs !== undefined) {
        store.requestTimeoutMs =
            config.requestTimeoutMs > 0
                ? config.requestTimeoutMs
                : DEFAULT_REQUEST_TIMEOUT_MS;
    }
}

export function getUniportConfig(): ResolvedUniportConfig {
    const backendUrl =
        store.backendUrl ||
        DEFAULT_HOSTED_BACKEND_URL;

    return {
        appId: store.appId,
        backendUrl: normalizeBackendUrl(backendUrl),
        requestTimeoutMs:
            store.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    };
}
