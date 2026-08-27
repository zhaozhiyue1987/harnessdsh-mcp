/** Invariant companion for the OpenTelemetry trace provider. @module @deepseek-ai/dsh-telemetry-otel/invariant */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis companion plugin name. */
export declare const name = "telemetry-otel-invariant";
/** Service required before the companion can register. */
export declare const inject: string[];
/** Register the package ownership companion. */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map