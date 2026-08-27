/**
 * Client-safe data contracts shared by the mcp-manager Remote service and the
 * ui-mcp client bundle. Values cross the Typert wire as JSON, so every field
 * is plain and serializable; the host normalizes a {@link McpServerSpec} into
 * a resolved mcp-client plugin config at bind time.
 *
 * @module
 */
/**
 * Build the success carrier for a typed value.
 * @param value - The typed value carried by the result.
 * @returns The success carrier with the given value.
 */
export function ok(value) {
    return { ok: true, value };
}
/**
 * Build a failure carrier with an explicit code and human message.
 * @param code - The business failure code carried to Remote callers.
 * @param message - Human-readable reason for the failure.
 * @returns The failure carrier.
 */
export function rejected(code, message) {
    return { ok: false, code, message };
}
//# sourceMappingURL=types.js.map