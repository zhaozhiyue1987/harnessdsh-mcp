//#region lib/types/invariant.js
/** Invariant companion for the OpenTelemetry trace provider. @module @deepseek-ai/dsh-telemetry-otel/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-telemetry-otel";
/** Cordis companion plugin name. */
const name = "telemetry-otel-invariant";
/** Service required before the companion can register. */
const inject = ["invariants"];
/**
* The provider owns only transient async-local state and an external exporter;
* neither has a durable relationship an invariant companion can inspect.
*/
const install = () => {};
/** Register the package ownership companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
