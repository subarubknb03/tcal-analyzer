# T00014 Substructure Analysis 機能の追加

## 背景・目的

現状、移動積分ヒートマップでは mol1 の 1 原子と mol2 の 1 原子のペアしか選択できない。
Substructure Analysis 機能では、mol1・mol2 それぞれから複数の原子を選択し、
その間の全ての原子間移動積分を合計した「サブ構造 TI」を計算・可視化する。

## 実装方針

- **原子選択**: Substructure Mode トグル ON 時、3D ビューアで原子をクリックすることで
  mol1・mol2 それぞれの選択集合にトグル追加・削除する
- **ヒートマップ可視化**: 選択原子ペアの交差セルをグリーン半透明スクエアでハイライト
- **ステータスバー**: 合計 Substructure TI 値と選択原子数を表示

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/App.tsx` | ステート・コールバック・useMemo・UI 追加 |
| `src/components/MoleculeViewer.tsx` | 複数原子ハイライト対応 |
| `src/components/HeatmapView.tsx` | サブ行列ハイライト scatter トレース追加 |

## 主要な設計

### ステート (App.tsx)
- `substructureMode: boolean` — モードのトグル
- `subRows: Set<number>` — mol1 の選択原子インデックス集合
- `subCols: Set<number>` — mol2 の選択原子インデックス集合

### Substructure TI 計算
```
substructureTI = Σ matrix[i][j]  (i ∈ subRows, j ∈ subCols)
```

### 排他制御
- Bond Edit Mode ON 時は Substructure Mode ボタンを無効化
- Substructure Mode ON 時は Bond Edit Mode を無効化

## 検証

1. mol1・mol2・CSV 読み込み後、Substructure Mode をオン
2. 3D ビューアで mol1 から複数原子をクリック → 緑色ハイライト
3. mol2 から複数原子をクリック → 緑色ハイライト
4. ヒートマップ上の交差セルが緑マーカーで強調される
5. ステータスバーに合計 TI 値が表示される
6. 同一原子を再クリックで選択解除・値が更新される
7. Substructure Mode オフで全選択クリア
