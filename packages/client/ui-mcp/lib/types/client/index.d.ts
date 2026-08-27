/**
 * MCP management plugin, browser half: the MCP servers settings section plus
 * the per-session bind dock above the input area. One catalog controller
 * backs the section; one session controller per Session backs dock chips, so
 * a bind/bound read cycles exactly once per active surface.
 * @module @deepseek-ai/dsh-client-ui-mcp/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { McpKey } from './locales.ts';
export type { McpActionResult, McpCatalogView, McpManagerRemote, McpSessionView, McpCatalogController, McpSessionController, } from './controller.ts';
export type { McpSettingsSectionInjected, McpSettingsSectionProps } from './McpSettingsSection.tsx';
export type { McpDockInjected, McpDockProps } from './McpDock.tsx';
export type { McpKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The MCP settings page + input dock copy. */
        mcp: McpKey;
    }
}
/** Required services: the slot registry, the Remote namespace, and the copy. */
export declare const inject: string[];
/**
 * Client plugin body: the MCP catalog section and the per-session dock.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
/** Re-export data contracts the fixture graph types against. */
export type { McpActionResult as McpAction } from './controller.ts';
//# sourceMappingURL=index.d.ts.map