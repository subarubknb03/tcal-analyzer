# T00004 局所ぼかし考慮の原子間移動積分ヒートマップ

## 概要

`cal_local_cancel_ti` アルゴリズム（Pythonスクリプト参照）をWebアプリに移植する。
GJF/XYZ由来の原子座標から共有結合半径で隣接行列を生成し、
グラフ正規化フィルタで移動積分行列をスムージングする機能を追加する。

## アルゴリズム

```
adj[i,j] = 1  (共有結合判定: 原子間距離 < (r_i + r_j) * 1.15)
A_mod     = cancel_ratio * adj + I
D[i,i]    = sum(A_mod[i,:])
filter    = D^{-1/2} @ A_mod @ D^{-1/2}
            = A_mod[i][j] / sqrt(D[i][i] * D[j][j])  (簡略形)

local_cancel_ti = filter1 @ ti_matrix @ filter2
```

## 実装ファイル

- `src/utils/bondDetection.ts` (新規) — 共有結合半径テーブル + 隣接行列生成
- `src/utils/localCancelTI.ts` (新規) — フィルタ計算・行列積
- `src/App.tsx` (変更) — state追加、useMemo、コントロールUI
- `src/components/HeatmapView.tsx` (変更) — `displayMatrix` prop追加

## UI

- トグル: 局所ぼかしON/OFF
- スライダー: cancel_ratio 0〜1 (初期値: 1.0)、トグルON時のみ表示
