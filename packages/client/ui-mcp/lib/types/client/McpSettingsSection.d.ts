/** Settings page: the managed MCP server catalog. Rows carry remove, the
 * footer form adds or replaces by `serverName`. All data flows through the
 * injected {@link McpCatalogController}; the page itself stays shallow.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/McpSettingsSection
 */
import type { McpCatalogController } from './controller.ts';
import type { McpKey } from './locales.ts';
/** Object layer + copy injected by the settings.section registration. */
export interface McpSettingsSectionInjected {
    controller: McpCatalogController;
    t: (key: McpKey) => string;
}
/** Full page props: exactly the inject face (sections carry no owner kit). */
export type McpSettingsSectionProps = McpSettingsSectionInjected;
/** Server catalog page: list, remove, and the add/replace form. */
export declare function McpSettingsSection({ controller, t }: McpSettingsSectionProps): import("react").JSX.Element;
//# sourceMappingURL=McpSettingsSection.d.ts.map