/**
 * ENS Resolution
 *
 * Resolves .eth names to addresses via the ENSIdeas public API.
 * Composable — usable standalone, and used internally to resolve the
 * Uniport default refund address for EVM chains.
 */

const ENSIDEAS_BASE_URL = 'https://api.ensideas.com/ens/resolve';

/** Uniport's own ENS name, used as the default EVM refund address. */
export const UNIPORT_ENS_NAME = 'uniport.eth';

/** Hardcoded fallback if ENS resolution fails (network error, API down, etc). */
export const UNIPORT_FALLBACK_REFUND_ADDRESS =
    '0x2f43A54f931b95053c3DDa5f4637065AA0c3c494';

export interface EnsResolution {
    address: string;
    name: string;
    displayName: string;
    avatar: string | null;
}

/**
 * Resolve an ENS name (e.g. "frolic.eth") to its address via ENSIdeas.
 * Returns null if the name has no resolved address or the request fails.
 */
export async function resolveEnsName(
    name: string,
    options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<EnsResolution | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeoutMs ?? 10000
    );
    options?.signal?.addEventListener('abort', () => controller.abort(), {
        once: true,
    });

    try {
        const response = await fetch(
            `${ENSIDEAS_BASE_URL}/${encodeURIComponent(name)}`,
            { signal: controller.signal }
        );
        if (!response.ok) return null;

        const data = (await response.json()) as Partial<EnsResolution>;
        if (!data.address) return null;

        return {
            address: data.address,
            name: data.name ?? name,
            displayName: data.displayName ?? name,
            avatar: data.avatar ?? null,
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Cache the resolution promise — the default refund address never changes
// within a session, so we resolve it once and reuse the same promise.
let uniportRefundAddressPromise: Promise<string> | null = null;

/**
 * Resolve the default Uniport refund address (uniport.eth), used for EVM
 * source chains when the payer doesn't provide their own refund address.
 * Falls back to a hardcoded address if resolution fails.
 */
export function getUniportDefaultRefundAddress(): Promise<string> {
    if (!uniportRefundAddressPromise) {
        uniportRefundAddressPromise = resolveEnsName(UNIPORT_ENS_NAME).then(
            (result) => result?.address ?? UNIPORT_FALLBACK_REFUND_ADDRESS
        );
    }
    return uniportRefundAddressPromise;
}
