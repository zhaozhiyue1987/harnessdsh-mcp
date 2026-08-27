window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-mcp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region lib/types/client/controller.js
		/**
		* Browser-local object layer over the mcp-manager Remote. One observable per
		* surface: the root-scoped catalog controller backs the settings section, and
		* one session controller per Session backs the input dock. Remote calls wrap
		* every business result in {@link RemoteResult}, so failures arrive as the
		* `ok: false` branch rather than a rejection.
		* @module @deepseek-ai/dsh-client-ui-mcp/client/controller
		*/
		/** Base observable: one subscribe/getSnapshot pair plus an action carrier. */
		function describe(code) {
			switch (code) {
				case "unknown-server": return "this server is no longer configured";
				case "already-bound": return "this server is already bound to the session";
				case "not-bound": return "this server is not bound to the session";
				case "bind-failed": return "the server could not start in this session";
				case "invalid-spec": return "the server definition is incomplete or invalid";
				case "settings-unavailable": return "the persistent catalog is unavailable";
				default: return code;
			}
		}
		const COLD_CATALOG = Object.freeze({
			status: "cold",
			error: null,
			servers: [],
			toolCounts: /* @__PURE__ */ new Map()
		});
		const COLD_SESSION = Object.freeze({
			status: "cold",
			error: null,
			servers: [],
			catalog: []
		});
		const OK = Object.freeze({ ok: true });
		/**
		* Message of a failed layer — either the wire `error` carrier or the
		* manager's own `message` carrier; the plain `in` checks narrow each union.
		*/
		function failureText(r) {
			return "error" in r ? r.error.message : "message" in r ? r.message : "";
		}
		/** Root-scoped catalog controller (the settings section). */
		var McpCatalogController = class {
			remote;
			view = COLD_CATALOG;
			listeners = /* @__PURE__ */ new Set();
			tail = Promise.resolve();
			loaded = false;
			constructor(remote) {
				this.remote = remote;
			}
			/**
			* The current catalog view, ready after the first successful load.
			* @returns The latest catalog snapshot.
			*/
			getSnapshot() {
				return this.view;
			}
			/**
			* Runs the listener on every catalog change.
			* @param listener - The subscription callback invoked on each change.
			* @returns A removal function for this subscription.
			*/
			subscribe(listener) {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			}
			publish(next) {
				this.view = next;
				for (const listener of this.listeners) listener();
			}
			/** Load the catalog once; later calls reload it. */
			load() {
				if (this.view.status === "loading") return;
				this.publish({
					status: "loading",
					error: null,
					servers: this.view.servers,
					toolCounts: this.view.toolCounts
				});
				(async () => {
					const result = await this.remote.list();
					if (result.ok && result.value.ok) {
						this.loaded = true;
						this.publish({
							status: "ready",
							error: null,
							servers: result.value.value.servers,
							toolCounts: this.view.toolCounts
						});
					} else this.publish({
						status: "error",
						error: failureText(result),
						servers: this.view.servers,
						toolCounts: this.view.toolCounts
					});
				})();
			}
			/** Re-read only when a previous load already succeeded (transient resets). */
			resync() {
				if (this.loaded) this.load();
			}
			/**
			* Fetch the tool count for one catalog server. Connects to the server,
			* lists its tools, then disconnects. Updates the cached toolCounts map.
			* @param serverName - The catalog name of the server to query.
			* @returns The action outcome.
			*/
			async fetchToolCount(serverName) {
				const result = await this.remote.serverTools({ serverName });
				if (!result.ok) return {
					ok: false,
					code: result.error.code,
					message: result.error.message
				};
				if (!result.value.ok) return {
					ok: false,
					code: result.value.code,
					message: result.value.message
				};
				const counts = new Map(this.view.toolCounts);
				counts.set(serverName, result.value.value.toolsCount);
				this.publish({
					...this.view,
					toolCounts: counts
				});
				return OK;
			}
			/**
			* Add or replace one server; reloads the catalog on success.
			* @param server - The full spec to upsert into the managed catalog.
			* @returns The action outcome.
			*/
			async upsert(server) {
				const result = await this.remote.upsert({ server });
				if (!result.ok) return {
					ok: false,
					code: result.error.code,
					message: result.error.message
				};
				this.tail = this.tail.then(() => this.remote.list()).then((reloaded) => {
					if (reloaded.ok && reloaded.value.ok) this.publish({
						status: "ready",
						error: null,
						servers: reloaded.value.value.servers,
						toolCounts: this.view.toolCounts
					});
				}).catch(() => {});
				await this.tail;
				return OK;
			}
			/**
			* Remove one server; reloads the catalog on success.
			* @param serverName - The catalog name of the server to remove.
			* @returns The action outcome.
			*/
			async deleteServer(serverName) {
				const result = await this.remote.deleteServer({ serverName });
				if (!result.ok) return {
					ok: false,
					code: result.error.code,
					message: result.error.message
				};
				const counts = new Map(this.view.toolCounts);
				counts.delete(serverName);
				this.publish({
					status: "ready",
					error: null,
					servers: this.view.servers.filter((s) => s.serverName !== serverName),
					toolCounts: counts
				});
				return OK;
			}
		};
		/** Session-scoped bindings controller (the input dock). */
		var McpSessionController = class {
			remote;
			sessionId;
			view = COLD_SESSION;
			listeners = /* @__PURE__ */ new Set();
			loaded = false;
			constructor(remote, sessionId) {
				this.remote = remote;
				this.sessionId = sessionId;
			}
			/**
			* The current session-bindings view, ready after the first successful load.
			* @returns The latest bindings snapshot.
			*/
			getSnapshot() {
				return this.view;
			}
			/**
			* Runs the listener on every bindings change.
			* @param listener - The subscription callback invoked on each change.
			* @returns A removal function for this subscription.
			*/
			subscribe(listener) {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			}
			publish(next) {
				this.view = next;
				for (const listener of this.listeners) listener();
			}
			/** Ensure one initial load, then reload on later taps. */
			load() {
				if (this.view.status === "loading") return;
				this.publish({
					status: "loading",
					error: null,
					servers: this.view.servers,
					catalog: this.view.catalog
				});
				(async () => {
					const boundResult = await this.remote.bound(this.sessionId);
					const catalogResult = await this.remote.list();
					if (catalogResult.ok && catalogResult.value.ok && boundResult.ok && boundResult.value.ok) {
						this.loaded = true;
						this.publish({
							status: "ready",
							error: null,
							servers: boundResult.value.value.servers,
							catalog: catalogResult.value.value.servers
						});
					} else {
						const failed = boundResult.ok && !boundResult.value.ok ? boundResult.value : catalogResult;
						this.publish({
							status: "error",
							error: failureText(failed),
							servers: this.view.servers,
							catalog: this.view.catalog
						});
					}
				})();
			}
			/** Re-read only when a previous load already succeeded (transient resets). */
			resync() {
				if (this.loaded) this.load();
			}
			/**
			* Bind one catalog server; reloads bindings on success.
			* @param serverName - The catalog name of the server to bind.
			* @returns The action outcome.
			*/
			async bind(serverName) {
				const result = await this.remote.bind(this.sessionId, { serverName });
				if (!result.ok) return {
					ok: false,
					code: result.error.code,
					message: describe(result.error.code) || result.error.message
				};
				this.load();
				return OK;
			}
			/**
			* Unbind one bound server; reloads bindings on success.
			* @param serverName - The catalog name of the server to unbind.
			* @returns The action outcome.
			*/
			async unbind(serverName) {
				const result = await this.remote.unbind(this.sessionId, { serverName });
				if (!result.ok) return {
					ok: false,
					code: result.error.code,
					message: describe(result.error.code) || result.error.message
				};
				this.load();
				return OK;
			}
		};
		//#endregion
		//#region lib/types/client/use-snapshot.js
		/**
		* Subscribe one component to an observable view via the store API.
		* @param source - The observable view whose snapshot the component renders.
		* @returns The current snapshot, re-rendered on each change.
		*/
		function useSnapshot(source) {
			return (0, react.useSyncExternalStore)((listener) => source.subscribe(listener), () => source.getSnapshot());
		}
		//#endregion
		//#region \0dsh-css:/Users/zhao/项目开发/harness/packages/client/ui-mcp/src/client/McpSettingsSection.module.css.mjs
		const css$1 = ".udP_iG_page{flex-direction:column;gap:12px;padding:0;display:flex}.udP_iG_description{color:var(--dsh-color-text-secondary,#8a8f98);margin:0;font-size:13px;line-height:1.5}.udP_iG_empty{color:var(--dsh-color-text-tertiary,#6b7280);margin:0;font-size:13px}.udP_iG_error{color:var(--dsh-color-danger,#e5484d);margin:0;font-size:13px}.udP_iG_list{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.udP_iG_row{border:1px solid var(--dsh-color-border,#2b2f36);border-radius:8px;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:10px 12px;display:grid}.udP_iG_rowName{font-size:14px;font-weight:600}.udP_iG_rowMeta{color:var(--dsh-color-text-secondary,#8a8f98);white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}.udP_iG_toolsCount{color:var(--dsh-color-accent,#4c8bf5);font-weight:500}.udP_iG_rowActions{flex-shrink:0;align-items:center;gap:4px;display:inline-flex}.udP_iG_secondary{color:var(--dsh-color-text-secondary,#8a8f98);cursor:pointer;background:0 0;border:0;border-radius:6px;padding:4px 6px;font-size:12px}.udP_iG_secondary:hover{color:var(--dsh-color-accent,#4c8bf5)}.udP_iG_secondary:disabled{opacity:.5;cursor:default}.udP_iG_danger{color:var(--dsh-color-danger,#e5484d);cursor:pointer;background:0 0;border:0;border-radius:6px;padding:4px 6px;font-size:12px}.udP_iG_danger:hover{background:color-mix(in srgb, var(--dsh-color-danger,#e5484d) 12%, transparent)}.udP_iG_form{flex-direction:column;gap:10px;padding-top:4px;display:flex}.udP_iG_field{flex-direction:column;gap:4px;display:flex}.udP_iG_label{color:var(--dsh-color-text-secondary,#8a8f98);font-size:12px}.udP_iG_input{border:1px solid var(--dsh-color-border,#2b2f36);background:var(--dsh-color-surface-elevated,#fff);color:var(--dsh-color-text,#1f2124);border-radius:8px;padding:8px 10px;font-size:13px}.udP_iG_input:focus{outline:2px solid var(--dsh-color-accent,#4c8bf5);outline-offset:-1px}.udP_iG_primary{background:var(--dsh-color-accent,#4c8bf5);color:#fff;cursor:pointer;border:0;border-radius:8px;align-self:flex-start;padding:8px 14px;font-size:13px}.udP_iG_primary:disabled{opacity:.5;cursor:default}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-mcp/McpSettingsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-mcp";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var McpSettingsSection_module_css_default = {
			"secondary": "udP_iG_secondary",
			"rowActions": "udP_iG_rowActions",
			"field": "udP_iG_field",
			"input": "udP_iG_input",
			"page": "udP_iG_page",
			"form": "udP_iG_form",
			"label": "udP_iG_label",
			"primary": "udP_iG_primary",
			"rowName": "udP_iG_rowName",
			"row": "udP_iG_row",
			"error": "udP_iG_error",
			"empty": "udP_iG_empty",
			"rowMeta": "udP_iG_rowMeta",
			"list": "udP_iG_list",
			"description": "udP_iG_description",
			"danger": "udP_iG_danger",
			"toolsCount": "udP_iG_toolsCount"
		};
		//#endregion
		//#region lib/types/client/McpSettingsSection.js
		/** Settings page: the managed MCP server catalog. Rows carry remove, the
		* footer form adds or replaces by `serverName`. All data flows through the
		* injected {@link McpCatalogController}; the page itself stays shallow.
		* @module @deepseek-ai/dsh-client-ui-mcp/client/McpSettingsSection
		*/
		/** Server catalog page: list, remove, and the add/replace form. */
		function McpSettingsSection({ controller, t }) {
			const view = useSnapshot(controller);
			const [name, setName] = (0, react.useState)("");
			const [transport, setTransport] = (0, react.useState)("streamable-http");
			const [url, setUrl] = (0, react.useState)("");
			const [command, setCommand] = (0, react.useState)("");
			const [args, setArgs] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [action, setAction] = (0, react.useState)(null);
			const [fetching, setFetching] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				controller.load();
			}, [controller]);
			const submit = async (event) => {
				event.preventDefault();
				const serverName = name.trim();
				if (busy || serverName === "") return;
				setBusy(true);
				const spec = transport === "streamable-http" || transport === "sse" ? {
					serverName,
					transport,
					url: url.trim()
				} : {
					serverName,
					transport,
					command: command.trim(),
					...args.trim() === "" ? {} : { args: args.trim().split(/\s+/) }
				};
				const result = await controller.upsert(spec);
				setBusy(false);
				if (result.ok) {
					setName("");
					setUrl("");
					setCommand("");
					setArgs("");
					setAction(null);
				} else setAction({
					message: `${t("error.action")}: ${result.message}`,
					seq: Date.now()
				});
			};
			const remove = async (serverName) => {
				const result = await controller.deleteServer(serverName);
				if (result.ok) setAction(null);
				else setAction({
					message: `${t("error.action")}: ${result.message}`,
					seq: Date.now()
				});
			};
			const refreshTools = async (serverName) => {
				setFetching(serverName);
				const result = await controller.fetchToolCount(serverName);
				setFetching(null);
				if (!result.ok) setAction({
					message: `${t("error.action")}: ${result.message}`,
					seq: Date.now()
				});
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: McpSettingsSection_module_css_default.page,
				"aria-label": t("nav"),
				children: [
					(0, react_jsx_runtime.jsx)("p", {
						className: McpSettingsSection_module_css_default.description,
						children: t("section.description")
					}),
					action !== null ? (0, react_jsx_runtime.jsx)("p", {
						className: McpSettingsSection_module_css_default.error,
						children: action.message
					}, action.seq) : null,
					view.status === "error" ? (0, react_jsx_runtime.jsx)("p", {
						className: McpSettingsSection_module_css_default.error,
						children: `${t("error.load")}: ${view.error}`
					}) : null,
					view.servers.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: McpSettingsSection_module_css_default.empty,
						children: t("section.empty")
					}) : (0, react_jsx_runtime.jsx)("ul", {
						className: McpSettingsSection_module_css_default.list,
						children: view.servers.map((server) => {
							const toolsCount = view.toolCounts.get(server.serverName);
							return (0, react_jsx_runtime.jsxs)("li", {
								className: McpSettingsSection_module_css_default.row,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: McpSettingsSection_module_css_default.rowName,
										children: server.serverName
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: McpSettingsSection_module_css_default.rowMeta,
										children: [
											server.transport,
											server.transport === "stdio" ? ` · ${server.command}` : ` · ${server.url ?? ""}`,
											toolsCount !== void 0 ? (0, react_jsx_runtime.jsx)("span", {
												className: McpSettingsSection_module_css_default.toolsCount,
												children: ` · ${toolsCount} ${t("detail.tools")}`
											}) : null
										]
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: McpSettingsSection_module_css_default.rowActions,
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: McpSettingsSection_module_css_default.secondary,
											disabled: fetching !== null,
											onClick: () => void refreshTools(server.serverName),
											title: t("action.refreshTools"),
											children: fetching === server.serverName ? t("action.fetching") : t("action.refreshTools")
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: McpSettingsSection_module_css_default.danger,
											onClick: () => void remove(server.serverName),
											children: t("action.remove")
										})]
									})
								]
							}, server.serverName);
						})
					}),
					(0, react_jsx_runtime.jsxs)("form", {
						className: McpSettingsSection_module_css_default.form,
						onSubmit: (event) => {
							submit(event);
						},
						children: [
							(0, react_jsx_runtime.jsxs)("label", {
								className: McpSettingsSection_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: McpSettingsSection_module_css_default.label,
									children: t("form.name")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: McpSettingsSection_module_css_default.input,
									value: name,
									placeholder: t("form.name.placeholder"),
									onChange: (event) => {
										setName(event.target.value);
									},
									required: true
								})]
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: McpSettingsSection_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: McpSettingsSection_module_css_default.label,
									children: t("form.transport")
								}), (0, react_jsx_runtime.jsxs)("select", {
									className: McpSettingsSection_module_css_default.input,
									value: transport,
									onChange: (event) => {
										setTransport(event.target.value);
									},
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "streamable-http",
											children: t("form.transport.http")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "sse",
											children: t("form.transport.sse")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "stdio",
											children: t("form.transport.stdio")
										})
									]
								})]
							}),
							transport !== "stdio" ? (0, react_jsx_runtime.jsxs)("label", {
								className: McpSettingsSection_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: McpSettingsSection_module_css_default.label,
									children: t("form.url")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: McpSettingsSection_module_css_default.input,
									value: url,
									placeholder: t("form.url.placeholder"),
									onChange: (event) => {
										setUrl(event.target.value);
									}
								})]
							}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("label", {
								className: McpSettingsSection_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: McpSettingsSection_module_css_default.label,
									children: t("form.command")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: McpSettingsSection_module_css_default.input,
									value: command,
									placeholder: t("form.command.placeholder"),
									onChange: (event) => {
										setCommand(event.target.value);
									}
								})]
							}), (0, react_jsx_runtime.jsxs)("label", {
								className: McpSettingsSection_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: McpSettingsSection_module_css_default.label,
									children: t("form.args")
								}), (0, react_jsx_runtime.jsx)("input", {
									className: McpSettingsSection_module_css_default.input,
									value: args,
									onChange: (event) => {
										setArgs(event.target.value);
									}
								})]
							})] }),
							(0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								className: McpSettingsSection_module_css_default.primary,
								disabled: busy || name.trim() === "",
								children: t("form.add")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/zhao/项目开发/harness/packages/client/ui-mcp/src/client/McpDock.module.css.mjs
		const css = ".MSL0MG_dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));padding:0 var(--dsh-composer-dock-inset);flex-wrap:wrap;flex:none;align-items:center;gap:6px;margin:0 auto;display:flex}.MSL0MG_error{color:var(--dsh-color-danger,#e5484d);font-size:12px}.MSL0MG_chip{border:1px solid var(--dsh-color-border,#2b2f36);background:var(--dsh-color-surface-elevated,#fff);border-radius:999px;align-items:center;gap:6px;padding:3px 8px;font-size:12px;display:inline-flex}.MSL0MG_chipInfo{color:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;padding:0;font-size:12px;display:inline-flex}.MSL0MG_chipInfo:hover .MSL0MG_chipName{text-decoration:underline}.MSL0MG_chipInfo[aria-expanded=true] .MSL0MG_chipName{color:var(--dsh-color-accent,#4c8bf5)}.MSL0MG_chipName{font-weight:600}.MSL0MG_chipCount{color:var(--dsh-color-text-secondary,#8a8f98)}.MSL0MG_chipAction{color:var(--dsh-color-text-secondary,#8a8f98);cursor:pointer;background:0 0;border:0;padding:0;font-size:12px}.MSL0MG_chipAction:hover{color:var(--dsh-color-danger,#e5484d)}.MSL0MG_bind{border:1px dashed var(--dsh-color-border,#2b2f36);color:var(--dsh-color-accent,#4c8bf5);cursor:pointer;background:0 0;border-radius:999px;padding:3px 8px;font-size:12px}.MSL0MG_bind:hover{border-style:solid}.MSL0MG_chipAction:disabled,.MSL0MG_bind:disabled{opacity:.5;cursor:default}.MSL0MG_detail{border:1px solid var(--dsh-color-border,#2b2f36);background:var(--dsh-color-surface-elevated,#fff);border-radius:10px;flex-direction:column;flex-basis:100%;gap:8px;padding:10px 12px;display:flex}.MSL0MG_detailMeta{color:var(--dsh-color-text-secondary,#8a8f98);overflow-wrap:anywhere;font-size:12px}.MSL0MG_detailToolsTitle{font-size:12px;font-weight:600}.MSL0MG_toolsEmpty{color:var(--dsh-color-text-tertiary,#6b7280);margin:0;font-size:12px}.MSL0MG_toolList{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.MSL0MG_tool{flex-direction:column;gap:2px;display:flex}.MSL0MG_toolName{color:var(--dsh-color-accent,#4c8bf5);overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.MSL0MG_toolDesc{color:var(--dsh-color-text-secondary,#8a8f98);overflow-wrap:anywhere;font-size:12px;line-height:1.5}";
		const tagId = "@deepseek-ai/dsh-client-ui-mcp/McpDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-mcp";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var McpDock_module_css_default = {
			"dock": "MSL0MG_dock",
			"toolName": "MSL0MG_toolName",
			"tool": "MSL0MG_tool",
			"chipCount": "MSL0MG_chipCount",
			"toolsEmpty": "MSL0MG_toolsEmpty",
			"chipAction": "MSL0MG_chipAction",
			"detail": "MSL0MG_detail",
			"chip": "MSL0MG_chip",
			"chipInfo": "MSL0MG_chipInfo",
			"error": "MSL0MG_error",
			"bind": "MSL0MG_bind",
			"toolDesc": "MSL0MG_toolDesc",
			"detailMeta": "MSL0MG_detailMeta",
			"toolList": "MSL0MG_toolList",
			"detailToolsTitle": "MSL0MG_detailToolsTitle",
			"chipName": "MSL0MG_chipName"
		};
		//#endregion
		//#region lib/types/client/McpDock.js
		/** Input dock entry: the current session's MCP binding chips. Bound servers
		* show their names plus a tool count and an unbind affordance; unbound
		* catalog servers show a bind affordance, inviting tools into this session.
		* Renders nothing when there is nothing to show.
		* @module @deepseek-ai/dsh-client-ui-mcp/client/McpDock
		*/
		/** Strip of per-session binding chips and bind affordances. */
		function McpDock({ controller, t }) {
			const view = useSnapshot(controller);
			const [busy, setBusy] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [expanded, setExpanded] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				controller.load();
			}, [controller]);
			const run = async (serverName, action) => {
				setBusy(serverName);
				const result = await action(serverName);
				setBusy(null);
				setError(result.ok ? null : `${t("error.action")}: ${result.message}`);
			};
			const boundNames = new Set(view.servers.map((server) => server.serverName));
			const unbound = view.catalog.filter((server) => !boundNames.has(server.serverName));
			if (view.servers.length === 0 && unbound.length === 0) return null;
			const expandedServer = view.servers.find((server) => server.serverName === expanded) ?? null;
			const expandedSpec = expandedServer === null ? null : view.catalog.find((server) => server.serverName === expandedServer.serverName) ?? null;
			const expandedMeta = expandedSpec === null ? "" : expandedSpec.transport === "stdio" ? `stdio · ${expandedSpec.command}` : `${expandedSpec.transport} · ${expandedSpec.url ?? ""}`;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: McpDock_module_css_default.dock,
				"aria-label": t("dock.label"),
				children: [
					view.status === "error" ? (0, react_jsx_runtime.jsx)("span", {
						className: McpDock_module_css_default.error,
						children: `${t("error.load")}: ${view.error}`
					}) : null,
					error !== null ? (0, react_jsx_runtime.jsx)("span", {
						className: McpDock_module_css_default.error,
						children: error
					}) : null,
					view.servers.map((server) => (0, react_jsx_runtime.jsxs)("span", {
						className: McpDock_module_css_default.chip,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: McpDock_module_css_default.chipInfo,
							"aria-expanded": expanded === server.serverName,
							"aria-controls": `mcp-dock-detail-${server.serverName}`,
							title: t("action.detail"),
							onClick: () => {
								setExpanded(expanded === server.serverName ? null : server.serverName);
							},
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: McpDock_module_css_default.chipName,
								children: server.serverName
							}), (0, react_jsx_runtime.jsx)("span", {
								className: McpDock_module_css_default.chipCount,
								children: server.tools.length
							})]
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: McpDock_module_css_default.chipAction,
							disabled: busy !== null,
							onClick: () => void run(server.serverName, (name) => controller.unbind(name)),
							children: t("action.unbind")
						})]
					}, server.serverName)),
					unbound.map((server) => (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: McpDock_module_css_default.bind,
						disabled: busy !== null,
						onClick: () => void run(server.serverName, (name) => controller.bind(name)),
						children: `+ ${t("action.bind")} ${server.serverName}`
					}, server.serverName)),
					expandedServer !== null ? (0, react_jsx_runtime.jsxs)("div", {
						className: McpDock_module_css_default.detail,
						id: `mcp-dock-detail-${expandedServer.serverName}`,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: McpDock_module_css_default.detailMeta,
								children: expandedMeta
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: McpDock_module_css_default.detailToolsTitle,
								children: `${t("detail.tools")} (${expandedServer.tools.length})`
							}),
							expandedServer.tools.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: McpDock_module_css_default.toolsEmpty,
								children: t("detail.toolsEmpty")
							}) : (0, react_jsx_runtime.jsx)("ul", {
								className: McpDock_module_css_default.toolList,
								children: expandedServer.tools.map((tool) => (0, react_jsx_runtime.jsxs)("li", {
									className: McpDock_module_css_default.tool,
									children: [(0, react_jsx_runtime.jsx)("code", {
										className: McpDock_module_css_default.toolName,
										children: tool.rawName
									}), (0, react_jsx_runtime.jsx)("span", {
										className: McpDock_module_css_default.toolDesc,
										children: tool.description
									})]
								}, tool.publicName))
							})
						]
					}) : null
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `mcp` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"nav": "MCP 服务",
			"section.description": "管理可连接到会话的 MCP 服务器。绑定后，服务器暴露的工具会出现在此会话中。",
			"section.empty": "还没有配置的服务器。",
			"form.name": "名称",
			"form.name.placeholder": "例如 file-server",
			"form.transport": "传输方式",
			"form.transport.stdio": "stdio（本地命令）",
			"form.transport.http": "流式 HTTP",
			"form.transport.sse": "SSE（旧版事件流）",
			"form.url": "服务端 URL",
			"form.url.placeholder": "https://example.com/mcp",
			"form.command": "命令",
			"form.command.placeholder": "例如 npx",
			"form.args": "参数（空格分隔）",
			"form.add": "添加服务器",
			"action.remove": "移除",
			"action.bind": "绑定",
			"action.bound": "已绑定",
			"action.unbind": "解除绑定",
			"action.detail": "查看详情",
			"action.refreshTools": "刷新工具数",
			"action.fetching": "获取中...",
			"detail.tools": "个工具",
			"detail.toolsEmpty": "此服务暂未暴露任何工具",
			"dock.empty": "无 MCP 工具",
			"dock.label": "MCP 工具",
			"error.load": "MCP 列表加载失败",
			"error.action": "操作失败"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"nav": "MCP servers",
			"section.description": "Manage MCP servers you can connect to a session. Bound servers expose their tools in that session.",
			"section.empty": "No servers configured yet.",
			"form.name": "Name",
			"form.name.placeholder": "e.g. file-server",
			"form.transport": "Transport",
			"form.transport.stdio": "stdio (local command)",
			"form.transport.http": "Streamable HTTP",
			"form.transport.sse": "SSE (legacy event stream)",
			"form.url": "Server URL",
			"form.url.placeholder": "https://example.com/mcp",
			"form.command": "Command",
			"form.command.placeholder": "e.g. npx",
			"form.args": "Args (space separated)",
			"form.add": "Add server",
			"action.remove": "Remove",
			"action.bind": "Bind",
			"action.bound": "Bound",
			"action.unbind": "Unbind",
			"action.detail": "Details",
			"action.refreshTools": "Refresh",
			"action.fetching": "Fetching...",
			"detail.tools": "tools",
			"detail.toolsEmpty": "This server exposes no tools",
			"dock.empty": "No MCP tools",
			"dock.label": "MCP tools",
			"error.load": "Could not load MCP servers",
			"error.action": "Action failed"
		};
		//#endregion
		//#region lib/types/client/index.js
		/**
		* MCP management plugin, browser half: the MCP servers settings section plus
		* the per-session bind dock above the input area. One catalog controller
		* backs the section; one session controller per Session backs dock chips, so
		* a bind/bound read cycles exactly once per active surface.
		* @module @deepseek-ai/dsh-client-ui-mcp/client
		*/
		/** Dictionary namespace owned by this plugin. */
		const NS = "mcp";
		/** Required services: the slot registry, the Remote namespace, and the copy. */
		const inject = [
			"slots",
			"remote",
			"remote.mcpManager",
			"locale"
		];
		/**
		* Client plugin body: the MCP catalog section and the per-session dock.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-mcp: dictionaries");
			const remote = ctx.remote.mcpManager;
			const catalog = new McpCatalogController(remote);
			const sections = /* @__PURE__ */ new Map();
			const sectionFor = (sessionId) => {
				let controller = sections.get(sessionId);
				if (controller === void 0) {
					controller = new McpSessionController(remote, sessionId);
					sections.set(sessionId, controller);
				}
				return controller;
			};
			const t = ctx.locale.bind(NS);
			ctx.on("connection/reset", () => {
				catalog.resync();
				for (const controller of sections.values()) controller.resync();
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "mcp",
				order: 40,
				label: () => t("nav"),
				inject: () => ({
					controller: catalog,
					t
				})
			}, McpSettingsSection));
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "mcp",
				order: 30,
				locale: NS,
				inject: (sessionId) => ({ controller: sectionFor(sessionId) })
			}, McpDock));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map