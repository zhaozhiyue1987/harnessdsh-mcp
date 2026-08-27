//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-mcp-manager/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-mcp-manager";
/** Cordis companion plugin name. */
const name = "mcp-manager-invariant";
/** Services required before the companion can reserve and check package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the single service owns both faces — the settings
* section serializes the catalog and the private binding map tracks the
* manager-created mcp-client fibers; no second authority pairs against them.
*/
const install = Object.assign(() => {}, { inject: ["mcpManager"] });
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
