import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'

const roots: string[] = []
const launcher = fileURLToPath(new URL('../bin/dsh-mcp.mjs', import.meta.url))

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function run(args: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-mcp-launcher-'))
  roots.push(root)
  const record = join(root, 'record.txt')
  const dsh = join(root, 'dsh')
  writeFileSync(dsh, `#!/bin/sh\nprintf '%s\\n' "$@" > "${record}"\n`)
  chmodSync(dsh, 0o755)
  const result = spawnSync(process.execPath, [launcher, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${root}${delimiter}${process.env.PATH ?? ''}` },
  })
  return { result, record }
}

describe.skipIf(process.platform === 'win32')('dsh-mcp launcher', () => {
  it('installs its bundle into the selected profile', () => {
    const { result, record } = run(['deploy', '--profile', 'mcp'])
    expect(result.status).toBe(0)
    expect(readFileSync(record, 'utf8')).toBe('plugin\n--profile\nmcp\nadd\n@deepseek-ai/dsh-mcp\n')
  })

  it('starts a profile without mutating its dependency manifest', () => {
    const { result, record } = run(['run', '--profile', 'mcp', 'List MCP servers.'])
    expect(result.status).toBe(0)
    expect(readFileSync(record, 'utf8')).toBe('--profile\nmcp\nList MCP servers.\n')
  })
})
