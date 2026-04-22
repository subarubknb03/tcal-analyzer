# T00013 Apply Count 収束可視化チャート

## 概要
Local Smoothing 適用時に選択した原子ペアの移動積分値が Apply Count（適用回数）の増加に伴いどのように変化するかを折れ線グラフで可視化する機能を追加する。

## 動機
Apply Count を手動で変えながら効果を確認するのは手間がかかる。1〜200 の範囲で自動的にスイープし、収束挙動を一覧できるグラフを提供することで、適切な Apply Count の選定を支援する。

## 実装方針

### 計算ロジック
- Apply Count 系列: `[1, 10, 20, 30, ..., 200]`（計21点）
- 各点で `calPattern1TI(csv.matrix, mol1.atoms, mol2.atoms, p1Weight, count, mol1.bonds, mol2.bonds)[selected.row][selected.col]` を計算
- `await new Promise(r => setTimeout(r, 0))` でUIをyieldしてからスピナー表示→計算開始

### 新規コンポーネント: `src/components/TIConvergenceChart.tsx`
- モーダルオーバーレイ（`fixed inset-0 z-50`）
- Plotly scatter（lines+markers）
- x軸: Apply Count、y軸: 移動積分値
- 現在の `p1Power` 値に縦線 shape を描画
- 右上 × ボタンで閉じる

### App.tsx の変更
- state追加: `convergenceData`, `convergenceLoading`
- ハンドラ追加: `handleRunConvergence`
- Apply Count 入力欄右にボタン配置（スピナー or チャートアイコン）
- 原子ペア未選択時はボタン disabled

## 変更ファイル
| ファイル | 変更 |
|---|---|
| `src/App.tsx` | state・ハンドラ・ボタン・モーダル追加 |
| `src/components/TIConvergenceChart.tsx` | 新規作成 |
