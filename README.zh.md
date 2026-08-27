# Harness DSH MCP

本仓库发布面向原生 Harness `dsh` 环境的独立 MCP 部署包和源码发行版。仓库携带 `mcp-manager`、`mcp-client` 及 Schemastery 的直接源码/构建产物依赖；agent、session、settings、timeout、Typert、Cordis 和 subprocess 服务仍由宿主 Harness profile 提供。

## 快速部署

```sh
git clone https://github.com/zhaozhiyue1987/harnessdsh-mcp.git
cd harnessdsh-mcp
pnpm install
DSH_BIN=/绝对路径/deepseek-harness/node_modules/.bin/dsh \
  node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List MCP servers."
```

`pnpm install` 用于校验仓库依赖；部署直接使用已提交的构建产物，不需要重新构建。workspace 会让 peer 依赖由宿主 Harness 提供，不会尝试下载未发布的 Harness 包。`deploy` 使用仓库内的 bundle 路径，因此不依赖尚未发布的 npm 包。启动器默认从 `PATH` 查找 `dsh`，也可通过 `DSH_BIN` 指定源码构建出的 CLI。请通过 Web 设置 UI、Typert Remote API 或 `settings.yaml` 配置 MCP server；启动器不保存凭据。使用 `--profile web` 会安装 MCP 管理界面。

`$DSH_HOME/settings.yaml` 的准确目录格式、stdio/HTTP/SSE 示例、会话绑定和密钥处理规则，请参阅[持久化 MCP 配置](packages/bundle/mcp-dsh/README.zh.md#持久化-mcp-配置)。

## 目录

- `packages/bundle/mcp-dsh`：profile patch、`dsh-mcp` 启动器及构建产物。
- `packages/mcp/mcp-manager`：MCP server catalog、session bind/unbind 和 tool inventory。
- `packages/mcp/mcp-client`：MCP server 到 Harness tools 的桥接。
- `vendor/schemastery`：本地包使用的 schema 依赖。

源码基线：`deepseek-harness` commit `87cc812`。完整依赖关系与原生 Harness 组合方式见各包 README。
