import contribution from '../../../mcp/mcp-manager/lib/typert.remote-client.js'

window.__ModuleLoader__.load({
  id: '@deepseek-ai/dsh-client-mcp-remote',
  factory: () => ({
    inject: ['remote'],
    async apply(ctx) {
      return ctx.remote.$mount(contribution)
    },
  }),
})
