# Harness DSH MCP

This repository publishes the independent MCP deployment bundle and source distribution for an environment with a native Harness `dsh` command. It carries the direct `mcp-manager`, `mcp-client`, and Schemastery source/build dependencies; agent, session, settings, timeout, Typert, Cordis, and subprocess services remain supplied by the host Harness profile.

## Quick deployment

```sh
git clone https://github.com/zhaozhiyue1987/harnessdsh-mcp.git
cd harnessdsh-mcp
pnpm install
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List MCP servers."
```

`deploy` uses the bundle path inside this repository, so it does not depend on an unpublished npm package. Configure MCP servers through the Web settings UI, Typert Remote API, or `settings.yaml`; the launcher stores no credentials. Do not deploy this bundle to the `web` profile, where web-app mounts `mcp-manager` directly.

## Contents

- `packages/bundle/mcp-dsh`: profile patch, `dsh-mcp` launcher, and built artifacts.
- `packages/mcp/mcp-manager`: MCP server catalog, session bind/unbind, and tool inventory.
- `packages/mcp/mcp-client`: bridge from MCP servers to Harness tools.
- `vendor/schemastery`: schema dependency used by the local packages.

Source baseline: `deepseek-harness` commit `87cc812`. See the package READMEs for the complete dependency graph and native Harness composition details.
