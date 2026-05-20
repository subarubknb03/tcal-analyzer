# T00015 Substructure TI × Local Smoothing 連携機能

## 背景・目的

現状、Local Smoothing は分子全体の TI 行列（Ã^n · U · B̃^n）に適用される。
Substructure TI モードで一部の原子を選択している場合も全原子でスムージングするため、
サブ構造内での打ち消し（正負のキャンセル）を考慮したスムージング結果が得られない。

Substructure TI モード ON かつ Local Smoothing ON のとき、選択原子のみのサブ行列に
Local Smoothing を適用し、その結果をヒートマップに表示するよう改善する。

## 実装方針

`src/App.tsx` の `displayMatrix` useMemo に条件分岐を追加するのみ。

**アルゴリズム（サブ構造スムージング時）：**
1. `subRows`/`subCols` を昇順ソートして配列化
2. サブ行列を抽出：`subMatrix[i][j] = csv.matrix[rowArr[i]][colArr[j]]`
3. 選択原子リストを抽出
4. 部分結合隣接行列を抽出（`mol.bonds` が存在する場合）
5. `calPattern1TI(subMatrix, selectedAtoms1, selectedAtoms2, ...)` でスムージング
6. csv.matrix と同サイズのゼロ行列に結果を埋め戻す

非選択セルはゼロになるため、ヒートマップで選択領域のみ色が付き、
打ち消し効果が視覚的に確認できる。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/App.tsx` | `displayMatrix` useMemo に Substructure 対応の条件分岐を追加、依存配列に `substructureMode`, `subRows`, `subCols` を追加 |

## 変更不要なもの

- `src/utils/localCancelTIPattern1.ts`（シグネチャそのまま利用）
- `src/components/HeatmapView.tsx`（インタフェース変更なし）
- `src/components/MoleculeViewer.tsx`（インタフェース変更なし）
- `substructureTI` useMemo（`displayMatrix` 経由で自動的に新値を使う）

## 検証

1. mol1/mol2/csv 読み込み後、Local Smoothing ON・Substructure OFF → 従来と同じ全体スムージング
2. Substructure ON で複数原子を選択、Local Smoothing ON → 選択セルのみ色付き、非選択セルが白
3. ステータスバーの Substructure TI がサブスムージング済みの合計値に更新される
4. Substructure OFF → displayMatrix が全体スムージングに戻る
5. bonds なしの xyz ファイルでも正常動作（3D 座標ベース隣接行列のフォールバック）
