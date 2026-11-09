# UI部品（Astryx）

Meta が公開している React の UI部品集です。部品 174 個、ページの型（テンプレート）768 個、テーマ 7 種があります。

- 出どころ: https://github.com/meta/astryx （公式サイト https://astryx.atmeta.com ）
- ライセンス: MIT（著作権表示を残せば、商用でも自由に使える）
- 版: 0.7.11 に固定（`package.json` と `package-lock.json`）

## 注意: アプリ本体とは別の箱です

Astryx は React 19 が必要です。アプリ本体（`src/`）は React 18 です。
そのため、このフォルダに専用の `package.json` を置いて分けています。

## はじめに 1 回だけ

```bash
npm run library:setup
```

## 呼び出し方

部品の一覧:

```bash
npm run astryx -- component --list
```

1 つの部品の説明（例: Button）:

```bash
npm run astryx -- component Button
```

キーワードで探す:

```bash
npm run astryx -- search "date picker"
```

見本ページを開く（http://localhost:5174 ）:

```bash
npm run astryx:demo
```

## 保存してある物

| 置き場所                  | 中身                                             |
| ------------------------- | ------------------------------------------------ |
| `catalog/components.json` | 部品 174 個の名前・説明・読み込み方              |
| `catalog/templates.json`  | ページの型 768 個の名前・説明                    |
| `catalog/hooks.json`      | 部品を作る補助関数（フック）の一覧               |
| `demo/`                   | 部品を並べた見本ページ。7 テーマを切り替えられる |
| `fetch-source.mjs`        | 元のコード一式を `source/` に取ってくる命令      |

元のコードを読みたいときだけ、次を実行します（約 380MB）。

```bash
node library/astryx/fetch-source.mjs
```

## 自分のプロジェクトで使うとき

```bash
npm install @astryxdesign/core@0.7.11 @astryxdesign/theme-neutral@0.7.11 @stylexjs/stylex react@19 react-dom@19
```

CSS は `reset.css` → `astryx.css` → テーマの `theme.css` の順に読み込みます。
書き方の例は `demo/main.jsx` と `demo/styles.css` を見てください。
