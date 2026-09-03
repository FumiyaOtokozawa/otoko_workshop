#!/usr/bin/env node
/**
 * ワークショップ当日までに環境が整っているかを確認するスクリプト。
 *   npm run doctor
 * 全部 OK になった状態のスクリーンショットを、前日までに運営へ送ってください。
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'

const results = []

async function check(name, fn, hint) {
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail: detail ?? '' })
  } catch (error) {
    results.push({ name, ok: false, detail: error.message, hint })
  }
}

function sh(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim()
}

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', () => reject(new Error(`ポート ${port} は使用中です`)))
    server.once('listening', () => server.close(() => resolve('OK')))
    server.listen(port, '127.0.0.1')
  })
}

await check(
  'Node.js のバージョンが 20 以上',
  () => {
    const major = Number(process.versions.node.split('.')[0])
    if (major < 20) throw new Error(`v${process.versions.node} です`)
    return `v${process.versions.node}`
  },
  'https://nodejs.org から LTS 版を入れ直してください（nvm 利用者は `nvm install --lts`）',
)

await check('git が使える', () => sh('git --version'), 'git をインストールしてください')

await check(
  'git のユーザー名とメールが設定済み',
  () => {
    const name = sh('git config user.name')
    const email = sh('git config user.email')
    if (!name || !email) throw new Error('未設定です')
    return `${name} <${email}>`
  },
  'git config --global user.name "名前" / git config --global user.email "会社メール"',
)

await check(
  'node_modules がインストール済み',
  () => {
    if (!existsSync(new URL('../node_modules/vite', import.meta.url))) {
      throw new Error('見つかりません')
    }
    return 'OK'
  },
  'リポジトリのルートで `npm install` を実行してください',
)

await check(
  'テストが通る',
  () => {
    sh('npm run test --silent')
    return 'OK'
  },
  'npm install をやり直してから、もう一度 npm run doctor を実行してください',
)

await check(
  'claude コマンドが使える',
  () => sh('claude --version'),
  'npm install -g @anthropic-ai/claude-code を実行し、`claude` を起動してログインしてください',
)

await check(
  'ポート 5173 が空いている',
  () => isPortFree(5173),
  '5173 番を使っている他のアプリを終了してください',
)

let failed = 0
console.log('\n=== Otoko Board 環境チェック ===\n')
for (const r of results) {
  console.log(`${r.ok ? '  OK  ' : ' NG   '} ${r.name}${r.detail ? ` … ${r.detail}` : ''}`)
  if (!r.ok) {
    failed += 1
    if (r.hint) console.log(`        → ${r.hint}`)
  }
}
console.log('')

if (failed === 0) {
  console.log('すべて OK です。この画面のスクリーンショットを運営に送ってください。\n')
} else {
  console.log(`${failed} 件の問題があります。上の → の手順を試して、もう一度実行してください。`)
  console.log('解決しない場合は、この画面をそのまま運営チャンネルに貼ってください。\n')
  process.exitCode = 1
}
