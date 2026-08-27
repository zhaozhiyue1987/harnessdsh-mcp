/** `mcp` namespace dictionaries. */
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    nav: string;
    'section.description': string;
    'section.empty': string;
    'form.name': string;
    'form.name.placeholder': string;
    'form.transport': string;
    'form.transport.stdio': string;
    'form.transport.http': string;
    'form.transport.sse': string;
    'form.url': string;
    'form.url.placeholder': string;
    'form.command': string;
    'form.command.placeholder': string;
    'form.args': string;
    'form.add': string;
    'action.remove': string;
    'action.bind': string;
    'action.bound': string;
    'action.unbind': string;
    'action.detail': string;
    'action.refreshTools': string;
    'action.fetching': string;
    'detail.tools': string;
    'detail.toolsEmpty': string;
    'dock.empty': string;
    'dock.label': string;
    'error.load': string;
    'error.action': string;
};
/** The mcp namespace key union. */
export type McpKey = keyof typeof zh;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The MCP settings page + input dock copy. */
        mcp: McpKey;
    }
}
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    nav: string;
    'section.description': string;
    'section.empty': string;
    'form.name': string;
    'form.name.placeholder': string;
    'form.transport': string;
    'form.transport.stdio': string;
    'form.transport.http': string;
    'form.transport.sse': string;
    'form.url': string;
    'form.url.placeholder': string;
    'form.command': string;
    'form.command.placeholder': string;
    'form.args': string;
    'form.add': string;
    'action.remove': string;
    'action.bind': string;
    'action.bound': string;
    'action.unbind': string;
    'action.detail': string;
    'action.refreshTools': string;
    'action.fetching': string;
    'detail.tools': string;
    'detail.toolsEmpty': string;
    'dock.empty': string;
    'dock.label': string;
    'error.load': string;
    'error.action': string;
};
//# sourceMappingURL=locales.d.ts.map