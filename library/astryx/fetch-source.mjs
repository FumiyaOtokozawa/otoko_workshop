// Astryx の元のコード一式（v0.7.11）を library/astryx/source/ に取ってくる。
// 部品の中身を読みたい・改造したいときだけ使う。普段は npm の版で十分。
// 実行: node library/astryx/fetch-source.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = 'v0.7.11'
const COMMIT = 'df8a86a3ae9d0b2d6337c5cf3369488a6f5ac838'
const dest = path.join(path.dirname(fileURLToPath(import.meta.url)), 'source')

if (fs.existsSync(dest)) {
  console.log(`すでにあります: ${dest}`)
  process.exit(0)
}
execFileSync(
  'git',
  ['clone', '--depth', '1', '--branch', TAG, 'https://github.com/meta/astryx', dest],
  { stdio: 'inherit', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } },
)
const head = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD']).toString().trim()
if (head !== COMMIT) console.warn(`注意: 版の目印が想定と違います（${head}）`)
console.log(`完了: ${dest}`)
