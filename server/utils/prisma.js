import { createRequire } from 'node:module'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const _require = createRequire(resolve(process.cwd(), 'package.json'))

const enginesDir = resolve(process.cwd(), 'node_modules/.prisma/client')
if (existsSync(enginesDir)) {
  const files = readdirSync(enginesDir)
  const isMusl = existsSync('/etc/alpine-release')
  const engine = files.find(f =>
    f.endsWith('.so.node') && (isMusl ? f.includes('musl') : f.includes('debian'))
  ) || files.find(f => f.endsWith('.so.node'))
  if (engine) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = resolve(enginesDir, engine)
  }
}

const { PrismaClient } = _require('@prisma/client')
export const prisma = new PrismaClient()
