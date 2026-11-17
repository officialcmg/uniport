import { useEffect, useState } from 'react';

/**
 * The page's hostname, known only after the component has mounted. Reading it
 * during render would give a server render and the browser different answers.
 */
export function useHostname(): string | undefined {
    const [hostname, setHostname] = useState<string | undefined>(undefined);
    useEffect(() => {
        setHostname(window.location.hostname);
    }, []);
    return hostname;
}
