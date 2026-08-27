import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Input dock entry: the current session's MCP binding chips. Bound servers
 * show their names plus a tool count and an unbind affordance; unbound
 * catalog servers show a bind affordance, inviting tools into this session.
 * Renders nothing when there is nothing to show.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/McpDock
 */
import { useEffect, useState } from 'react';
import { useSnapshot } from "./use-snapshot.js";
import css from './McpDock.module.css';
/** Strip of per-session binding chips and bind affordances. */
export function McpDock({ controller, t }) {
    const view = useSnapshot(controller);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);
    useEffect(() => { controller.load(); }, [controller]);
    const run = async (serverName, action) => {
        setBusy(serverName);
        const result = await action(serverName);
        setBusy(null);
        setError(result.ok ? null : `${t('error.action')}: ${result.message}`);
    };
    const boundNames = new Set(view.servers.map(server => server.serverName));
    const unbound = view.catalog.filter(server => !boundNames.has(server.serverName));
    if (view.servers.length === 0 && unbound.length === 0)
        return null;
    const expandedServer = view.servers.find(server => server.serverName === expanded) ?? null;
    // The bound view carries the live tool inventory; the catalog spec adds the
    // transport endpoint detail for the expanded panel.
    const expandedSpec = expandedServer === null
        ? null
        : view.catalog.find(server => server.serverName === expandedServer.serverName) ?? null;
    const expandedMeta = expandedSpec === null
        ? ''
        : expandedSpec.transport === 'stdio'
            ? `stdio · ${expandedSpec.command}`
            : `${expandedSpec.transport} · ${expandedSpec.url ?? ''}`;
    return (_jsxs("div", { className: css.dock, "aria-label": t('dock.label'), children: [view.status === 'error' ? _jsx("span", { className: css.error, children: `${t('error.load')}: ${view.error}` }) : null, error !== null ? _jsx("span", { className: css.error, children: error }) : null, view.servers.map(server => (_jsxs("span", { className: css.chip, children: [_jsxs("button", { type: "button", className: css.chipInfo, "aria-expanded": expanded === server.serverName, "aria-controls": `mcp-dock-detail-${server.serverName}`, title: t('action.detail'), onClick: () => { setExpanded(expanded === server.serverName ? null : server.serverName); }, children: [_jsx("span", { className: css.chipName, children: server.serverName }), _jsx("span", { className: css.chipCount, children: server.tools.length })] }), _jsx("button", { type: "button", className: css.chipAction, disabled: busy !== null, onClick: () => void run(server.serverName, name => controller.unbind(name)), children: t('action.unbind') })] }, server.serverName))), unbound.map(server => (_jsx("button", { type: "button", className: css.bind, disabled: busy !== null, onClick: () => void run(server.serverName, name => controller.bind(name)), children: `+ ${t('action.bind')} ${server.serverName}` }, server.serverName))), expandedServer !== null ? (_jsxs("div", { className: css.detail, id: `mcp-dock-detail-${expandedServer.serverName}`, children: [_jsx("div", { className: css.detailMeta, children: expandedMeta }), _jsx("div", { className: css.detailToolsTitle, children: `${t('detail.tools')} (${expandedServer.tools.length})` }), expandedServer.tools.length === 0
                        ? _jsx("p", { className: css.toolsEmpty, children: t('detail.toolsEmpty') })
                        : (_jsx("ul", { className: css.toolList, children: expandedServer.tools.map(tool => (_jsxs("li", { className: css.tool, children: [_jsx("code", { className: css.toolName, children: tool.rawName }), _jsx("span", { className: css.toolDesc, children: tool.description })] }, tool.publicName))) }))] })) : null] }));
}
//# sourceMappingURL=McpDock.js.map