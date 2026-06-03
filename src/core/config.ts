/**
 * Uniport SDK Configuration
 *
 * The SDK uses Uniport's hosted backend by default. No frontend API key or
 * application-provided backend URL is required.
 */

export interface UniportConfig {
    /** Internal backend override. Standard integrations should not set this. */
    backendUrl?: string;
    /** Request timeout in milliseconds for backend calls. */
    requestTimeoutMs?: number;
}

export interface ResolvedUniportConfig {
    backendUrl: string;
    requestTimeoutMs: number;
}

/** Default hosted backend URL */
export const DEFAULT_HOSTED_BACKEND_URL =
    'https://uniport-backend-production.up.railway.app';

/** Default timeout for backend requests */
export const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

let configuredBackendUrl: string | undefined;
let configuredRequestTimeoutMs: number | undefined;

function normalizeBackendUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

export function configureUniport(config: UniportConfig): void {
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
        backendUrl: normalizeBackendUrl(backendUrl),
        requestTimeoutMs:
            configuredRequestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    };
}
