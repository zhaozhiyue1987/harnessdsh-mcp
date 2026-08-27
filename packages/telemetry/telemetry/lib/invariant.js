//#region lib/types/invariant.js
/** Invariant companion for the TraceTelemetry Service Definition. @module @deepseek-ai/dsh-telemetry/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-telemetry";
/** Cordis companion plugin name. */
const name = "telemetry-invariant";
/** Service required before the companion can register. */
const inject = ["invariants"];
/** The Service Definition holds no durable session state to validate. */
const install = () => {};
/** Register the package ownership companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
