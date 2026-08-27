# `@deepseek-ai/dsh-mcp`

English | [中文](README.zh.md)

The dsh MCP bundle. [`cordis.patch.yml`](cordis.patch.yml) inserts the managed MCP server catalog (`mcp-manager`) and its browser companion (`dsh-client-ui-mcp`) into the plugin tree. A Web profile then shows **Settings → MCP 服务** and the per-session MCP tool dock; headless profiles retain the management API without rendering browser UI.

The web-app bundle already mounts `mcp-manager` directly; this layer is for headless and custom profiles that need MCP server management without the full browser surface.

## Deploy and run

The package publishes a `dsh-mcp` executable for a Harness installation whose `dsh` command is on `PATH`. `deploy` installs the local browser UI, `mcp-client`, `mcp-manager`, and bundle packages into a profile in dependency order; `run` starts that profile. Both commands default to the shipped `headless` profile, and `--profile` selects another profile. Installing the local dependency packages is required because these development-preview package names are not yet available from npm.

```sh
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List the configured MCP servers."
```

`deploy` is idempotent. Deploy it to the `web` profile to expose the MCP server catalog and bind dock; deploy it to `headless` for API or YAML-driven operation. Configure servers through the Web settings UI, the Typert Remote API, or `settings.yaml`; the launcher does not store credentials or server definitions.

## Model Experience

Indirectly, through the inserted rows: this bundle inserts mcp-manager, and the manager's mcp-client bridges own the model-visible tool registrations.

#### KV Cache effect

None; the bundle contributes nothing to the request prefix.

## Known Limitations and Deferred Work

- **No browser surface** — the management UI (settings section, input dock) lives in `dsh-client-ui-mcp`, which is only composed in the web-app profile. Headless consumers manage the catalog through the Typert Remote API or `settings.yaml` directly.
