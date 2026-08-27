# `@deepseek-ai/dsh-mcp`

English | [中文](README.zh.md)

The dsh MCP bundle. [`cordis.patch.yml`](cordis.patch.yml) inserts the managed MCP server catalog (`mcp-manager`) into the plugin tree, enabling persistent server configuration and session-scoped bind/unbind over [`dsh-base`](../base/README.md). Apply it as a profile layer: `dsh --profile headless,mcp`.

The web-app bundle already mounts `mcp-manager` directly; this layer is for headless and custom profiles that need MCP server management without the full browser surface.

## Deploy and run

The package publishes a `dsh-mcp` executable for a Harness installation whose `dsh` command is on `PATH`. `deploy` installs this bundle into a profile and makes it a profile layer; `run` starts that profile. Both commands default to the shipped `headless` profile, and `--profile` selects another headless or custom profile.

```sh
npx --yes @deepseek-ai/dsh-mcp deploy --profile headless
npx --yes @deepseek-ai/dsh-mcp run --profile headless "List the configured MCP servers."
```

`deploy` is idempotent. Do not deploy this bundle into the `web` profile: the web-app bundle already owns the `mcp-manager` row. Configure servers through the Web settings UI, the Typert Remote API, or `settings.yaml`; the launcher does not store credentials or server definitions.

## Model Experience

Indirectly, through the inserted rows: this bundle inserts mcp-manager, and the manager's mcp-client bridges own the model-visible tool registrations.

#### KV Cache effect

None; the bundle contributes nothing to the request prefix.

## Known Limitations and Deferred Work

- **No browser surface** — the management UI (settings section, input dock) lives in `dsh-client-ui-mcp`, which is only composed in the web-app profile. Headless consumers manage the catalog through the Typert Remote API or `settings.yaml` directly.
