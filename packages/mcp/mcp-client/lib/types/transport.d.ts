/**
 * Transport factory: creates the appropriate MCP transport based on the
 * plugin's resolved config. Stdio spawns a child process (with credential
 * scrubbing); Streamable HTTP connects to a URL; SSE connects to a legacy
 * HTTP+SSE endpoint.
 *
 * HTTP-based transports (Streamable HTTP, SSE) receive a `fetch` wrapper that
 * reads the active W3C Trace Context from `@deepseek-ai/dsh-llm`'s
 * `AsyncLocalStorage` and injects `traceparent` + `X-Agent-*` headers. When
 * no trace context is active (e.g. standalone MCP use outside the agent loop)
 * no trace headers are added.
 *
 * @module
 */
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { TraceTelemetry } from '@deepseek-ai/dsh-telemetry';
import type { Config } from './index.ts';
/**
 * Wrap `globalThis.fetch` to inject W3C Trace Context headers from the active
 * `AsyncLocalStorage` trace context. When no trace context is active, the
 * request passes through unchanged.
 *
 * The gateway expects `traceparent` on incoming HTTP requests so it can link
 * MCP tool calls into the same trace as the originating LLM call. The
 * `X-Agent-*` business-correlation headers are also injected when present.
 *
 * A telemetry-enabled request opens an `mcp.client` span for every actual HTTP
 * attempt. Header construction failures reject that attempt: retrying without
 * the active context would create a gateway-owned fragment trace.
 * @param telemetry - optional local tracing provider.
 * @param input - request URL or input accepted by Fetch.
 * @param init - optional Fetch initialization.
 * @returns the gateway response.
 */
export declare function traceAwareFetch(telemetry: TraceTelemetry | undefined, input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
/**
 * Create an MCP transport from the resolved plugin config.
 *
 * @param config - Resolved plugin config discriminated on `transport`.
 * @param telemetry - optional local tracing provider.
 * @returns A connected-ready MCP Transport (stdio, Streamable HTTP, or SSE).
 */
export declare function createTransport(config: Config, telemetry?: TraceTelemetry): Transport;
//# sourceMappingURL=transport.d.ts.map