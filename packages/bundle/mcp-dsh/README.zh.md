# `@deepseek-ai/dsh-mcp`

[English](README.md) | 中文

dsh MCP 捆绑包。[`cordis.patch.yml`](cordis.patch.yml) 在插件树中插入托管 MCP 服务器目录（`mcp-manager`）及其浏览器侧配套插件（`dsh-client-ui-mcp`）。Web profile 会显示**设置 → MCP 服务**和会话级 MCP 工具坞；headless profile 仍保留管理 API 而不渲染浏览器界面。

web-app 捆绑包已直接挂载 `mcp-manager`；本层适用于需要 MCP 服务器管理但不包含完整浏览器界面的 headless 和自定义 profile。

## 部署并运行

该包发布 `dsh-mcp` 可执行程序。它默认从 `PATH` 查找 `dsh`，也可通过 `DSH_BIN` 指定来源码构建的 `node_modules/.bin/dsh`。`deploy` 按依赖顺序将本地浏览器 UI、`mcp-client`、`mcp-manager` 和 bundle 包安装到 profile；`run` 启动该 profile。两个命令默认使用内置的 `headless` profile，`--profile` 可选择其他 profile。

```sh
DSH_BIN=/绝对路径/deepseek-harness/node_modules/.bin/dsh \
  node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs deploy --profile headless
node packages/bundle/mcp-dsh/bin/dsh-mcp.mjs run --profile headless "List the configured MCP servers."
```

`deploy` 可重复执行。部署到 `web` profile 可显示 MCP 服务器目录和绑定工具坞；部署到 `headless` 则用于 API 或 YAML 驱动的使用方式。通过 Web 设置 UI、Typert Remote API 或 `settings.yaml` 配置 server；启动器不会保存凭据或 server 定义。

## 模型体验

间接影响，通过插入的配置行：本捆绑包插入 mcp-manager，管理器的 mcp-client 桥接拥有面向模型的工具注册。

#### KV 缓存影响

无；本捆绑包不向请求前缀贡献任何内容。

## 已知限制与延期工作

- **无浏览器界面** — 管理 UI（设置区段、输入停靠栏）位于 `dsh-client-ui-mcp`，仅在 web-app profile 中组合。Headless 消费者通过 Typert Remote API 或直接编辑 `settings.yaml` 管理目录。
