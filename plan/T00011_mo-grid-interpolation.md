# T00011 分子軌道等値面のグリッド補間による滑らか化

## 概要

3Dmol.js は cube ファイルのボクセルデータをそのまま marching cubes に渡すため、
グリッド間隔が粗いと等値面がガタガタに見える。
cube ファイルの値を三重線形補間（trilinear interpolation）で 2 倍細かいグリッドに
拡張してから 3Dmol.js に渡し、視覚的に滑らかな等値面を実現する。

## 変更内容

### `src/utils/interpolateCube.ts`（新規）

- `interpolateCube(rawText, factor)` 関数
- cube ヘッダー（グリッド点数・軸ベクトル）を解析してボクセル値を読み込む
- 新グリッド: 各軸のグリッド点数を `factor` 倍、軸ベクトルを `1/factor` 倍
- 三重線形補間で新グリッド全点の値を計算
- cube フォーマットで再シリアライズして返す

### `src/components/MoleculeViewer.tsx`

- `Props` に `gridFactor: number` を追加
- `addIsosurfaces` で `gridFactor > 1` のとき `interpolateCube` を適用してから `addVolumetricData` に渡す

### `src/App.tsx`

- `gridFactor` state（`1 | 2`）を追加
- Isovalue コントロール横に `[1×]` / `[2×]` トグルボタンを追加
- `<MoleculeViewer>` に `gridFactor` を渡す
