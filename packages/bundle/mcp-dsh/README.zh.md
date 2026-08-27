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

## 持久化 MCP 配置

已安装的 bundle 属于某个 profile，但托管服务器目录属于普通用户设置。服务器定义应写在：

```text
$DSH_HOME/settings.yaml
```

不要把 `mcp-manager` 的服务器定义写入 `$DSH_HOME/profiles/<profile>/cordis.patch.yml`；后者只改变插件组合，`settings.yaml` 才保存服务器目录。保留文件中已有的顶级设置，只增加或替换 `mcp-manager` 段：

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

`serverName` 是稳定的目录标识，必须匹配 `[A-Za-z0-9_-]{1,32}`。绑定后，服务器中名为 `search` 的工具会以 `mcp__company-api__search` 的名字暴露给模型。现代 HTTP MCP 端点使用 `streamable-http`；只有旧式 SSE MCP 端点才使用 `sse`。HTTP/SSE 必填 `url`，`stdio` 必填 `command`。

settings 中的值都是字面 YAML：`${TOKEN}`、`$TOKEN` 和 `!!js` 在 `settings.yaml` 中都不是环境变量机制。不要把 API key 或 bearer token 写入该文件。stdio server 应通过从自身环境读取密钥的本地 wrapper 命令启动。需要 HTTP 鉴权的 server 应在 MCP 端点前放置注入凭据的反向代理，再配置不含密钥的本地 URL。`headers` 只可用于非敏感的静态 header：

```yaml
    - serverName: legacy-events
      transport: sse
      url: https://legacy.example.com/sse
      headers:
        X-Client-Name: harness
```

### Web 与 headless 的启用方式

需要图形化管理时部署到 `web`。重启 `dsh web` 后，打开**设置 → MCP 服务**录入或编辑目录条目，再在当前会话的 MCP 工具坞中点击**绑定**。服务器目录会持久化保存，但绑定刻意按会话生效。

对于 `headless`，以上 YAML 只保存目录，不会自动把 server 绑定给每个模型会话。必须由 Typert Remote 客户端针对目标会话调用 `mcpManager.bind`，模型之后才能使用工具。这避免已配置的 server 在无人察觉时改变所有会话的工具集合。

分别验证插件组合与已保存的目录：

```sh
DSH_BIN=/绝对路径/deepseek-harness/node_modules/.bin/dsh
"$DSH_BIN" --profile headless --dump-config
sed -n '/^mcp-manager:/,/^[^ ]/p' "$DSH_HOME/settings.yaml"
```

第一条命令必须各出现一次 `mcp-manager` 和 `ui-mcp`。会话绑定成功后，MCP 工具坞会显示实时工具清单，模型可见工具名称遵循 `mcp__<serverName>__<toolName>`。

## 模型体验

间接影响，通过插入的配置行：本捆绑包插入 mcp-manager，管理器的 mcp-client 桥接拥有面向模型的工具注册。

#### KV 缓存影响

无；本捆绑包不向请求前缀贡献任何内容。

## 已知限制与延期工作

- **headless 没有浏览器界面** — 管理 UI 位于 `dsh-client-ui-mcp`，但只有包含 Web 浏览器 roster 的 profile 才会渲染设置区段和输入工具坞。Headless 消费者通过 Typert Remote API 或直接编辑 `settings.yaml` 管理目录。
