import { useSyncExternalStore } from 'react';
/**
 * Subscribe one component to an observable view via the store API.
 * @param source - The observable view whose snapshot the component renders.
 * @returns The current snapshot, re-rendered on each change.
 */
export function useSnapshot(source) {
    return useSyncExternalStore(listener => source.subscribe(listener), () => source.getSnapshot());
}
//# sourceMappingURL=use-snapshot.js.map