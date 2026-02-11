// src/hooks/useSocketEvent.ts
// Lightweight hook — watches a socketStore field and fires a callback when it changes.
// Usage: useSocketEvent(store.lastResult, () => fetchResults());

'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs `callback` whenever `eventValue` changes (non-null).
 * Does NOT fire on initial mount — only on subsequent updates.
 */
export function useSocketEvent<T>(eventValue: T | null, callback: (value: T) => void) {
    const prevRef = useRef<T | null>(eventValue);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        // Skip initial mount
        if (eventValue === null) return;
        // Skip if value hasn't changed (same reference)
        if (eventValue === prevRef.current) return;

        prevRef.current = eventValue;
        callbackRef.current(eventValue);
    }, [eventValue]);
}
