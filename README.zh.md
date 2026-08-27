# Harness DSH MCP

本仓库发布面向原生 Harness `dsh` 环境的独立 MCP 部署包和源码发行版。仓库携带 `mcp-manager`、`mcp-client` 及 Schemastery 的直接源码/构建产物依赖；agent、session、settings、timeout、Typert、Cordis 和 subprocess 服务仍由宿主 Harness profile 提供。

## 快速部署

```sh
git clone https://github.com/zhaozhiyue1987/harnessdsh-mcp.git
cd harnessdsh-mcp
pnpm install
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List MCP servers."
```

`deploy` 使用仓库内的 bundle 路径，因此不依赖尚未发布的 npm 包。请通过 Web 设置 UI、Typert Remote API 或 `settings.yaml` 配置 MCP server；启动器不保存凭据。不要将此 bundle 部署到 `web` profile，因为 web-app 会直接挂载 `mcp-manager`。

## 目录

- `packages/bundle/mcp-dsh`：profile patch、`dsh-mcp` 启动器及构建产物。
- `packages/mcp/mcp-manager`：MCP server catalog、session bind/unbind 和 tool inventory。
- `packages/mcp/mcp-client`：MCP server 到 Harness tools 的桥接。
- `vendor/schemastery`：本地包使用的 schema 依赖。

源码基线：`deepseek-harness` commit `87cc812`。完整依赖关系与原生 Harness 组合方式见各包 README。
