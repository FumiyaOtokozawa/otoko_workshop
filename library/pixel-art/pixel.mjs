#!/usr/bin/env node
// ドット絵（Pixel Art Atlas 1.4M / CC0）を呼び出す道具。追加の部品は不要（Node 20 以上）。
//
// 使い方は `node library/pixel-art/pixel.mjs help` を見る。
// データの置き場所:
//   data/    … 全 1,409,404 枚（`fetch` で取得。約260MB。GitHub には置かない）
//   sample/  … 6,194 種類の代表 1 枚ずつ（GitHub に保存済み）
// data/ があれば data/ を、無ければ sample/ を使う。--sample で sample/ を強制できる。

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FULL_DIR = path.join(HERE, 'data')
const SAMPLE_DIR = path.join(HERE, 'sample')
const ZIP_URL =
  'https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m/resolve/main/pixel-art-16x16-1.4m.zip'
const SIZE = 16 // 1枚は 16×16 ピクセル
const CELLS = SIZE * SIZE

// ───────── 引数の読み取り ─────────
// 値を取らないオプション（--sample sheet の sheet を値と取り違えないため）
const FLAGS = new Set(['sample', 'subject', 'json', 'force', 'keep', 'help', 'online'])

function parseArgs(argv) {
  const pos = []
  const opt = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (FLAGS.has(key) || next === undefined || next.startsWith('--')) opt[key] = true
      else {
        opt[key] = next
        i++
      }
    } else pos.push(a)
  }
  return { pos, opt }
}

// ───────── .npy（数値の表）の読み書き ─────────
function readNpyHeader(fd) {
  const head = Buffer.alloc(10)
  fs.readSync(fd, head, 0, 10, 0)
  if (head.toString('latin1', 1, 6) !== 'NUMPY') throw new Error('npy 形式ではありません')
  const major = head[6]
  let hlen, start
  if (major === 1) {
    hlen = head.readUInt16LE(8)
    start = 10
  } else {
    const b = Buffer.alloc(12)
    fs.readSync(fd, b, 0, 12, 0)
    hlen = b.readUInt32LE(8)
    start = 12
  }
  const hb = Buffer.alloc(hlen)
  fs.readSync(fd, hb, 0, hlen, start)
  const text = hb.toString('latin1')
  const descr = /'descr':\s*'([^']+)'/.exec(text)[1]
  const shape = /'shape':\s*\(([^)]*)\)/
    .exec(text)[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
  return { descr, shape, offset: start + hlen }
}

function writeNpy(file, descr, shape, data) {
  let header = `{'descr': '${descr}', 'fortran_order': False, 'shape': (${shape.join(', ')}${shape.length === 1 ? ',' : ''}), }`
  const total = 10 + header.length + 1
  header += ' '.repeat((64 - (total % 64)) % 64) + '\n'
  const pre = Buffer.alloc(10)
  pre.write('\x93NUMPY', 0, 'latin1')
  pre[6] = 1
  pre[7] = 0
  pre.writeUInt16LE(header.length, 8)
  fs.writeFileSync(file, Buffer.concat([pre, Buffer.from(header, 'latin1'), data]))
}

// ───────── データ集の読み込み ─────────
function openAtlas(opt) {
  const dir =
    !opt.sample && fs.existsSync(path.join(FULL_DIR, 'tokens.npy')) ? FULL_DIR : SAMPLE_DIR
  if (!fs.existsSync(path.join(dir, 'tokens.npy'))) {
    throw new Error(
      'データが見つかりません。先に `node library/pixel-art/pixel.mjs fetch` を実行してください。',
    )
  }
  const fd = fs.openSync(path.join(dir, 'tokens.npy'), 'r')
  const head = readNpyHeader(fd)
  if (head.descr !== '<u2' || head.shape[1] !== CELLS)
    throw new Error('tokens.npy の形が想定と違います')

  const pfd = fs.openSync(path.join(dir, 'palette.npy'), 'r')
  const ph = readNpyHeader(pfd)
  const palette = Buffer.alloc(ph.shape[0] * 3)
  fs.readSync(pfd, palette, 0, palette.length, ph.offset)
  fs.closeSync(pfd)

  let cache = {}
  const json = (name) => (cache[name] ??= JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))
  const idsFile = path.join(dir, 'ids.json')
  const origIds = fs.existsSync(idsFile) ? json('ids.json') : null

  return {
    dir,
    isSample: dir === SAMPLE_DIR,
    count: head.shape[0],
    captions: () => json('captions.json'),
    subjects: () => json('objects.json'),
    // 元の番号（全データでの番号）。見本でも全データでも、同じ絵は同じ番号で呼べる
    originalId: (i) => (origIds ? origIds[i] : i),
    // 元の番号 → このデータの中での位置
    resolve(id) {
      if (!origIds) return id
      const k = origIds.indexOf(id)
      if (k < 0)
        throw new Error(
          `番号 ${id} は見本に入っていません。全データを取るには \`npm run pixel -- fetch\` を実行してください。`,
        )
      return k
    },
    tokens(i) {
      if (!(i >= 0 && i < head.shape[0]))
        throw new Error(`番号 ${i} は範囲外です（0〜${head.shape[0] - 1}）`)
      const b = Buffer.alloc(CELLS * 2)
      fs.readSync(fd, b, 0, b.length, head.offset + i * CELLS * 2)
      return new Uint16Array(b.buffer, b.byteOffset, CELLS)
    },
    // 1枚を RGBA（赤・緑・青・透明度）の並びに直す
    rgba(i) {
      const t = this.tokens(i)
      const out = Buffer.alloc(CELLS * 4)
      for (let k = 0; k < CELLS; k++) {
        const c = t[k]
        if (c === 0) continue // 0 は透明
        out[k * 4] = palette[c * 3]
        out[k * 4 + 1] = palette[c * 3 + 1]
        out[k * 4 + 2] = palette[c * 3 + 2]
        out[k * 4 + 3] = 255
      }
      return out
    },
    rawPalette: palette,
  }
}

// ───────── PNG の書き出し ─────────
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})
function crc32(buf) {
  let c = -1
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
export function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // 1色8ビット
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++)
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// 何枚かを格子状に並べて 1 枚の絵にする（scale 倍に拡大。ぼかさない）
function composeSheet(atlas, ids, { scale = 1, cols, gap = 0, bg = null }) {
  cols = Math.max(1, Math.min(cols ?? Math.ceil(Math.sqrt(ids.length)), ids.length))
  const rows = Math.ceil(ids.length / cols)
  const cell = SIZE * scale + gap
  const W = cols * cell + gap
  const H = rows * cell + gap
  const out = Buffer.alloc(W * H * 4)
  if (bg) for (let k = 0; k < W * H; k++) out.set(bg, k * 4)
  ids.forEach((id, n) => {
    const px = atlas.rgba(id)
    const ox = gap + (n % cols) * cell
    const oy = gap + Math.floor(n / cols) * cell
    for (let y = 0; y < SIZE * scale; y++)
      for (let x = 0; x < SIZE * scale; x++) {
        const s = (Math.floor(y / scale) * SIZE + Math.floor(x / scale)) * 4
        if (px[s + 3] === 0) continue
        const d = ((oy + y) * W + ox + x) * 4
        px.copy(out, d, s, s + 4)
      }
  })
  return encodePng(W, H, out)
}

// ───────── 検索 ─────────
function search(atlas, words, { subjectOnly = false } = {}) {
  const terms = words.map((w) => w.toLowerCase())
  const caps = atlas.captions()
  const subs = atlas.subjects()
  const hits = []
  for (let i = 0; i < atlas.count; i++) {
    const hay = subjectOnly ? subs[i].toLowerCase() : `${subs[i]} ${caps[i]}`.toLowerCase()
    if (terms.every((t) => hay.includes(t))) hits.push(i)
  }
  return hits
}

// ───────── ZIP の取得と展開（Node だけで行う） ─────────
function download(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'user-agent': 'otoko-library' } }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects > 0
        ) {
          res.resume()
          return resolve(
            download(new URL(res.headers.location, url).toString(), dest, redirects - 1),
          )
        }
        if (res.statusCode !== 200)
          return reject(new Error(`ダウンロード失敗: HTTP ${res.statusCode}`))
        const total = Number(res.headers['content-length'] || 0)
        let got = 0
        let last = 0
        res.on('data', (c) => {
          got += c.length
          const pct = total ? Math.floor((got / total) * 100) : 0
          if (pct >= last + 5) {
            last = pct
            process.stderr.write(`  取得中 ${pct}%（${(got / 1e6).toFixed(0)}MB）\n`)
          }
        })
        const out = fs.createWriteStream(dest)
        res.pipe(out)
        out.on('finish', () => resolve())
        out.on('error', reject)
      })
      .on('error', reject)
  })
}

async function unzip(zipFile, outDir) {
  const fd = fs.openSync(zipFile, 'r')
  const size = fs.fstatSync(fd).size
  const tailLen = Math.min(size, 65557)
  const tail = Buffer.alloc(tailLen)
  fs.readSync(fd, tail, 0, tailLen, size - tailLen)
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (eocd < 0) throw new Error('ZIP の終わりの目印が見つかりません')
  let entries = tail.readUInt16LE(eocd + 10)
  let cdSize = tail.readUInt32LE(eocd + 12)
  let cdOff = tail.readUInt32LE(eocd + 16)
  // ZIP64（4GB 超え用の書き方）にも対応
  const loc = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x07]))
  if (cdOff === 0xffffffff && loc >= 0) {
    const z64 = Number(tail.readBigUInt64LE(loc + 8))
    const zb = Buffer.alloc(56)
    fs.readSync(fd, zb, 0, 56, z64)
    entries = Number(zb.readBigUInt64LE(32))
    cdSize = Number(zb.readBigUInt64LE(40))
    cdOff = Number(zb.readBigUInt64LE(48))
  }
  const cd = Buffer.alloc(cdSize)
  fs.readSync(fd, cd, 0, cdSize, cdOff)
  let p = 0
  for (let e = 0; e < entries; e++) {
    const method = cd.readUInt16LE(p + 10)
    let csize = cd.readUInt32LE(p + 20)
    let usize = cd.readUInt32LE(p + 24)
    const nlen = cd.readUInt16LE(p + 28)
    const xlen = cd.readUInt16LE(p + 30)
    const clen = cd.readUInt16LE(p + 32)
    let lho = cd.readUInt32LE(p + 42)
    const name = cd.toString('utf8', p + 46, p + 46 + nlen)
    let xp = p + 46 + nlen
    const xend = xp + xlen
    while (xp < xend) {
      const id = cd.readUInt16LE(xp)
      const sz = cd.readUInt16LE(xp + 2)
      if (id === 1) {
        let q = xp + 4
        if (usize === 0xffffffff) ((usize = Number(cd.readBigUInt64LE(q))), (q += 8))
        if (csize === 0xffffffff) ((csize = Number(cd.readBigUInt64LE(q))), (q += 8))
        if (lho === 0xffffffff) lho = Number(cd.readBigUInt64LE(q))
      }
      xp += 4 + sz
    }
    p = xend + clen
    if (name.endsWith('/') || name.includes('..') || path.isAbsolute(name)) continue
    const lh = Buffer.alloc(30)
    fs.readSync(fd, lh, 0, 30, lho)
    const dataStart = lho + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28)
    const dest = path.join(outDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    process.stderr.write(`  展開中 ${name}（${(usize / 1e6).toFixed(1)}MB）\n`)
    await new Promise((resolve, reject) => {
      const src = fs.createReadStream(zipFile, { start: dataStart, end: dataStart + csize - 1 })
      const out = fs.createWriteStream(dest)
      const stream = method === 8 ? src.pipe(zlib.createInflateRaw()) : src
      if (method !== 0 && method !== 8) return reject(new Error(`未対応の圧縮方式: ${method}`))
      stream.pipe(out)
      stream.on('error', reject)
      out.on('finish', resolve)
      out.on('error', reject)
    })
  }
  fs.closeSync(fd)
}

// ───────── 代表 1 枚ずつの見本を作る（保守用） ─────────
function buildSample(atlas) {
  if (atlas.isSample) throw new Error('build-sample には全データ（data/）が必要です')
  const subs = atlas.subjects()
  const caps = atlas.captions()
  const first = new Map()
  for (let i = 0; i < atlas.count; i++) if (!first.has(subs[i])) first.set(subs[i], i)
  const order = [...first.keys()].sort((a, b) => a.localeCompare(b))
  const ids = order.map((s) => first.get(s))
  fs.mkdirSync(SAMPLE_DIR, { recursive: true })
  const tok = Buffer.alloc(ids.length * CELLS * 2)
  ids.forEach((id, n) => Buffer.from(atlas.tokens(id).buffer.slice(0)).copy(tok, n * CELLS * 2))
  writeNpy(path.join(SAMPLE_DIR, 'tokens.npy'), '<u2', [ids.length, CELLS], tok)
  writeNpy(
    path.join(SAMPLE_DIR, 'palette.npy'),
    '|u1',
    [atlas.rawPalette.length / 3, 3],
    atlas.rawPalette,
  )
  fs.writeFileSync(path.join(SAMPLE_DIR, 'objects.json'), JSON.stringify(order))
  fs.writeFileSync(path.join(SAMPLE_DIR, 'captions.json'), JSON.stringify(ids.map((i) => caps[i])))
  fs.writeFileSync(path.join(SAMPLE_DIR, 'ids.json'), JSON.stringify(ids))
  const sample = openAtlas({ sample: true })
  const all = Array.from({ length: sample.count }, (_, i) => i)
  fs.writeFileSync(
    path.join(SAMPLE_DIR, 'atlas.png'),
    composeSheet(sample, all, { scale: 1, cols: 80 }),
  )
  return ids.length
}

// ───────── 命令 ─────────
const HELP = `ドット絵の呼び出し道具（16×16 ピクセル・透明背景・CC0）

  node library/pixel-art/pixel.mjs <命令> [引数] [--オプション]

命令:
  info                       いま使っているデータの枚数と場所を表示
  fetch                      全 1,409,404 枚を戻す（手元の控えから。--online でネットから）
  subjects [語]              種類（題材）の一覧。語を入れると絞り込む
  search <語...>             説明文と題材から探す（英語。例: sword fire）
  png <番号...>              PNG で書き出す
  sheet <語...>              見つかった絵を 1 枚に並べて書き出す
  random [語]                ランダムに 1 枚書き出す

オプション:
  --scale 8                  拡大の倍率（png の既定は 8、sheet は 4）
  --out パス                 書き出し先（png はフォルダ、sheet はファイル）
  --limit 50                 search / sheet の最大件数
  --subject                  search を題材名だけで探す
  --sample                   全データがあっても、見本（6,194 枚）を使う
  --json                     search の結果を JSON で出す

例:
  node library/pixel-art/pixel.mjs search dragon --limit 5
  node library/pixel-art/pixel.mjs png 12 34 --scale 16 --out ./sprites
  node library/pixel-art/pixel.mjs sheet potion --limit 64 --out potions.png
`

async function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2))
  const cmd = pos.shift() ?? 'help'
  const limit = Number(opt.limit ?? 50)

  if (cmd === 'help' || opt.help) return void process.stdout.write(HELP)

  if (cmd === 'fetch') {
    fs.mkdirSync(FULL_DIR, { recursive: true })
    const zip = path.join(FULL_DIR, 'atlas.zip')
    if (!fs.existsSync(zip) || opt.force) {
      // まず手元の控え（library/archive/）から戻す。元のサイトが消えていても動く
      const archive = await import('../archive/archive.mjs')
      if (!opt.online && archive.hasArchive('pixel')) {
        process.stderr.write('取得元: 手元の控え（library/archive/pixel-art/）\n')
        archive.joinParts('pixel', zip)
      } else {
        process.stderr.write(`取得元: ${ZIP_URL}\n`)
        await download(ZIP_URL, zip + '.part')
        fs.renameSync(zip + '.part', zip)
      }
    }
    await unzip(zip, FULL_DIR)
    if (!opt.keep) fs.rmSync(zip)
    const a = openAtlas({})
    console.log(`完了: ${a.count.toLocaleString()} 枚を ${a.dir} に保存しました`)
    return
  }

  const atlas = openAtlas(opt)

  if (cmd === 'info') {
    console.log(`データ: ${atlas.isSample ? '見本（各種類1枚）' : '全データ'}`)
    console.log(`場所:   ${atlas.dir}`)
    console.log(`枚数:   ${atlas.count.toLocaleString()} 枚`)
    console.log(`種類:   ${new Set(atlas.subjects()).size.toLocaleString()} 種類`)
    return
  }

  if (cmd === 'subjects') {
    const counts = new Map()
    for (const s of atlas.subjects()) counts.set(s, (counts.get(s) ?? 0) + 1)
    const word = pos.join(' ').toLowerCase()
    const rows = [...counts]
      .filter(([s]) => s.includes(word))
      .sort((a, b) => a[0].localeCompare(b[0]))
    for (const [s, n] of rows) console.log(atlas.isSample ? s : `${s}\t${n}`)
    process.stderr.write(`${rows.length} 種類\n`)
    return
  }

  if (cmd === 'search') {
    if (!pos.length) throw new Error('探す語を入れてください（例: search sword）')
    const hits = search(atlas, pos, { subjectOnly: !!opt.subject })
    const shown = hits.slice(0, limit)
    const caps = atlas.captions()
    const subs = atlas.subjects()
    if (opt.json) {
      console.log(
        JSON.stringify(
          shown.map((i) => ({ id: atlas.originalId(i), subject: subs[i], caption: caps[i] })),
          null,
          2,
        ),
      )
    } else {
      for (const i of shown) console.log(`${atlas.originalId(i)}\t${subs[i]}\t${caps[i]}`)
    }
    process.stderr.write(
      `${hits.length.toLocaleString()} 件見つかりました（${shown.length} 件を表示）\n`,
    )
    return
  }

  if (cmd === 'png' || cmd === 'random') {
    let ids
    if (cmd === 'random') {
      const pool = pos.length ? search(atlas, pos) : null
      if (pool && !pool.length) throw new Error('該当する絵がありません')
      ids = [
        pool
          ? pool[Math.floor(Math.random() * pool.length)]
          : Math.floor(Math.random() * atlas.count),
      ]
    } else {
      ids = pos.map(Number)
      if (!ids.length || ids.some((n) => !Number.isInteger(n)))
        throw new Error('番号を入れてください（例: png 12 34）')
      ids = ids.map((n) => atlas.resolve(n))
    }
    const scale = Number(opt.scale ?? 8)
    const outDir = path.resolve(opt.out ?? '.')
    fs.mkdirSync(outDir, { recursive: true })
    const subs = atlas.subjects()
    for (const id of ids) {
      const safe = subs[id].replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
      const file = path.join(outDir, `${atlas.originalId(id)}-${safe}.png`)
      fs.writeFileSync(file, composeSheet(atlas, [id], { scale, cols: 1 }))
      console.log(file)
    }
    return
  }

  if (cmd === 'sheet') {
    if (!pos.length) throw new Error('探す語を入れてください（例: sheet potion）')
    const hits = search(atlas, pos, { subjectOnly: !!opt.subject }).slice(0, limit)
    if (!hits.length) throw new Error('該当する絵がありません')
    const file = path.resolve(opt.out ?? `${pos.join('-')}-sheet.png`)
    const scale = Number(opt.scale ?? 4)
    fs.writeFileSync(
      file,
      composeSheet(atlas, hits, {
        scale,
        gap: scale * 2,
        cols: opt.cols ? Number(opt.cols) : undefined,
      }),
    )
    console.log(file)
    process.stderr.write(`${hits.length} 枚を並べました\n`)
    return
  }

  if (cmd === 'build-sample') {
    console.log(`見本を作りました: ${buildSample(atlas)} 種類`)
    return
  }

  throw new Error(`知らない命令です: ${cmd}（help で一覧を表示）`)
}

main().catch((e) => {
  process.stderr.write(`エラー: ${e.message}\n`)
  process.exit(1)
})
