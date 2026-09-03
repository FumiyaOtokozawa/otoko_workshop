# Otoko Board

社内ワークショップ用の小さなタスクボード（React + TypeScript + Vite）。

## 構成

- `src/domain/` … 純粋なドメインロジック。React も localStorage も import しない。
- `src/ui/` … React コンポーネント。状態は `App.tsx` が持ち、子は props で受け取る。
- `src/storage.ts` … localStorage の読み書き。読み込み時は必ず型を検証する。

## 変更するときのルール

- ロジックは `src/domain/` に置き、UI からはそれを呼ぶだけにする。
- `src/domain/` に関数を足したら、同じ名前の `*.test.ts` にテストも足す。
- 実装が終わったら必ず `npm run verify` を実行し、通るまで直してから報告する。
- 既存のテストを消したり `skip` したりして通すのは禁止。

## よく使うコマンド

| コマンド         | 用途                                             |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | 開発サーバーを起動（http://localhost:5173）      |
| `npm run test`   | テストを1回だけ実行                              |
| `npm run verify` | format + typecheck + test + build をまとめて実行 |

<!--
ここから下は、ワークショップの Level 5 であなた自身が育てていくエリアです。
「毎回言っているのに毎回守られないこと」を見つけたら、ここに1行足してください。
-->

## このリポジトリ固有のメモ
