# `@deepseek-ai/dsh-mcp`

English | [中文](README.zh.md)

The dsh MCP bundle. [`cordis.patch.yml`](cordis.patch.yml) inserts the managed MCP server catalog (`mcp-manager`) and its browser companion (`dsh-client-ui-mcp`) into the plugin tree. A Web profile then shows **Settings → MCP 服务** and the per-session MCP tool dock; headless profiles retain the management API without rendering browser UI.

The web-app bundle already mounts `mcp-manager` directly; this layer is for headless and custom profiles that need MCP server management without the full browser surface.

## Deploy and run

The package publishes a `dsh-mcp` executable for a Harness installation. It resolves `dsh` from `PATH`, or from the executable named by `DSH_BIN`; source checkouts should set `DSH_BIN` to their built `node_modules/.bin/dsh`. `deploy` installs the local browser UI, `mcp-client`, `mcp-manager`, and bundle packages into a profile in dependency order; `run` starts that profile. Both commands default to the shipped `headless` profile, and `--profile` selects another profile.

```sh
DSH_BIN=/absolute/path/to/deepseek-harness/node_modules/.bin/dsh \
  node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List the configured MCP servers."
```

`deploy` is idempotent. Deploy it to the `web` profile to expose the MCP server catalog and bind dock; deploy it to `headless` for API or YAML-driven operation. Configure servers through the Web settings UI, the Typert Remote API, or `settings.yaml`; the launcher does not store credentials or server definitions.

## Persistent MCP configuration

The installed bundle belongs to a profile, but the managed server catalog is ordinary user settings. Put server definitions in:

```text
$DSH_HOME/settings.yaml
```

Do not put `mcp-manager` server definitions in `$DSH_HOME/profiles/<profile>/cordis.patch.yml`; that file changes plugin composition, while `settings.yaml` stores the catalog. Keep existing top-level settings and add or replace only the `mcp-manager` section:

```yaml
mcp-manager:
  servers:
    - serverName: filesystem
      transport: stdio
      command: npx
      args:
        - --yes
        - '@modelcontextprotocol/server-filesystem'
        - /absolute/path/to/shared-workspace
      cwd: /absolute/path/to/shared-workspace

    - serverName: company-api
      transport: streamable-http
      url: https://mcp.example.com/mcp
      toolCallTimeoutMs: 60000
      reconnect:
        enabled: true
        initialDelayMs: 1000
        maxDelayMs: 30000
        maxAttempts: 5
```

`serverName` is the stable catalog identity and must match `[A-Za-z0-9_-]{1,32}`. After binding, a server tool named `search` is visible to the model as `mcp__company-api__search`. Use `streamable-http` for modern HTTP MCP endpoints; use `sse` only for a legacy SSE MCP endpoint. `url` is required for HTTP/SSE, while `command` is required for `stdio`.

Settings values are literal YAML values: `${TOKEN}`, `$TOKEN`, and `!!js` in `settings.yaml` are not an environment-variable mechanism. Do not put API keys or bearer tokens into this file. For stdio servers, start a local wrapper command that reads its secret from its own environment. For HTTP servers requiring authentication, put a credential-injecting reverse proxy in front of the MCP endpoint, then configure its local URL without a secret. `headers` may be used only for non-secret static headers:

```yaml
    - serverName: legacy-events
      transport: sse
      url: https://legacy.example.com/sse
      headers:
        X-Client-Name: harness
```

### Web and headless activation

Deploy to `web` when an operator needs the graphical workflow. Restart `dsh web`, open **Settings → MCP 服务**, add or edit the catalog entry, then use **绑定** in the active conversation's MCP tool dock. The server is stored persistently, but binding is intentionally per session.

For `headless`, the YAML above stores the catalog but does not auto-bind a server to every model session. A Typert Remote client must call `mcpManager.bind` for the target session before the model can use its tools. This prevents a configured server from silently changing every session's tool set.

Verify the plugin composition and saved catalog separately:

```sh
DSH_BIN=/absolute/path/to/deepseek-harness/node_modules/.bin/dsh
"$DSH_BIN" --profile headless --dump-config
sed -n '/^mcp-manager:/,/^[^ ]/p' "$DSH_HOME/settings.yaml"
```

The first command must show both `mcp-manager` and `ui-mcp` once. After a session bind succeeds, the MCP dock reports the live tool list, and model-visible tool names use the `mcp__<serverName>__<toolName>` form.

## Model Experience

Indirectly, through the inserted rows: this bundle inserts mcp-manager, and the manager's mcp-client bridges own the model-visible tool registrations.

#### KV Cache effect

None; the bundle contributes nothing to the request prefix.

## Known Limitations and Deferred Work

- **Headless has no browser surface** — the management UI lives in `dsh-client-ui-mcp`, but only a profile with the Web browser roster renders its settings section and input dock. Headless consumers manage the catalog through the Typert Remote API or `settings.yaml` directly.
