# T00009 Local Smoothing Pattern 1 追加

## 概要

既存の Local Smoothing（確率行列フィルタ方式）を **Pattern 2** として保持しつつ、ラプラシアン拡散に基づく **Pattern 1** を新規追加する。Pattern 1 は $w$ を小さく $n$ を大きくした極限でガウスぼかしに収束し、Apply Count を大きくするとヒートマップが均一値（分子間移動積分 / 原子数）へ収束する。

## 変更内容

### 新規作成

- `src/utils/matrixUtils.ts` — `matMul`, `matPow` の共有ユーティリティ（両パターンで使用）
- `src/utils/localCancelTIPattern1.ts` — Pattern 1 の計算実装

### 改名・変更

- `src/utils/localCancelTI.ts` → 削除
- `src/utils/localCancelTIPattern2.ts` — Pattern 2（旧実装の改名）。エクスポート名を `calPattern2TI` に変更
- `src/App.tsx` — パターン選択 UI・各パターンの状態管理を追加
- `src/components/InfoModal.tsx` — `pattern: 1 | 2` prop を追加し、選択中のパターンの数式を表示

## Pattern 1 アルゴリズム

$$
\tilde{A}_{ij} = \begin{cases} 1 - \sum_{k \neq i} w A_{ki} & (i = j) \\ w A_{ij} & (i \neq j) \end{cases}
$$

$$
\tilde{B}_{ij} = \begin{cases} 1 - \sum_{k \neq i} w B_{ik} & (i = j) \\ w B_{ij} & (i \neq j) \end{cases}
$$

$$U' = \tilde{A}^n U \tilde{B}^n$$

- $\tilde{A}$ は各列の和 = 1（column-stochastic）
- $\tilde{B}$ は各行の和 = 1（row-stochastic）
- $\tilde{A} = I - wL_A$（$L_A$: グラフラプラシアン）に相当
- $wn \approx 1$ で隣接1つ分、$wn \approx 2$ で隣接2つ分のぼかし

## UI 構造

```
[i] [Local Smoothing toggle] [Pattern 1 | Pattern 2] [パターン別パラメータ]
```

- Pattern 1 パラメータ: `Weight w`（0〜0.5, デフォルト 0.01）、`Apply Count`（1〜1000, デフォルト 10）
- Pattern 2 パラメータ: `Neighbor Weight`（スライダー 0〜1）、`Apply Count`（1〜1000）

各パターンのコードは `// --- Pattern N --- ... // --- End Pattern N ---` で囲み、将来の削除を容易にしている。
