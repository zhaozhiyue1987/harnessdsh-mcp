import z from "@deepseek-ai/schemastery";
import { ROOT_CONTEXT, SpanStatusCode, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { TraceTelemetry } from "@deepseek-ai/dsh-telemetry";
//#region lib/types/index.js
/**
* OTLP/HTTP protobuf implementation of the local TraceTelemetry seam.
* @module @deepseek-ai/dsh-telemetry-otel
*/
/** Default Harness identity for gateway business-correlation headers. */
const DEFAULT_AGENT_PLATFORM = "harness";
/** Default local service name reported to OTLP. */
const DEFAULT_SERVICE_NAME = "harness";
/** Default grace period for flushing spans during plugin disposal. */
const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 3e3;
/** Loader schema; detailed URL and SDK options validate during construction. */
const Config = z.object({
	endpoint: z.string().required(),
	agentApplicationId: z.string().min(1).required(),
	agentPlatform: z.string().min(1).default(DEFAULT_AGENT_PLATFORM),
	serviceName: z.string().min(1).default(DEFAULT_SERVICE_NAME),
	exporter: z.any(),
	processor: z.any(),
	shutdownTimeoutMillis: z.number().min(1).default(DEFAULT_SHUTDOWN_TIMEOUT_MILLIS)
});
/**
* Resolve the OTLP traces endpoint from the deployment's collector base URL.
* @param endpoint - collector base URL or an explicit `/v1/traces` URL.
* @returns absolute OTLP/HTTP protobuf Trace endpoint.
*/
function resolveTracesEndpoint(endpoint) {
	let parsed;
	try {
		parsed = new URL(endpoint);
	} catch {
		throw new Error(`telemetry-otel: endpoint is not a valid URL: ${JSON.stringify(endpoint)}`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`telemetry-otel: endpoint must be http(s), got ${parsed.protocol}`);
	if (!parsed.pathname.endsWith("/v1/traces")) parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/v1/traces`;
	return parsed.toString();
}
/** Convert an active OTel span into the W3C fields Harness injects downstream. */
function activeSpan(span) {
	if (span === void 0) return void 0;
	const context = span.spanContext();
	if (!trace.isSpanContextValid(context)) return void 0;
	return {
		traceId: context.traceId,
		spanId: context.spanId,
		traceparent: `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, "0")}`
	};
}
/** Render an Error-like rejection without assuming it is an Error instance. */
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
/**
* Local OpenTelemetry provider. It owns a private async context manager rather
* than replacing the process-global OTel provider, so other plugins can export
* independently in the same host process.
*/
var OpenTelemetryTraceTelemetry = class extends TraceTelemetry {
	static Config = Config;
	contextManager = new AsyncLocalStorageContextManager().enable();
	provider;
	tracer;
	agentPlatform;
	agentApplicationId;
	constructor(ctx, config) {
		super(ctx);
		const url = resolveTracesEndpoint(config.endpoint);
		this.agentPlatform = config.agentPlatform ?? "harness";
		this.agentApplicationId = config.agentApplicationId;
		this.provider = new TracerProvider({
			resource: resourceFromAttributes({ "service.name": config.serviceName ?? "harness" }),
			spanProcessors: [new BatchSpanProcessor({
				...config.processor,
				exporter: new OTLPTraceExporter({
					...config.exporter,
					url
				})
			})]
		});
		this.tracer = this.provider.getTracer("@deepseek-ai/dsh-telemetry-otel");
		ctx.effect(() => async () => {
			this.contextManager.disable();
			await this.provider.shutdown();
		}, "telemetry-otel.shutdown()");
	}
	active() {
		return activeSpan(trace.getSpan(this.contextManager.active()));
	}
	identity() {
		return {
			agentPlatform: this.agentPlatform,
			agentApplicationId: this.agentApplicationId
		};
	}
	outbound(agentRunId) {
		const active = this.active();
		return active === void 0 ? void 0 : {
			...active,
			agentRunId,
			agentPlatform: this.agentPlatform,
			agentApplicationId: this.agentApplicationId
		};
	}
	async withinSpan(options, operation) {
		const parent = options.root === true ? ROOT_CONTEXT : this.contextManager.active();
		const span = this.tracer.startSpan(options.name, { ...options.attributes === void 0 ? {} : { attributes: options.attributes } }, parent);
		const active = trace.setSpan(parent, span);
		return this.contextManager.with(active, async () => {
			try {
				return await operation();
			} catch (error) {
				span.recordException(error instanceof Error ? error : new Error(errorMessage(error)));
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: errorMessage(error)
				});
				throw error;
			} finally {
				span.end();
			}
		});
	}
};
//#endregion
export { Config, DEFAULT_AGENT_PLATFORM, DEFAULT_SERVICE_NAME, DEFAULT_SHUTDOWN_TIMEOUT_MILLIS, OpenTelemetryTraceTelemetry, OpenTelemetryTraceTelemetry as default, resolveTracesEndpoint };
