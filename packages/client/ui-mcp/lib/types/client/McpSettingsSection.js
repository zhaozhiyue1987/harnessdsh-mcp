import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Settings page: the managed MCP server catalog. Rows carry remove, the
 * footer form adds or replaces by `serverName`. All data flows through the
 * injected {@link McpCatalogController}; the page itself stays shallow.
 * @module @deepseek-ai/dsh-client-ui-mcp/client/McpSettingsSection
 */
import { useEffect, useState } from 'react';
import { useSnapshot } from "./use-snapshot.js";
import css from './McpSettingsSection.module.css';
/** Server catalog page: list, remove, and the add/replace form. */
export function McpSettingsSection({ controller, t }) {
    const view = useSnapshot(controller);
    const [name, setName] = useState('');
    const [transport, setTransport] = useState('streamable-http');
    const [url, setUrl] = useState('');
    const [command, setCommand] = useState('');
    const [args, setArgs] = useState('');
    const [busy, setBusy] = useState(false);
    const [action, setAction] = useState(null);
    const [fetching, setFetching] = useState(null);
    useEffect(() => { controller.load(); }, [controller]);
    const submit = async (event) => {
        event.preventDefault();
        const serverName = name.trim();
        if (busy || serverName === '')
            return;
        setBusy(true);
        // exactOptionalPropertyTypes: the untaken transport's field is omitted and
        // a blank args line keeps the `args` key absent rather than `undefined`.
        const httpLike = transport === 'streamable-http' || transport === 'sse';
        const spec = httpLike
            ? { serverName, transport, url: url.trim() }
            : {
                serverName,
                transport,
                command: command.trim(),
                ...(args.trim() === '' ? {} : { args: args.trim().split(/\s+/) }),
            };
        const result = await controller.upsert(spec);
        setBusy(false);
        if (result.ok) {
            setName('');
            setUrl('');
            setCommand('');
            setArgs('');
            setAction(null);
        }
        else {
            setAction({ message: `${t('error.action')}: ${result.message}`, seq: Date.now() });
        }
    };
    const remove = async (serverName) => {
        const result = await controller.deleteServer(serverName);
        if (result.ok) {
            setAction(null);
        }
        else {
            setAction({ message: `${t('error.action')}: ${result.message}`, seq: Date.now() });
        }
    };
    const refreshTools = async (serverName) => {
        setFetching(serverName);
        const result = await controller.fetchToolCount(serverName);
        setFetching(null);
        if (!result.ok) {
            setAction({ message: `${t('error.action')}: ${result.message}`, seq: Date.now() });
        }
    };
    return (_jsxs("section", { className: css.page, "aria-label": t('nav'), children: [_jsx("p", { className: css.description, children: t('section.description') }), action !== null ? _jsx("p", { className: css.error, children: action.message }, action.seq) : null, view.status === 'error' ? _jsx("p", { className: css.error, children: `${t('error.load')}: ${view.error}` }) : null, view.servers.length === 0
                ? _jsx("p", { className: css.empty, children: t('section.empty') })
                : (_jsx("ul", { className: css.list, children: view.servers.map((server) => {
                        const toolsCount = view.toolCounts.get(server.serverName);
                        return (_jsxs("li", { className: css.row, children: [_jsx("span", { className: css.rowName, children: server.serverName }), _jsxs("span", { className: css.rowMeta, children: [server.transport, server.transport === 'stdio' ? ` · ${server.command}` : ` · ${server.url ?? ''}`, toolsCount !== undefined
                                            ? _jsx("span", { className: css.toolsCount, children: ` · ${toolsCount} ${t('detail.tools')}` })
                                            : null] }), _jsxs("span", { className: css.rowActions, children: [_jsx("button", { type: "button", className: css.secondary, disabled: fetching !== null, onClick: () => void refreshTools(server.serverName), title: t('action.refreshTools'), children: fetching === server.serverName ? t('action.fetching') : t('action.refreshTools') }), _jsx("button", { type: "button", className: css.danger, onClick: () => void remove(server.serverName), children: t('action.remove') })] })] }, server.serverName));
                    }) })), _jsxs("form", { className: css.form, onSubmit: (event) => { void submit(event); }, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('form.name') }), _jsx("input", { className: css.input, value: name, placeholder: t('form.name.placeholder'), onChange: (event) => { setName(event.target.value); }, required: true })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('form.transport') }), _jsxs("select", { className: css.input, value: transport, onChange: (event) => { setTransport(event.target.value); }, children: [_jsx("option", { value: "streamable-http", children: t('form.transport.http') }), _jsx("option", { value: "sse", children: t('form.transport.sse') }), _jsx("option", { value: "stdio", children: t('form.transport.stdio') })] })] }), transport !== 'stdio'
                        ? (_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('form.url') }), _jsx("input", { className: css.input, value: url, placeholder: t('form.url.placeholder'), onChange: (event) => { setUrl(event.target.value); } })] }))
                        : (_jsxs(_Fragment, { children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('form.command') }), _jsx("input", { className: css.input, value: command, placeholder: t('form.command.placeholder'), onChange: (event) => { setCommand(event.target.value); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.label, children: t('form.args') }), _jsx("input", { className: css.input, value: args, onChange: (event) => { setArgs(event.target.value); } })] })] })), _jsx("button", { type: "submit", className: css.primary, disabled: busy || name.trim() === '', children: t('form.add') })] })] }));
}
//# sourceMappingURL=McpSettingsSection.js.map