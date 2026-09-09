#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = '127.0.0.1'
const MAX_SKILL_BYTES = 256 * 1024
const MAX_TREE_ENTRIES = 160
const MAX_PLUGIN_SCAN_DIRS = 12000
const MAX_PROJECT_SCAN_DIRS = 3000
const IGNORED = new Set(['.git', 'node_modules', '.next', '.turbo', 'dist', 'build', 'coverage'])
const SYSTEM_MARKETPLACES = new Set(['openai-bundled', 'openai-primary-runtime', 'openai-curated', 'openai-curated-remote'])
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STATIC = path.join(ROOT, 'web')

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}

function hasArg(name) {
  return process.argv.includes(name)
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function within(target, root) {
  const relative = path.relative(root, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

async function realDir(directory) {
  try {
    const stat = await fs.stat(directory)
    if (!stat.isDirectory()) return undefined
    return await fs.realpath(directory)
  } catch {
    return undefined
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return undefined
  }
}

async function readTextLimited(file) {
  const handle = await fs.open(file, 'r')
  try {
    const stat = await handle.stat()
    const length = Math.min(stat.size, MAX_SKILL_BYTES)
    const buffer = Buffer.alloc(length)
    await handle.read(buffer, 0, length, 0)
    return { text: buffer.toString('utf8'), truncated: stat.size > MAX_SKILL_BYTES, updatedAt: stat.mtime.toISOString() }
  } finally {
    await handle.close()
  }
}

function parseFrontmatter(text, fallbackName) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)
  if (!match) return { name: fallbackName, description: '', metadata: {}, body: text.trim() }
  const fm = match[1]
  const body = text.slice(match[0].length).trim()
  const metadata = {}
  for (const line of fm.split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!item) continue
    const key = item[1]
    let value = item[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    metadata[key] = value
  }
  return {
    name: metadata.name || fallbackName,
    description: metadata.description || '',
    metadata,
    body,
  }
}

async function fileTree(directory) {
  const files = []
  let count = 0
  let truncated = false
  async function walk(current, depth) {
    if (files.length >= MAX_TREE_ENTRIES || depth > 4) {
      truncated = true
      return
    }
    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (files.length >= MAX_TREE_ENTRIES) {
        truncated = true
        return
      }
      if (entry.isSymbolicLink()) continue
      const absolute = path.join(current, entry.name)
      const relative = path.relative(directory, absolute)
      if (entry.isDirectory()) {
        if (IGNORED.has(entry.name)) continue
        files.push({ path: relative, kind: 'directory' })
        await walk(absolute, depth + 1)
      } else if (entry.isFile()) {
        count += 1
        files.push({ path: relative, kind: 'file' })
      }
    }
  }
  await walk(directory, 0)
  return { files, fileCount: count, filesTruncated: truncated }
}

function idFor(parts) {
  return createHash('sha256').update(JSON.stringify(parts)).digest('base64url').slice(0, 20)
}

async function skillFromDirectory(directory, source) {
  const real = await realDir(directory)
  if (!real) return undefined
  const skillFile = path.join(real, 'SKILL.md')
  try {
    const stat = await fs.stat(skillFile)
    if (!stat.isFile()) return undefined
  } catch {
    return undefined
  }
  const doc = await readTextLimited(skillFile)
  const parsed = parseFrontmatter(doc.text, path.basename(real))
  const tree = await fileTree(real)
  return {
    id: idFor({ real, source }),
    name: parsed.name,
    description: parsed.description || 'No description provided.',
    source,
    path: directory,
    canonicalPath: real,
    updatedAt: doc.updatedAt,
    content: doc.text,
    body: parsed.body,
    contentTruncated: doc.truncated,
    bodyLines: parsed.body ? parsed.body.split(/\r?\n/).length : 0,
    bodyWords: parsed.body ? parsed.body.trim().split(/\s+/).filter(Boolean).length : 0,
    ...tree,
  }
}

async function directSkillChildren(root, sourceFactory) {
  const real = await realDir(root)
  if (!real) return []
  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return []
  }
  const records = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    const directory = path.join(root, entry.name)
    const skill = await skillFromDirectory(directory, sourceFactory(directory))
    if (skill) records.push(skill)
  }
  return records
}

async function projectSkillRoots(workspaceRoot) {
  const roots = []
  const seen = new Set()
  let scanned = 0
  async function walk(current, depth) {
    if (depth > 8 || scanned >= MAX_PROJECT_SCAN_DIRS) return
    const real = await realDir(current)
    if (!real || seen.has(real)) return
    seen.add(real)
    scanned += 1
    const candidate = path.join(real, '.agents', 'skills')
    if (await realDir(candidate)) roots.push(candidate)
    let entries
    try {
      entries = await fs.readdir(real, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || IGNORED.has(entry.name) || entry.name === '.agents') continue
      await walk(path.join(real, entry.name), depth + 1)
    }
  }
  await walk(workspaceRoot, 0)
  return roots
}

function pluginInfo(pluginRoot) {
  const parts = pluginRoot.split(path.sep)
  const cache = parts.indexOf('cache')
  const marketplace = cache >= 0 ? parts[cache + 1] : undefined
  const plugin = cache >= 0 ? parts[cache + 2] : undefined
  const version = cache >= 0 ? parts[cache + 3] : undefined
  return { marketplace, plugin, version }
}

function userAddedPlugin(info) {
  return Boolean(info.marketplace) && !SYSTEM_MARKETPLACES.has(info.marketplace)
}

async function pluginSkillDirectories(cacheRoot) {
  const root = await realDir(cacheRoot)
  if (!root) return []
  const found = []
  const seen = new Set()
  let scanned = 0
  async function walk(current) {
    if (scanned >= MAX_PLUGIN_SCAN_DIRS) return
    const real = await realDir(current)
    if (!real || seen.has(real) || !within(real, root)) return
    seen.add(real)
    scanned += 1
    try {
      const stat = await fs.stat(path.join(real, 'SKILL.md'))
      if (stat.isFile()) found.push(real)
    } catch {
      // continue
    }
    let entries
    try {
      entries = await fs.readdir(real, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || IGNORED.has(entry.name)) continue
      await walk(path.join(real, entry.name))
    }
  }
  await walk(root)
  return found.sort()
}

async function discover(workspace) {
  const home = homedir()
  const workspaceRoot = await realDir(path.resolve(workspace || process.cwd()))
  if (!workspaceRoot) throw new Error('workspace is not a readable directory')
  const skills = []
  const roots = []
  const userCodex = path.join(home, '.codex', 'skills')
  const userShared = path.join(home, '.agents', 'skills')
  const pluginCache = path.join(home, '.codex', 'plugins', 'cache')

  roots.push({ label: 'Codex user', path: userCodex, available: Boolean(await realDir(userCodex)) })
  roots.push({ label: 'Shared user', path: userShared, available: Boolean(await realDir(userShared)) })
  roots.push({ label: 'Codex plugin cache', path: pluginCache, available: Boolean(await realDir(pluginCache)) })

  skills.push(...await directSkillChildren(userCodex, () => ({ kind: 'codex-user', label: 'Codex user', personal: true })))
  skills.push(...await directSkillChildren(path.join(userCodex, '.system'), () => ({ kind: 'codex-system', label: 'Codex system', personal: false })))
  skills.push(...await directSkillChildren(userShared, () => ({ kind: 'shared-user', label: 'Shared/local', personal: false })))

  for (const projectRoot of await projectSkillRoots(workspaceRoot)) {
    roots.push({ label: 'Project', path: projectRoot, available: true })
    skills.push(...await directSkillChildren(projectRoot, () => ({ kind: 'project', label: 'Project', personal: true })))
  }

  for (const directory of await pluginSkillDirectories(pluginCache)) {
    const info = pluginInfo(directory)
    const skill = await skillFromDirectory(directory, {
      kind: 'plugin-cache',
      label: info.plugin ? `Plugin: ${info.plugin}` : 'Plugin cache',
      personal: userAddedPlugin(info),
      ...info,
    })
    if (skill) skills.push(skill)
  }

  const unique = new Map()
  for (const skill of skills) unique.set(`${skill.source.kind}:${skill.canonicalPath}`, skill)
  const records = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name) || a.source.label.localeCompare(b.source.label))
  const byKind = {}
  let personalTotal = 0
  for (const skill of records) byKind[skill.source.kind] = (byKind[skill.source.kind] || 0) + 1
  for (const skill of records) if (skill.source.personal) personalTotal += 1
  return { workspaceRoot, roots, skills: records, counts: { total: records.length, personalTotal, byKind } }
}

function json(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(body)
}

async function staticFile(pathname, response) {
  const decoded = decodeURIComponent(pathname)
  const relative = decoded.replace(/^\/+/, '') || 'index.html'
  const root = await fs.realpath(STATIC)
  const candidate = path.resolve(root, relative)
  if (!within(candidate, root)) {
    response.writeHead(404).end('not found')
    return
  }
  let file = candidate
  try {
    const stat = await fs.stat(file)
    if (!stat.isFile()) file = path.join(root, 'index.html')
  } catch {
    file = path.join(root, 'index.html')
  }
  const ext = path.extname(file)
  const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : 'application/octet-stream'
  response.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    'Content-Security-Policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  })
  createReadStream(file).pipe(response)
}

export function createApp(workspace) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${HOST}`)
      if (url.pathname === '/api/skills') {
        if (request.method !== 'GET') return json(response, 405, { error: 'method not allowed' })
        return json(response, 200, await discover(workspace))
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: 'method not allowed' })
      return staticFile(url.pathname, response)
    } catch (error) {
      return json(response, 500, { error: error instanceof Error ? error.message : 'unexpected error' })
    }
  })
}

if (hasArg('--check')) {
  const data = await discover(arg('--workspace', process.cwd()))
  console.log(JSON.stringify(data.counts, null, 2))
} else {
  const workspace = arg('--workspace', process.cwd())
  const portValue = Number(arg('--port', '4174'))
  const server = createApp(workspace)
  server.listen(Number.isFinite(portValue) ? portValue : 4174, HOST, () => {
    const address = server.address()
    console.log(`Skill Pet running at http://${HOST}:${address.port}`)
  })
}
