---
description: 再現手順つきのバグ報告を受け取り、失敗するテストを書いてから直す
allowed-tools: Read, Edit, Glob, Grep, Bash(npm run test:*), Bash(npm run verify)
---

次のバグを修正してください。

$ARGUMENTS

進め方は必ずこの順番で行い、各ステップが終わるたびに一度手を止めて報告してください。

1. 原因だと思うファイルと行を特定し、なぜそうなるのかを説明する（まだ直さない）
2. `src/domain/task.test.ts` に、このバグを再現する**失敗するテスト**を追加し、
   実際に落ちることを `npm run test` で確認する
3. 実装を修正し、テストが通ることを確認する
4. `npm run verify` を実行して全体が壊れていないことを確認する
