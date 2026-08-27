/** Input dock entry: the current session's MCP binding chips. Bound servers
 * show their names plus a tool count and an unbind affordance; unbound
 * catalog servers show a bind affordance, inviting tools into this session.
 * Renders nothing when there is nothing to show.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/McpDock
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { McpSessionController } from './controller.ts';
/** Object layer injected by the session-scoped conversation.input.dock entry. */
export interface McpDockInjected {
    controller: McpSessionController;
}
/** Full dock props: input-region owner kit + this plugin's inject face + copy. */
export type McpDockProps = PropsRuntime<'conversation.input.dock'> & McpDockInjected & PropsLocale<'mcp'>;
/** Strip of per-session binding chips and bind affordances. */
export declare function McpDock({ controller, t }: McpDockProps): import("react").JSX.Element | null;
//# sourceMappingURL=McpDock.d.ts.map