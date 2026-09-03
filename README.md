# Otoko Board — AI 開発ワークショップ用リポジトリ

社内ワークショップ「AI と一緒に作る1日」で使うリポジトリです。
小さなタスクボードアプリ（React + TypeScript + Vite）が最初から動く状態で入っています。

参加者はこのリポジトリからブランチを切り、**Claude Code に機能をひとつ追加してもらい、
自分でレビューして PR を出す**ところまでを1日で体験します。

## まずやること（参加者）

1. [docs/03-prep.md](docs/03-prep.md) の事前準備を、**開催前日までに**終わらせる
2. 当日は [docs/04-handson.md](docs/04-handson.md) を開きながら進める

```bash
git clone https://github.com/FumiyaOtokozawa/otoko_workshop.git
cd otoko_workshop
npm install
npm run doctor   # 環境チェック。すべて OK になれば準備完了
npm run dev      # http://localhost:5173
```

## ドキュメント

| ファイル                                         | 誰向け | 内容                                           |
| ------------------------------------------------ | ------ | ---------------------------------------------- |
| [docs/00-design.md](docs/00-design.md)           | 運営   | 設計思想と、想定される事故への打ち手           |
| [docs/01-timetable.md](docs/01-timetable.md)     | 運営   | タイムテーブルと進行台本                       |
| [docs/02-facilitator.md](docs/02-facilitator.md) | 運営   | 役割分担・事前準備チェックリスト・トラブル対応 |
| [docs/03-prep.md](docs/03-prep.md)               | 参加者 | 事前準備（前日まで）                           |
| [docs/04-handson.md](docs/04-handson.md)         | 参加者 | 当日のハンドアウト（Level 1〜5）               |
| [docs/05-issues.md](docs/05-issues.md)           | 運営   | 課題カタログ（Issue の原稿）                   |
| [docs/06-cost.md](docs/06-cost.md)               | 運営   | 利用形態の比較・コスト見積・利用上限の運用     |
| [docs/07-worksheet.md](docs/07-worksheet.md)     | 参加者 | 観察カード（AI の待ち時間に埋める）            |

## 開発コマンド

| コマンド         | 用途                                             |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | 開発サーバー起動                                 |
| `npm run test`   | テスト実行                                       |
| `npm run verify` | format + typecheck + test + build（PR 前に必ず） |
| `npm run doctor` | 環境チェック                                     |
