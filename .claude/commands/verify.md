---
description: format / typecheck / test / build をまとめて実行し、失敗したら直す
allowed-tools: Bash(npm run verify), Bash(npm run test:*), Bash(npm run format), Read, Edit
---

`npm run verify` を実行してください。

- 通ったら、何を確認したのかを3行以内で報告してください。
- 失敗したら、失敗した理由を先に1文で説明してから修正し、もう一度 `npm run verify` を実行してください。
- テストを削除・スキップして通すことは禁止です。実装のほうを直してください。
