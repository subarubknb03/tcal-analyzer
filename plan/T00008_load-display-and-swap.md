# T00008: ファイル読み込み表示 + Monomer/Cube 入れ替え機能

## 目的

1. 各スロットに読み込んだファイル名を表示する
2. Monomer1/2 および Cube1/2 を UI で入れ替えられるボタン（⇄）を追加する

## 変更ファイル

- `src/components/FileUpload.tsx`
- `src/App.tsx`

## 主な変更内容

### `App.tsx`
- `swapMonomers()`: `mol1`/`mol2` state を入れ替え
- `swapCubes()`: `cube1`/`cube2` state を入れ替え
- `FileUpload` props に `onSwapMonomers` / `onSwapCubes` を追加

### `FileUpload.tsx`
- ファイル名 state を追加（`mol1FileName` など）
- `handleMol` / `handleCube` に `setFileName` 引数を追加
- `DropZone` に `fileName` props を追加してファイル名を表示
- `handleSwapMonomers` / `handleSwapCubes` で内部表示状態と App.tsx データを同時入れ替え
- レイアウトを `grid-cols-3` から `flex` に変更し、⇄ ボタンを Monomer1/2 間と Cube1/2 間に配置
