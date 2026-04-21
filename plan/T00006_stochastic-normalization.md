# T00006: H1/H2正規化の変更（列確率・行確率行列）

## 背景

分子間移動積分の総和保存条件 $\sum_{ij} U'_{ij} = \sum_{ij} U_{ij}$ を満たすため、フィルタ行列の正規化を変更する。

## 変更内容

### 旧定式化（対称正規化ラプラシアン）

$$H = \tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$$

### 新定式化（列確率・行確率）

- $\tilde{A} = w \cdot A + I$（セルフループ込み隣接行列）
- $D_{jj} = \sum_i \tilde{A}_{ij}$（列和対角行列）
- $E_{ii} = \sum_j \tilde{A}_{ij}$（行和対角行列）
- $H_1 = \tilde{A} D^{-1}$（列確率行列: $\sum_i H_{1,ij} = 1$）
- $H_2 = E^{-1} \tilde{A}$（行確率行列: $\sum_j H_{2,ij} = 1$）
- $U' = H_1^n \, U \, H_2^n$

## 変更ファイル

- `src/utils/localCancelTI.ts`: `buildFilterMatrix` を `buildH1` / `buildH2` に分割
- `src/components/InfoModal.tsx`: 数式表示を新定式化に対応
