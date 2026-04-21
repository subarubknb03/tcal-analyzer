# T00003 cubeファイル読み込みと分子軌道等値面可視化

## 概要

Gaussian cube ファイル (`.cube`) を読み込み、分子軌道の等値面を 3D ビューワーに描画する機能を追加する。

## 要件

- 等値面の等値: ±0.02（デフォルト、UI から変更可）
- 正の等値面の色: RGB(0,65,255) = `#0041ff`
- 負の等値面の色: RGB(255,245,0) = `#fff500`

## 等値面の UI 操作

cube ファイル読み込み後、3D ビューワー右上に数値入力を表示する。

- `App.tsx` に `isovalue` state (初期値 `0.02`) を追加
- cube がある場合のみ入力欄を表示 (`cube1 || cube2`)
- 値変更時に `MoleculeViewer` が等値面を再描画 (`isovalue` を useEffect の依存配列に含める)
- 入力欄の範囲: `min=0.001 max=1 step=0.005`

## 変更ファイル

| ファイル | 内容 |
|---|---|
| `src/types.ts` | `ParsedCube` 型を追加 |
| `src/parsers/cube.ts` | cube ファイルパーサを新規作成 |
| `src/components/FileUpload.tsx` | cube 用 DropZone を追加 (2行目) |
| `src/App.tsx` | `cube1` / `cube2` state を追加し MoleculeViewer に渡す |
| `src/components/MoleculeViewer.tsx` | `addVolumetricData` で等値面を描画 |

## cubeファイル形式とパーサの方針

- 行1-2: コメント行
- 行3: `natoms ox oy oz` (natoms 負 → 原子行後に MO 情報行あり)
- 行4-6: 格子軸定義 (`n vx vy vz`、n>0 なら Bohr 単位)
- 行7+: 原子情報 (`atomic_num charge x y z`、Bohr→Å 変換: ×0.529177)
- 等値面描画は 3Dmol.js の `addVolumetricData(rawText, 'cube', {isoval, color, opacity})` で実施
