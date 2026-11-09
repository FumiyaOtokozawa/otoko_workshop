# ドット絵（Pixel Art Atlas 1.4M）

16×16 ピクセル・透明背景のドット絵です。全部で 1,409,404 枚、6,194 種類あります。

- 出どころ: https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m
- ライセンス: CC0 1.0（著作権を放棄。商用でも自由に使える）
- 注意: 絵は AI（Krea 2 Turbo）で作られた物です。説明文と絵が少しずれることがあります

## 保存のしかた（2段構え）

| 置き場所  | 枚数                    | 大きさ   | GitHub に保存            |
| --------- | ----------------------- | -------- | ------------------------ |
| `sample/` | 6,194 枚（各種類 1 枚） | 約 5MB   | する                     |
| `data/`   | 1,409,404 枚（全部）    | 約 800MB | しない（大きすぎるため） |

全部を手元に戻すときは、次の命令を 1 回だけ実行します（数分・約 260MB の取得）。

```bash
npm run pixel -- fetch
```

`data/` があれば全データ、無ければ `sample/` を自動で使います。

## 命令の一覧

```bash
npm run pixel -- help
```

| 命令             | やること                   | 例                                         |
| ---------------- | -------------------------- | ------------------------------------------ |
| `info`           | いま使っているデータを表示 | `npm run pixel -- info`                    |
| `subjects [語]`  | 種類の一覧                 | `npm run pixel -- subjects cat`            |
| `search <語...>` | 説明文から探す             | `npm run pixel -- search fire dragon`      |
| `png <番号...>`  | PNG で書き出す             | `npm run pixel -- png 12 34 --scale 16`    |
| `sheet <語...>`  | 並べて 1 枚に書き出す      | `npm run pixel -- sheet potion --limit 48` |
| `random [語]`    | ランダムに 1 枚            | `npm run pixel -- random slime`            |

- 探す語は英語です（例: `sword` 剣、`potion` 薬、`slime` スライム）
- `--scale 8` で拡大の倍率を決めます。ぼかさずに拡大します
- `sample/atlas.png` は見本 6,194 枚を 1 枚に並べた一覧です（80 列）

## プログラムから読むとき

`data/tokens.npy` は 1 行 256 個の色番号です。0 は透明で、それ以外は `palette.npy` の色です。
くわしい形式は `data/README.md`（取得後にできる）を見てください。
