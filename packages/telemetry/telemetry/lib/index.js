import { Service } from "@deepseek-ai/cordis";
//#region lib/types/index.js
/**
* TraceTelemetry Service Definition (`ctx.traceTelemetry`): optional providers
* create local spans and expose the active W3C context to Harness consumers.
* @module @deepseek-ai/dsh-telemetry
*/
/**
* Optional local tracing provider. Consumers obtain this service with
* `ctx.get('traceTelemetry')`, because a normal Harness deployment may not
* load any telemetry backend.
*/
var TraceTelemetry = class extends Service {
	constructor(ctx) {
		super(ctx, "traceTelemetry");
	}
};
//#endregion
export { TraceTelemetry, TraceTelemetry as default };
