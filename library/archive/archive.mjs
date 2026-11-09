#!/usr/bin/env node
// 外の素材の「控え」を扱う道具。元のサイトが非公開になっても、ここから戻せる。
// GitHub は 1 ファイル 100MB までなので、大きいファイルは 90MiB ずつに分けて保存している。
//
//   node library/archive/archive.mjs verify            控えが壊れていないか確かめる
//   node library/archive/archive.mjs restore pixel     ドット絵の全データを戻す
//   node library/archive/archive.mjs restore astryx    Astryx の元コードを戻す
//   node library/archive/archive.mjs restore all       両方を戻す
//
// 保守用: node library/archive/archive.mjs pack <元ファイル> <保存先フォルダ>

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LIB = path.dirname(HERE)
const SUMS = path.join(HERE, 'SHA256SUMS')
const PART_SIZE = 90 * 1024 * 1024 // 90MiB（GitHub の上限 100MB より小さくする）

// 控えに入っている大きいファイル（分けて保存している物）
export const ITEMS = {
  pixel: { file: 'pixel-art/pixel-art-16x16-1.4m.zip' },
  astryx: { file: 'astryx/astryx-v0.7.11.bundle' },
}
const ASTRYX_BRANCH = 'archive-v0.7.11'
const ASTRYX_TREE = '128ab42f1943d5372d02b6fa0f192eddaed8f34c' // 元の v0.7.11 と同じ中身の目印

function sha256File(file) {
  const h = crypto.createHash('sha256')
  const fd = fs.openSync(file, 'r')
  const buf = Buffer.alloc(8 * 1024 * 1024)
  let n
  while ((n = fs.readSync(fd, buf, 0, buf.length)) > 0) h.update(buf.subarray(0, n))
  fs.closeSync(fd)
  return h.digest('hex')
}

function readSums() {
  const map = new Map()
  for (const line of fs.readFileSync(SUMS, 'utf8').split('\n')) {
    const m = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim())
    if (m) map.set(m[2], m[1])
  }
  return map
}

function partsOf(rel) {
  const dir = path.join(HERE, path.dirname(rel))
  const base = path.basename(rel)
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(base + '.') && /\.\d{3}$/.test(f))
    .sort()
    .map((f) => path.join(path.dirname(rel), f))
}

// 分けたファイルをつなげて 1 つに戻し、目印（SHA-256）が合うか確かめる
export function joinParts(key, dest) {
  const rel = ITEMS[key].file
  const parts = partsOf(rel)
  if (!parts.length) throw new Error(`控えが見つかりません: ${rel}`)
  const expect = readSums().get(rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const out = fs.openSync(dest + '.part', 'w')
  for (const p of parts) {
    const data = fs.readFileSync(path.join(HERE, p))
    fs.writeSync(out, data)
  }
  fs.closeSync(out)
  const got = sha256File(dest + '.part')
  if (got !== expect) {
    fs.rmSync(dest + '.part')
    throw new Error(`控えが壊れています: ${rel}（目印が合いません）`)
  }
  fs.renameSync(dest + '.part', dest)
  return dest
}

export function hasArchive(key) {
  try {
    return partsOf(ITEMS[key].file).length > 0
  } catch {
    return false
  }
}

function verify() {
  const sums = readSums()
  let bad = 0
  for (const [rel, expect] of sums) {
    const file = path.join(HERE, rel)
    if (fs.existsSync(file)) {
      const ok = sha256File(file) === expect
      console.log(`${ok ? 'OK  ' : 'NG  '} ${rel}`)
      if (!ok) bad++
      continue
    }
    // 分けて保存している物は、つなげた結果で確かめる
    const parts = partsOf(rel)
    if (!parts.length) {
      console.log(`NG   ${rel}（見つかりません）`)
      bad++
      continue
    }
    const h = crypto.createHash('sha256')
    for (const p of parts) h.update(fs.readFileSync(path.join(HERE, p)))
    const ok = h.digest('hex') === expect
    console.log(`${ok ? 'OK  ' : 'NG  '} ${rel}（${parts.length} 個に分割）`)
    if (!ok) bad++
  }
  if (bad) throw new Error(`${bad} 件が壊れています`)
  console.log('すべての控えが正しいことを確かめました')
}

function restoreAstryx() {
  const dest = path.join(LIB, 'astryx', 'source')
  if (fs.existsSync(dest)) {
    console.log(`すでにあります: ${dest}`)
    return
  }
  const bundle = joinParts('astryx', path.join(LIB, 'astryx', '.astryx.bundle'))
  try {
    execFileSync('git', ['clone', '-q', '-b', ASTRYX_BRANCH, bundle, dest], { stdio: 'inherit' })
  } finally {
    fs.rmSync(bundle, { force: true })
  }
  const tree = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD^{tree}']).toString().trim()
  if (tree !== ASTRYX_TREE) throw new Error('戻した中身が元と違います')
  console.log(`完了: Astryx の元コードを ${dest} に戻しました（元の v0.7.11 と同じ中身）`)
}

function restorePixel() {
  execFileSync(process.execPath, [path.join(LIB, 'pixel-art', 'pixel.mjs'), 'fetch'], {
    stdio: 'inherit',
  })
}

function pack(src, outDir) {
  const name = path.basename(src)
  const dir = path.join(HERE, outDir)
  fs.mkdirSync(dir, { recursive: true })
  const size = fs.statSync(src).size
  const fd = fs.openSync(src, 'r')
  const buf = Buffer.alloc(PART_SIZE)
  for (let i = 0, off = 0; off < size; i++, off += PART_SIZE) {
    const n = fs.readSync(fd, buf, 0, PART_SIZE, off)
    fs.writeFileSync(path.join(dir, `${name}.${String(i).padStart(3, '0')}`), buf.subarray(0, n))
  }
  fs.closeSync(fd)
  console.log(`${sha256File(src)}  ${path.join(outDir, name)}`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const [cmd, arg, arg2] = process.argv.slice(2)
    if (cmd === 'verify') verify()
    else if (cmd === 'restore' && arg === 'pixel') restorePixel()
    else if (cmd === 'restore' && arg === 'astryx') restoreAstryx()
    else if (cmd === 'restore' && arg === 'all') (restorePixel(), restoreAstryx())
    else if (cmd === 'pack' && arg && arg2) pack(arg, arg2)
    else {
      console.log(
        '使い方: node library/archive/archive.mjs verify | restore pixel | restore astryx | restore all',
      )
    }
  } catch (e) {
    process.stderr.write(`エラー: ${e.message}\n`)
    process.exit(1)
  }
}
