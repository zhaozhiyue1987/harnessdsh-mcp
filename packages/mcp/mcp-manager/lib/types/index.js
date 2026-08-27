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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { createHash } from 'node:crypto';
import { apply as applyMcpClient, connectionHandle, createTransport, DEFAULT_TOOL_CALL_TIMEOUT_MS, publicToolName, RECONNECT_DEFAULTS, SERVER_NAME_PATTERN, } from '@deepseek-ai/dsh-mcp-client';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { MAX_TIMER_DELAY_MS } from '@deepseek-ai/dsh-timeout';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { Service } from '@deepseek-ai/cordis';
import s from '@deepseek-ai/schemastery';
import { ok, rejected, } from "./types.js";
/** Settings section storing the managed server catalog. */
export const MCP_CATALOG_NAMESPACE = 'mcp-manager';
/** Instance namespace reserved for one live binding, keyed by root context. */
const MCP_CLIENT_NAME = 'mcp-client';
const MCP_CLIENT_INJECT = ['tools'];
/** Default-filled connect config for one bind, per the parsed catalog spec. */
const ReconnectSpecSchema = s.object({
    enabled: s.boolean().default(RECONNECT_DEFAULTS.enabled),
    initialDelayMs: s.number().min(1).max(MAX_TIMER_DELAY_MS).default(RECONNECT_DEFAULTS.initialDelayMs),
    maxDelayMs: s.number().min(1).max(MAX_TIMER_DELAY_MS).default(RECONNECT_DEFAULTS.maxDelayMs),
    maxAttempts: s.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER).default(RECONNECT_DEFAULTS.maxAttempts),
});
/** One managed server as persisted; parse fills every optional default. */
const McpServerSpecSchema = s.union([
    s.object({
        serverName: s.string().required().pattern(SERVER_NAME_PATTERN),
        transport: s.const('stdio'),
        command: s.string().required(),
        args: s.array(String).default([]),
        env: s.dict(String).default({}),
        cwd: s.string().default(''),
        toolCallTimeoutMs: s.number().default(DEFAULT_TOOL_CALL_TIMEOUT_MS),
        failOnStartupError: s.boolean().default(false),
        reconnect: ReconnectSpecSchema,
    }),
    s.object({
        serverName: s.string().required().pattern(SERVER_NAME_PATTERN),
        transport: s.const('streamable-http'),
        url: s.string().required(),
        headers: s.dict(String).default({}),
        toolCallTimeoutMs: s.number().default(DEFAULT_TOOL_CALL_TIMEOUT_MS),
        failOnStartupError: s.boolean().default(false),
        reconnect: ReconnectSpecSchema,
    }),
    s.object({
        serverName: s.string().required().pattern(SERVER_NAME_PATTERN),
        transport: s.const('sse'),
        url: s.string().required(),
        headers: s.dict(String).default({}),
        toolCallTimeoutMs: s.number().default(DEFAULT_TOOL_CALL_TIMEOUT_MS),
        failOnStartupError: s.boolean().default(false),
        reconnect: ReconnectSpecSchema,
    }),
]);
/** Catalog document; the settings section's value type. */
const McpCatalogSchema = s.object({
    servers: s.array(McpServerSpecSchema).default([]),
});
/**
 * Unique model-facing namespace for one binding. The catalog `serverName` is
 * per-config and would collide across sessions (mcp-client reserves names per
 * app), so every session binding gets its own derived instance name:
 * `base_<sha256(session:server)>`, bucketed to the 32-character budget.
 */
function mcpInstanceName(serverName, sessionId) {
    const base = serverName.slice(0, 19);
    const hash = createHash('sha256').update(`${serverName}\0${sessionId}`).digest('hex').slice(0, 12);
    return `${base}_${hash}`;
}
/** Fill the mcp-client plugin config for one bind from the resolved spec. */
function toClientConfig(server, instanceName) {
    const common = {
        serverName: instanceName,
        toolCallTimeoutMs: server.toolCallTimeoutMs,
        failOnStartupError: server.failOnStartupError,
        reconnect: server.reconnect,
    };
    if (server.transport === 'stdio') {
        return { transport: 'stdio', command: server.command, args: server.args, env: server.env, cwd: server.cwd, ...common };
    }
    return { transport: server.transport, url: server.url, headers: server.headers, ...common };
}
/** The mcp-client plugin object mounted per binding. */
const McpClientInstance = {
    name: MCP_CLIENT_NAME,
    inject: MCP_CLIENT_INJECT,
    apply: applyMcpClient,
};
/** Server management and session-scoped MCP bindings over Typert Remote. */
let McpManagerService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _upsert_decorators;
    let _deleteServer_decorators;
    let _bound_decorators;
    let _serverTools_decorators;
    let _bind_decorators;
    let _unbind_decorators;
    return class McpManagerService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _list_decorators = [Remote('list')];
            _upsert_decorators = [Remote('upsert')];
            _deleteServer_decorators = [Remote('deleteServer')];
            _bound_decorators = [Remote('bound')];
            _serverTools_decorators = [Remote('serverTools')];
            _bind_decorators = [Remote('bind')];
            _unbind_decorators = [Remote('unbind')];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _upsert_decorators, { kind: "method", name: "upsert", static: false, private: false, access: { has: obj => "upsert" in obj, get: obj => obj.upsert }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteServer_decorators, { kind: "method", name: "deleteServer", static: false, private: false, access: { has: obj => "deleteServer" in obj, get: obj => obj.deleteServer }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _bound_decorators, { kind: "method", name: "bound", static: false, private: false, access: { has: obj => "bound" in obj, get: obj => obj.bound }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _serverTools_decorators, { kind: "method", name: "serverTools", static: false, private: false, access: { has: obj => "serverTools" in obj, get: obj => obj.serverTools }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _bind_decorators, { kind: "method", name: "bind", static: false, private: false, access: { has: obj => "bind" in obj, get: obj => obj.bind }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _unbind_decorators, { kind: "method", name: "unbind", static: false, private: false, access: { has: obj => "unbind" in obj, get: obj => obj.unbind }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['settings'];
        catalogScope = __runInitializers(this, _instanceExtraInitializers);
        bindings = new Map();
        mutationTail = Promise.resolve();
        /**
         * @param ctx - Host context carrying the settings service.
         */
        constructor(ctx) {
            super(ctx, 'mcpManager');
        }
        /** Register the catalog settings section and react to session teardown. */
        [Service.init]() {
            // Reuse the persistence the settings capability already owns: the catalog
            // is user settings, hot-reloaded from disk like every other section.
            this.catalogScope = this.ctx.settings.register(settingsNamespace(MCP_CATALOG_NAMESPACE), McpCatalogSchema, { base: { servers: [] } });
            this.ctx.effect(() => () => {
                this.catalogScope = undefined;
                this.bindings.clear();
            }, 'mcpManager.catalog');
            // The binding's fiber hangs off the agent scope, so teardown already
            // disposes it; the map entry is what must go. `agent/disposed` fires
            // after the agent's scope settled, so no in-flight dispose is needed.
            this.ctx.on('agent/disposed', ({ agent }) => {
                this.bindings.delete(agent.id);
            });
        }
        requireCatalog() {
            const scope = this.catalogScope;
            if (scope === undefined)
                throw new Error('mcpManager: catalog settings are unavailable');
            return scope;
        }
        /** Serialize writes so the settings revision counter never sees a race. */
        enqueue(operation) {
            const run = this.mutationTail.then(operation, operation);
            this.mutationTail = run.then(() => undefined, () => undefined);
            return run;
        }
        /**
         * List the managed server catalog as persisted.
         * @returns The configured servers, each with its defaults resolved.
         */
        list() {
            try {
                return ok(this.requireCatalog().get());
            }
            catch (error) {
                return this.failure('settings-unavailable', error);
            }
        }
        /**
         * Resolve a client-supplied spec into the persisted form: validate identity
         * and transport-required fields, then merge every default so bind simply
         * translates the catalog entry.
         */
        static resolveSpec(input) {
            if (!SERVER_NAME_PATTERN.test(input.serverName)) {
                throw new Error(`mcp-manager: "${input.serverName}" is not a valid serverName (expected [A-Za-z0-9_-]{1,32})`);
            }
            const common = {
                serverName: input.serverName,
                toolCallTimeoutMs: input.toolCallTimeoutMs ?? DEFAULT_TOOL_CALL_TIMEOUT_MS,
                failOnStartupError: input.failOnStartupError ?? false,
                reconnect: { ...RECONNECT_DEFAULTS, ...input.reconnect },
            };
            if (input.transport === 'stdio') {
                if (input.command === undefined || input.command === '') {
                    throw new Error('mcp-manager: stdio servers require a non-empty command');
                }
                return {
                    transport: 'stdio',
                    command: input.command,
                    args: input.args ?? [],
                    env: input.env ?? {},
                    cwd: input.cwd ?? '',
                    ...common,
                };
            }
            if (input.url === undefined || input.url === '') {
                throw new Error(`mcp-manager: ${input.transport} servers require a URL`);
            }
            return { transport: input.transport, url: input.url, headers: input.headers ?? {}, ...common };
        }
        /**
         * Add or replace one managed server by its `serverName`.
         * @param request - The server spec to persist; a name that already exists
         * replaces that entry (edit), an unknown name appends it.
         * @returns The persisted (default-filled) spec.
         */
        upsert(request) {
            let resolved;
            try {
                resolved = McpManagerService.resolveSpec(request.server);
            }
            catch (error) {
                return Promise.resolve(this.failure('invalid-spec', error));
            }
            return this.enqueue(async () => {
                try {
                    const catalog = this.requireCatalog();
                    const servers = [...catalog.get().servers];
                    const index = servers.findIndex(entry => entry.serverName === resolved.serverName);
                    if (index >= 0)
                        servers[index] = resolved;
                    else
                        servers.push(resolved);
                    await catalog.update({ servers });
                    return ok(resolved);
                }
                catch (error) {
                    return this.failure('internal', error);
                }
            });
        }
        /**
         * Remove one managed server and unbind it from every session.
         * @param request - The catalog `serverName` to remove.
         * @returns The removed name, or `unknown-server` when absent.
         */
        deleteServer(request) {
            return this.enqueue(async () => {
                try {
                    const catalog = this.requireCatalog();
                    const servers = catalog.get().servers;
                    if (!servers.some(entry => entry.serverName === request.serverName)) {
                        return rejected('unknown-server', `mcp-manager: server "${request.serverName}" is not configured`);
                    }
                    // Unbind everywhere first so no session keeps tools of a deleted server.
                    for (const [sessionId, entries] of this.bindings) {
                        const instance = entries.get(request.serverName);
                        if (instance === undefined)
                            continue;
                        await instance.dispose();
                        entries.delete(request.serverName);
                        if (entries.size === 0)
                            this.bindings.delete(sessionId);
                    }
                    await catalog.update({ servers: servers.filter(entry => entry.serverName !== request.serverName) });
                    return ok({ serverName: request.serverName });
                }
                catch (error) {
                    return this.failure('internal', error);
                }
            });
        }
        /**
         * List the MCP servers bound to the calling session, with each binding's
         * current tool inventory.
         * @param agent - The calling agent (resolved from the session id).
         * @returns The bound servers and their live tools.
         */
        bound(agent) {
            try {
                const entries = this.bindings.get(agent.id);
                const servers = [];
                if (entries !== undefined) {
                    for (const [serverName, instance] of entries) {
                        servers.push(this.snapshotBinding(agent, serverName, instance));
                    }
                }
                return ok({ servers });
            }
            catch (error) {
                return this.failure('internal', error);
            }
        }
        /**
         * Query one managed server and return its current tool count.
         * Connects to the server, lists its tools, then disconnects.
         * Used by the settings page to show tool count without binding.
         * @param request - The catalog `serverName` to query.
         * @returns The server name and its tools count.
         */
        async serverTools(request) {
            try {
                const server = this.requireCatalog().get().servers.find(entry => entry.serverName === request.serverName);
                if (server === undefined) {
                    return rejected('unknown-server', `mcp-manager: server "${request.serverName}" is not configured`);
                }
                const config = toClientConfig(McpManagerService.resolveSpec(server), request.serverName);
                const client = new Client({ name: 'dsh-mcp-client', version: '0.0.1' }, { capabilities: {} });
                try {
                    const transport = createTransport(config);
                    await client.connect(transport);
                    const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);
                    return ok({ serverName: request.serverName, toolsCount: result.tools.length });
                }
                finally {
                    await client.close();
                }
            }
            catch (error) {
                return this.failure('bind-failed', error);
            }
        }
        /**
         * Bind one managed server to the calling session.
         * @param agent - The calling agent (resolved from the session id).
         * @param request - The catalog `serverName` to bind.
         * @returns The new binding with its live tools.
         */
        async bind(agent, request) {
            try {
                const server = this.requireCatalog().get().servers.find(entry => entry.serverName === request.serverName);
                if (server === undefined) {
                    return rejected('unknown-server', `mcp-manager: server "${request.serverName}" is not configured`);
                }
                let entries = this.bindings.get(agent.id);
                if (entries?.has(request.serverName)) {
                    return rejected('already-bound', `mcp-manager: server "${request.serverName}" is already bound to this session`);
                }
                const instanceName = mcpInstanceName(request.serverName, agent.id);
                // Mounting on the agent's scoped context puts every tool registration
                // into that session's layer: other sessions and the global layer stay
                // untouched, and the agent's teardown disposes the whole binding.
                // Catalog entries are already resolved; re-resolving is the explicit
                // narrow to ResolvedMcpServerSpec the translator requires.
                const fiber = agent.ctx.plugin(McpClientInstance, toClientConfig(McpManagerService.resolveSpec(server), instanceName));
                try {
                    await fiber;
                }
                catch (error) {
                    return rejected('bind-failed', `mcp-manager: could not bind "${request.serverName}": ${String(error)}`);
                }
                const instance = {
                    instanceName,
                    dispose: () => fiber.dispose(),
                };
                if (entries === undefined) {
                    entries = new Map();
                    this.bindings.set(agent.id, entries);
                }
                entries.set(request.serverName, instance);
                return ok(this.snapshotBinding(agent, request.serverName, instance));
            }
            catch (error) {
                return this.failure('internal', error);
            }
        }
        /**
         * Unbind one managed server from the calling session.
         * @param agent - The calling agent (resolved from the session id).
         * @param request - The catalog `serverName` to unbind.
         * @returns The unbound name, or `not-bound` when absent.
         */
        async unbind(agent, request) {
            try {
                const entries = this.bindings.get(agent.id);
                const instance = entries?.get(request.serverName);
                if (entries === undefined || instance === undefined) {
                    return rejected('not-bound', `mcp-manager: server "${request.serverName}" is not bound to this session`);
                }
                await instance.dispose();
                entries.delete(request.serverName);
                if (entries.size === 0)
                    this.bindings.delete(agent.id);
                return ok({ serverName: request.serverName });
            }
            catch (error) {
                return this.failure('internal', error);
            }
        }
        /** Project one binding's tools from the live connection handle. */
        snapshotBinding(agent, serverName, instance) {
            const handle = connectionHandle(agent.ctx, instance.instanceName);
            const tools = (handle?.listTools() ?? []).map(tool => ({
                rawName: tool.name,
                publicName: publicToolName(instance.instanceName, tool.name),
                description: tool.description,
                // The SDK validated the schema as JSON; the wire type asserts that shape.
                inputSchema: tool.inputSchema,
            }));
            return { serverName, instanceName: instance.instanceName, tools };
        }
        /** Build an explicit failure carrier from an unexpected error. */
        failure(code, error) {
            return rejected(code, error instanceof Error ? error.message : String(error));
        }
    };
})();
export { McpManagerService };
export default McpManagerService;
//# sourceMappingURL=index.js.map