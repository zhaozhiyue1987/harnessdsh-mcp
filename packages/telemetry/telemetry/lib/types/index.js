/**
 * TraceTelemetry Service Definition (`ctx.traceTelemetry`): optional providers
 * create local spans and expose the active W3C context to Harness consumers.
 * @module @deepseek-ai/dsh-telemetry
 */
import { Service } from '@deepseek-ai/cordis';
/**
 * Optional local tracing provider. Consumers obtain this service with
 * `ctx.get('traceTelemetry')`, because a normal Harness deployment may not
 * load any telemetry backend.
 */
export class TraceTelemetry extends Service {
    constructor(ctx) {
        super(ctx, 'traceTelemetry');
    }
}
export default TraceTelemetry;
//# sourceMappingURL=index.js.map