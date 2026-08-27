/** Standalone observable view: a snapshot plus a subscription pair. */
export interface ObservableView<T> {
    getSnapshot(): T;
    subscribe(listener: () => void): () => void;
}
/**
 * Subscribe one component to an observable view via the store API.
 * @param source - The observable view whose snapshot the component renders.
 * @returns The current snapshot, re-rendered on each change.
 */
export declare function useSnapshot<T>(source: ObservableView<T>): T;
//# sourceMappingURL=use-snapshot.d.ts.map