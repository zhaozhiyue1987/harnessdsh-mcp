/**
 * Browser-local object layer over the mcp-manager Remote. One observable per
 * surface: the root-scoped catalog controller backs the settings section, and
 * one session controller per Session backs the input dock. Remote calls wrap
 * every business result in {@link RemoteResult}, so failures arrive as the
 * `ok: false` branch rather than a rejection.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/controller
 */
/** Base observable: one subscribe/getSnapshot pair plus an action carrier. */
function describe(code) {
    switch (code) {
        case 'unknown-server': return 'this server is no longer configured';
        case 'already-bound': return 'this server is already bound to the session';
        case 'not-bound': return 'this server is not bound to the session';
        case 'bind-failed': return 'the server could not start in this session';
        case 'invalid-spec': return 'the server definition is incomplete or invalid';
        case 'settings-unavailable': return 'the persistent catalog is unavailable';
        default: return code;
    }
}
const COLD_CATALOG = Object.freeze({ status: 'cold', error: null, servers: [], toolCounts: new Map() });
const COLD_SESSION = Object.freeze({ status: 'cold', error: null, servers: [], catalog: [] });
const OK = Object.freeze({ ok: true });
/**
 * Message of a failed layer — either the wire `error` carrier or the
 * manager's own `message` carrier; the plain `in` checks narrow each union.
 */
function failureText(r) {
    return 'error' in r ? r.error.message : 'message' in r ? r.message : '';
}
/** Root-scoped catalog controller (the settings section). */
export class McpCatalogController {
    remote;
    view = COLD_CATALOG;
    listeners = new Set();
    tail = Promise.resolve();
    loaded = false;
    constructor(remote) {
        this.remote = remote;
    }
    /**
     * The current catalog view, ready after the first successful load.
     * @returns The latest catalog snapshot.
     */
    getSnapshot() {
        return this.view;
    }
    /**
     * Runs the listener on every catalog change.
     * @param listener - The subscription callback invoked on each change.
     * @returns A removal function for this subscription.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    publish(next) {
        this.view = next;
        for (const listener of this.listeners)
            listener();
    }
    /** Load the catalog once; later calls reload it. */
    load() {
        if (this.view.status === 'loading')
            return;
        this.publish({ status: 'loading', error: null, servers: this.view.servers, toolCounts: this.view.toolCounts });
        void (async () => {
            const result = await this.remote.list();
            if (result.ok && result.value.ok) {
                this.loaded = true;
                this.publish({ status: 'ready', error: null, servers: result.value.value.servers, toolCounts: this.view.toolCounts });
            }
            else {
                this.publish({ status: 'error', error: failureText(result), servers: this.view.servers, toolCounts: this.view.toolCounts });
            }
        })();
    }
    /** Re-read only when a previous load already succeeded (transient resets). */
    resync() {
        if (this.loaded)
            this.load();
    }
    /**
     * Fetch the tool count for one catalog server. Connects to the server,
     * lists its tools, then disconnects. Updates the cached toolCounts map.
     * @param serverName - The catalog name of the server to query.
     * @returns The action outcome.
     */
    async fetchToolCount(serverName) {
        const result = await this.remote.serverTools({ serverName });
        if (!result.ok)
            return { ok: false, code: result.error.code, message: result.error.message };
        if (!result.value.ok)
            return { ok: false, code: result.value.code, message: result.value.message };
        const counts = new Map(this.view.toolCounts);
        counts.set(serverName, result.value.value.toolsCount);
        this.publish({ ...this.view, toolCounts: counts });
        return OK;
    }
    /**
     * Add or replace one server; reloads the catalog on success.
     * @param server - The full spec to upsert into the managed catalog.
     * @returns The action outcome.
     */
    async upsert(server) {
        const result = await this.remote.upsert({ server });
        if (!result.ok)
            return { ok: false, code: result.error.code, message: result.error.message };
        this.tail = this.tail
            .then(() => this.remote.list())
            .then((reloaded) => {
            if (reloaded.ok && reloaded.value.ok) {
                this.publish({ status: 'ready', error: null, servers: reloaded.value.value.servers, toolCounts: this.view.toolCounts });
            }
        })
            .catch(() => { });
        await this.tail;
        return OK;
    }
    /**
     * Remove one server; reloads the catalog on success.
     * @param serverName - The catalog name of the server to remove.
     * @returns The action outcome.
     */
    async deleteServer(serverName) {
        const result = await this.remote.deleteServer({ serverName });
        if (!result.ok)
            return { ok: false, code: result.error.code, message: result.error.message };
        const counts = new Map(this.view.toolCounts);
        counts.delete(serverName);
        this.publish({ status: 'ready', error: null, servers: this.view.servers.filter(s => s.serverName !== serverName), toolCounts: counts });
        return OK;
    }
}
/** Session-scoped bindings controller (the input dock). */
export class McpSessionController {
    remote;
    sessionId;
    view = COLD_SESSION;
    listeners = new Set();
    loaded = false;
    constructor(remote, sessionId) {
        this.remote = remote;
        this.sessionId = sessionId;
    }
    /**
     * The current session-bindings view, ready after the first successful load.
     * @returns The latest bindings snapshot.
     */
    getSnapshot() {
        return this.view;
    }
    /**
     * Runs the listener on every bindings change.
     * @param listener - The subscription callback invoked on each change.
     * @returns A removal function for this subscription.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    publish(next) {
        this.view = next;
        for (const listener of this.listeners)
            listener();
    }
    /** Ensure one initial load, then reload on later taps. */
    load() {
        if (this.view.status === 'loading')
            return;
        this.publish({ status: 'loading', error: null, servers: this.view.servers, catalog: this.view.catalog });
        void (async () => {
            const boundResult = await this.remote.bound(this.sessionId);
            const catalogResult = await this.remote.list();
            if (catalogResult.ok && catalogResult.value.ok && boundResult.ok && boundResult.value.ok) {
                this.loaded = true;
                this.publish({
                    status: 'ready', error: null,
                    servers: boundResult.value.value.servers, catalog: catalogResult.value.value.servers,
                });
            }
            else {
                // Prefer the manager's own failure detail over a wire-level failure.
                const failed = boundResult.ok && !boundResult.value.ok ? boundResult.value : catalogResult;
                this.publish({ status: 'error', error: failureText(failed), servers: this.view.servers, catalog: this.view.catalog });
            }
        })();
    }
    /** Re-read only when a previous load already succeeded (transient resets). */
    resync() {
        if (this.loaded)
            this.load();
    }
    /**
     * Bind one catalog server; reloads bindings on success.
     * @param serverName - The catalog name of the server to bind.
     * @returns The action outcome.
     */
    async bind(serverName) {
        const result = await this.remote.bind(this.sessionId, { serverName });
        if (!result.ok) {
            return { ok: false, code: result.error.code, message: describe(result.error.code) || result.error.message };
        }
        this.load();
        return OK;
    }
    /**
     * Unbind one bound server; reloads bindings on success.
     * @param serverName - The catalog name of the server to unbind.
     * @returns The action outcome.
     */
    async unbind(serverName) {
        const result = await this.remote.unbind(this.sessionId, { serverName });
        if (!result.ok) {
            return { ok: false, code: result.error.code, message: describe(result.error.code) || result.error.message };
        }
        this.load();
        return OK;
    }
}
//# sourceMappingURL=controller.js.map