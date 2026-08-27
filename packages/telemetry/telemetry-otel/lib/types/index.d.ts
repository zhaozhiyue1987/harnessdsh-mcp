/**
 * OTLP/HTTP protobuf implementation of the local TraceTelemetry seam.
 * @module @deepseek-ai/dsh-telemetry-otel
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { type BatchSpanProcessorOptions } from '@opentelemetry/sdk-trace';
import { TraceTelemetry, type ActiveTraceSpan, type TraceAgentIdentity, type OutboundTraceContext, type TraceSpanOptions } from '@deepseek-ai/dsh-telemetry';
/** Default Harness identity for gateway business-correlation headers. */
export declare const DEFAULT_AGENT_PLATFORM = "harness";
/** Default local service name reported to OTLP. */
export declare const DEFAULT_SERVICE_NAME = "harness";
/** Default grace period for flushing spans during plugin disposal. */
export declare const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 3000;
/** OpenTelemetry trace exporter and Harness identity configuration. */
export interface Config {
    /** OTLP/HTTP collector base URL, normally `http://<gateway-host>:4318`. */
    endpoint: string;
    /** Required deployment identity written as `X-Agent-Application-Id`. */
    agentApplicationId: string;
    /** Platform identity written as `X-Agent-Platform`. */
    agentPlatform?: string;
    /** OpenTelemetry resource `service.name`. */
    serviceName?: string;
    /** Extra OTLP exporter options, excluding the resolved traces URL. */
    exporter?: Omit<OTLPExporterNodeConfigBase, 'url'>;
    /** Extra batch processor options, excluding the exporter constructed here. */
    processor?: Omit<BatchSpanProcessorOptions, 'exporter'>;
    /** Upper bound for disposal-time exporter flush. */
    shutdownTimeoutMillis?: number;
}
/** Loader schema; detailed URL and SDK options validate during construction. */
export declare const Config: z<Config>;
/**
 * Resolve the OTLP traces endpoint from the deployment's collector base URL.
 * @param endpoint - collector base URL or an explicit `/v1/traces` URL.
 * @returns absolute OTLP/HTTP protobuf Trace endpoint.
 */
export declare function resolveTracesEndpoint(endpoint: string): string;
/**
 * Local OpenTelemetry provider. It owns a private async context manager rather
 * than replacing the process-global OTel provider, so other plugins can export
 * independently in the same host process.
 */
export declare class OpenTelemetryTraceTelemetry extends TraceTelemetry {
    static Config: z<Config>;
    private readonly contextManager;
    private readonly provider;
    private readonly tracer;
    private readonly agentPlatform;
    private readonly agentApplicationId;
    constructor(ctx: Context, config: Config);
    active(): ActiveTraceSpan | undefined;
    identity(): TraceAgentIdentity;
    outbound<TAgentRunId extends string>(agentRunId: TAgentRunId): OutboundTraceContext<TAgentRunId> | undefined;
    withinSpan<T>(options: TraceSpanOptions, operation: () => Promise<T>): Promise<T>;
}
export default OpenTelemetryTraceTelemetry;
//# sourceMappingURL=index.d.ts.map