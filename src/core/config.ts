/**
 * Uniport SDK Configuration
 *
 * The SDK connects to the Uniport backend which securely handles
 * API keys and 1Click SDK interactions. No API key is needed on the frontend.
 */

/** Default backend URL (Render production) */
const DEFAULT_BACKEND_URL = 'https://uniport-backend-u8b4.onrender.com';

/** Backend URL — can be overridden via environment variable for local dev */
export const BACKEND_URL: string =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_UNIPORT_BACKEND_URL) ||
    (typeof window !== 'undefined' && (window as any).__UNIPORT_BACKEND_URL__) ||
    DEFAULT_BACKEND_URL;
