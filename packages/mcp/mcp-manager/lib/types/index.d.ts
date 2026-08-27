/**
 * MCP server management surface. Owns a persistent server catalog (a
 * settings section), exposes it plus session-scoped bind/unbind and live tool
 * inventory over Typert Remote, and realizes each binding as an mcp-client
 * plugin instance mounted on the target agent's scoped context — so tools
 * land in that session's layer only and a bind survives exactly as long as
 * the agent does.
 *
 * @module @deepseek-ai/dsh-mcp-manager
 */
import type { Agent } from '@deepseek-ai/dsh-agent';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { Context, Service } from '@deepseek-ai/cordis';
import { type McpBindRequest, type McpBindResult, type McpBoundResult, type McpCatalog, type McpManagerResult, type McpRemoveRequest, type McpRemoveResult, type McpServerToolsRequest, type McpServerToolsResult, type McpUnbindRequest, type McpUnbindResult, type McpUpsertRequest, type McpUpsertResult } from './types.ts';
export type * from './types.ts';
/** Settings section storing the managed server catalog. */
export declare const MCP_CATALOG_NAMESPACE = "mcp-manager";
/** Server management and session-scoped MCP bindings over Typert Remote. */
export declare class McpManagerService extends TypertRemoteService {
    static inject: string[];
    private catalogScope;
    private readonly bindings;
    private mutationTail;
    /**
     * @param ctx - Host context carrying the settings service.
     */
    constructor(ctx: Context);
    /** Register the catalog settings section and react to session teardown. */
    protected [Service.init](): void;
    private requireCatalog;
    /** Serialize writes so the settings revision counter never sees a race. */
    private enqueue;
    /**
     * List the managed server catalog as persisted.
     * @returns The configured servers, each with its defaults resolved.
     */
    list(): McpManagerResult<McpCatalog>;
    /**
     * Resolve a client-supplied spec into the persisted form: validate identity
     * and transport-required fields, then merge every default so bind simply
     * translates the catalog entry.
     */
    private static resolveSpec;
    /**
     * Add or replace one managed server by its `serverName`.
     * @param request - The server spec to persist; a name that already exists
     * replaces that entry (edit), an unknown name appends it.
     * @returns The persisted (default-filled) spec.
     */
    upsert(request: McpUpsertRequest): Promise<McpUpsertResult>;
    /**
     * Remove one managed server and unbind it from every session.
     * @param request - The catalog `serverName` to remove.
     * @returns The removed name, or `unknown-server` when absent.
     */
    deleteServer(request: McpRemoveRequest): Promise<McpRemoveResult>;
    /**
     * List the MCP servers bound to the calling session, with each binding's
     * current tool inventory.
     * @param agent - The calling agent (resolved from the session id).
     * @returns The bound servers and their live tools.
     */
    bound(agent: Agent): McpBoundResult;
    /**
     * Query one managed server and return its current tool count.
     * Connects to the server, lists its tools, then disconnects.
     * Used by the settings page to show tool count without binding.
     * @param request - The catalog `serverName` to query.
     * @returns The server name and its tools count.
     */
    serverTools(request: McpServerToolsRequest): Promise<McpServerToolsResult>;
    /**
     * Bind one managed server to the calling session.
     * @param agent - The calling agent (resolved from the session id).
     * @param request - The catalog `serverName` to bind.
     * @returns The new binding with its live tools.
     */
    bind(agent: Agent, request: McpBindRequest): Promise<McpBindResult>;
    /**
     * Unbind one managed server from the calling session.
     * @param agent - The calling agent (resolved from the session id).
     * @param request - The catalog `serverName` to unbind.
     * @returns The unbound name, or `not-bound` when absent.
     */
    unbind(agent: Agent, request: McpUnbindRequest): Promise<McpUnbindResult>;
    /** Project one binding's tools from the live connection handle. */
    private snapshotBinding;
    /** Build an explicit failure carrier from an unexpected error. */
    private failure;
}
export default McpManagerService;
//# sourceMappingURL=index.d.ts.map