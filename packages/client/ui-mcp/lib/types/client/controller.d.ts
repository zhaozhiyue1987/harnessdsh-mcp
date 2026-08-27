/**
 * Browser-local object layer over the mcp-manager Remote. One observable per
 * surface: the root-scoped catalog controller backs the settings section, and
 * one session controller per Session backs the input dock. Remote calls wrap
 * every business result in {@link RemoteResult}, so failures arrive as the
 * `ok: false` branch rather than a rejection.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/controller
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client';
import type { McpBindRequest, McpBindResult, McpBoundResult, McpBoundServer, McpCatalog, McpManagerResult, McpRemoveRequest, McpRemoveResult, McpServerSpec, McpServerToolsRequest, McpServerToolsResult, McpUnbindRequest, McpUnbindResult, McpUpsertRequest, McpUpsertResult } from '@deepseek-ai/dsh-mcp-manager/types';
/**
 * The generated Remote namespace this plugin drives. Every business method
 * returns `McpManagerResult<T>` and Typert wraps it in the wire layer
 * `RemoteResult<...>`, so a call settles in two discriminators: the wire
 * `ok` first, then the manager's own `ok` inside `value`.
 */
export interface McpManagerRemote {
    list: () => Promise<RemoteResult<McpManagerResult<McpCatalog>>>;
    upsert: (request: McpUpsertRequest) => Promise<RemoteResult<McpUpsertResult>>;
    deleteServer: (request: McpRemoveRequest) => Promise<RemoteResult<McpRemoveResult>>;
    bound: (agentId: SessionId) => Promise<RemoteResult<McpBoundResult>>;
    bind: (agentId: SessionId, request: McpBindRequest) => Promise<RemoteResult<McpBindResult>>;
    unbind: (agentId: SessionId, request: McpUnbindRequest) => Promise<RemoteResult<McpUnbindResult>>;
    serverTools: (request: McpServerToolsRequest) => Promise<RemoteResult<McpServerToolsResult>>;
}
/** Load state shared by every controller. */
export type McpLoadStatus = 'cold' | 'loading' | 'ready' | 'error';
/** Settled mutation outcome shown by a control. */
export type McpActionResult = {
    ok: true;
} | {
    ok: false;
    code: string;
    message: string;
};
/** Catalog view rendered by the settings section. */
export interface McpCatalogView {
    status: McpLoadStatus;
    error: string | null;
    servers: McpServerSpec[];
    /** Cached tool counts keyed by server name; `null` means not yet fetched. */
    toolCounts: ReadonlyMap<string, number>;
}
/** One session's bindings, rendering chip state in the input dock. */
export interface McpSessionView {
    status: McpLoadStatus;
    error: string | null;
    servers: McpBoundServer[];
    catalog: McpServerSpec[];
}
/** Root-scoped catalog controller (the settings section). */
export declare class McpCatalogController {
    private readonly remote;
    private view;
    private listeners;
    private tail;
    private loaded;
    constructor(remote: McpManagerRemote);
    /**
     * The current catalog view, ready after the first successful load.
     * @returns The latest catalog snapshot.
     */
    getSnapshot(): McpCatalogView;
    /**
     * Runs the listener on every catalog change.
     * @param listener - The subscription callback invoked on each change.
     * @returns A removal function for this subscription.
     */
    subscribe(listener: () => void): () => void;
    private publish;
    /** Load the catalog once; later calls reload it. */
    load(): void;
    /** Re-read only when a previous load already succeeded (transient resets). */
    resync(): void;
    /**
     * Fetch the tool count for one catalog server. Connects to the server,
     * lists its tools, then disconnects. Updates the cached toolCounts map.
     * @param serverName - The catalog name of the server to query.
     * @returns The action outcome.
     */
    fetchToolCount(serverName: string): Promise<McpActionResult>;
    /**
     * Add or replace one server; reloads the catalog on success.
     * @param server - The full spec to upsert into the managed catalog.
     * @returns The action outcome.
     */
    upsert(server: McpServerSpec): Promise<McpActionResult>;
    /**
     * Remove one server; reloads the catalog on success.
     * @param serverName - The catalog name of the server to remove.
     * @returns The action outcome.
     */
    deleteServer(serverName: string): Promise<McpActionResult>;
}
/** Session-scoped bindings controller (the input dock). */
export declare class McpSessionController {
    private readonly remote;
    private readonly sessionId;
    private view;
    private listeners;
    private loaded;
    constructor(remote: McpManagerRemote, sessionId: SessionId);
    /**
     * The current session-bindings view, ready after the first successful load.
     * @returns The latest bindings snapshot.
     */
    getSnapshot(): McpSessionView;
    /**
     * Runs the listener on every bindings change.
     * @param listener - The subscription callback invoked on each change.
     * @returns A removal function for this subscription.
     */
    subscribe(listener: () => void): () => void;
    private publish;
    /** Ensure one initial load, then reload on later taps. */
    load(): void;
    /** Re-read only when a previous load already succeeded (transient resets). */
    resync(): void;
    /**
     * Bind one catalog server; reloads bindings on success.
     * @param serverName - The catalog name of the server to bind.
     * @returns The action outcome.
     */
    bind(serverName: string): Promise<McpActionResult>;
    /**
     * Unbind one bound server; reloads bindings on success.
     * @param serverName - The catalog name of the server to unbind.
     * @returns The action outcome.
     */
    unbind(serverName: string): Promise<McpActionResult>;
}
//# sourceMappingURL=controller.d.ts.map