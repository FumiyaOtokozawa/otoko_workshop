---
description: 素材庫（ドット絵・UI部品）から素材を探して取り出す
allowed-tools: Read, Glob, Grep, Bash(npm run pixel:*), Bash(npm run astryx:*), Bash(node library/pixel-art/pixel.mjs:*)
---

ユーザーが欲しい素材を、`library/` の素材庫から探して渡してください。

- ドット絵: `npm run pixel -- help` で命令を確認してから使う
  - 探す語は英語に直す（例: 剣 → sword）
  - 見つけたら `sheet` で並べた絵を作り、画像を見せてから番号を選んでもらう
  - 書き出し先の指定がなければ `./sprites` に書き出す
- UI部品: `npm run astryx -- search <語>` と `npm run astryx -- component <名前>` を使う
  - 初回で `library/astryx/node_modules` が無ければ、先に `npm run library:setup` を実行する
- 使い方の詳細は `library/README.md` を読む

$ARGUMENTS
