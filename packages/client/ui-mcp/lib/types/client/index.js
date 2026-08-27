/**
 * MCP management plugin, browser half: the MCP servers settings section plus
 * the per-session bind dock above the input area. One catalog controller
 * backs the section; one session controller per Session backs dock chips, so
 * a bind/bound read cycles exactly once per active surface.
 * @module @deepseek-ai/dsh-client-ui-mcp/client
 */
import { McpCatalogController, McpSessionController } from "./controller.js";
import { McpSettingsSection } from "./McpSettingsSection.js";
import { McpDock } from "./McpDock.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'mcp';
/** Required services: the slot registry, the Remote namespace, and the copy. */
export const inject = ['slots', 'remote', 'remote.mcpManager', 'locale'];
/**
 * Client plugin body: the MCP catalog section and the per-session dock.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-mcp: dictionaries');
    const remote = ctx.remote.mcpManager;
    const catalog = new McpCatalogController(remote);
    const sections = new Map();
    const sectionFor = (sessionId) => {
        let controller = sections.get(sessionId);
        if (controller === undefined) {
            controller = new McpSessionController(remote, sessionId);
            sections.set(sessionId, controller);
        }
        return controller;
    };
    const t = ctx.locale.bind(NS);
    // A reconnect can only invalidate what was already read; a cold surface
    // stays cold until something asks for it.
    ctx.on('connection/reset', () => {
        catalog.resync();
        for (const controller of sections.values())
            controller.resync();
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'mcp',
        order: 40,
        label: () => t('nav'),
        inject: () => ({ controller: catalog, t }),
    }, McpSettingsSection));
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'mcp',
        order: 30,
        locale: NS,
        inject: (sessionId) => ({
            controller: sectionFor(sessionId),
        }),
    }, McpDock));
}
//# sourceMappingURL=index.js.map