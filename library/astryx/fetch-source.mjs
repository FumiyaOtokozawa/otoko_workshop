// Astryx の元のコード一式（v0.7.11）を library/astryx/source/ に戻す。
// 手元の控え（library/archive/astryx/）から戻すので、ネットも元のサイトも要らない。
// 実行: node library/astryx/fetch-source.mjs
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const archive = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'archive',
  'archive.mjs',
)
execFileSync(process.execPath, [archive, 'restore', 'astryx'], { stdio: 'inherit' })
