#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PACKAGE_SPEC = fileURLToPath(new URL('../', import.meta.url))
const DEPENDENCY_SPECS = [
  fileURLToPath(new URL('../../../client/ui-mcp/', import.meta.url)),
  fileURLToPath(new URL('../../../mcp/mcp-client/', import.meta.url)),
  fileURLToPath(new URL('../../../mcp/mcp-manager/', import.meta.url)),
]
const DEFAULT_PROFILE = 'headless'
const DSH_BIN = process.env.DSH_BIN || 'dsh'

function usage() {
  process.stderr.write('usage: dsh-mcp <deploy|run> [--profile <name>] [dsh arguments...]\n')
}

function profileFrom(args) {
  let profile = DEFAULT_PROFILE
  const remaining = []
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value !== '--profile') {
      remaining.push(value)
      continue
    }
    const next = args[index + 1]
    if (next === undefined || next.startsWith('-')) {
      process.stderr.write('dsh-mcp: --profile requires a profile name\n')
      return undefined
    }
    profile = next
    index += 1
  }
  return { profile, remaining }
}

function invoke(args) {
  const result = spawnSync(DSH_BIN, args, { stdio: 'inherit' })
  if (result.error !== undefined) {
    process.stderr.write(`dsh-mcp: failed to start ${DSH_BIN}: ${result.error.message}\n`)
    return 1
  }
  return result.status ?? 1
}

function deploy(profile) {
  for (const packageSpec of [...DEPENDENCY_SPECS, PACKAGE_SPEC]) {
    const status = invoke(['plugin', '--profile', profile, 'add', packageSpec])
    if (status !== 0) return status
  }
  return 0
}

const [command = 'run', ...args] = process.argv.slice(2)
const parsed = profileFrom(args)
if (parsed === undefined) process.exitCode = 1
else if (command === 'deploy') process.exitCode = deploy(parsed.profile)
else if (command === 'run') process.exitCode = invoke(['--profile', parsed.profile, ...parsed.remaining])
else {
  usage()
  process.exitCode = 1
}
