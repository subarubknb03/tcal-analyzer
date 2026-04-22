# T00012 パターン2の削除

## コンテキスト

局所スムージング機能には「パターン1」と「パターン2」の2種類の数学モデルが実装されている。  
パターン2を削除し、パターン1のみを残す。  
本ファイルは削除した機能の記録として保存する。

---

## 削除対象機能：パターン2（列/行確率行列フィルタ）

### 概要

パターン2は、列確率行列 $H_1$ と行確率行列 $H_2$ を構築し、Transfer Integral 行列 $U$ の左右から適用することで局所スムージングを行う手法。

### パラメータ（UI）

| パラメータ名 | UI ラベル | 範囲 | 説明 |
|---|---|---|---|
| `cancelRatio` | Neighbor Weight | 0.00〜1.00 | 隣接行列の重み係数 $w$ |
| `hPower` | Apply Count | 1〜1000 | フィルタの適用回数 $n$ |

### 数式

#### ① ボンド検出（隣接行列 $A$）

$$\operatorname{dist}(i,j) < (r_i + r_j) \times 1.15 \;\Rightarrow\; A_{ij}=1$$

$r$ は共有結合半径（Å）。

#### ② 自己ループ付き隣接行列 $\tilde{A},\,\tilde{B}$

$$\tilde{A} = w \cdot A_1 + I \qquad \tilde{B} = w \cdot A_2 + I$$

$A_1, A_2$：モノマー1・2の隣接行列。$w=0$ のときスムージング無し。

#### ③ 列和行列 $D$（$\tilde{A}$ から）と行和行列 $E$（$\tilde{B}$ から）

$$D_{jj} = \sum_{i} \tilde{A}_{ij} \qquad E_{ii} = \sum_{j} \tilde{B}_{ij}$$

#### ④ フィルタ行列 $H_1$（列確率行列）と $H_2$（行確率行列）

$$H_1 = \tilde{A}\,D^{-1} \quad \Bigl(\sum_i H_{1,ij}=1\Bigr)$$

$$H_2 = E^{-1}\tilde{B} \quad \Bigl(\sum_j H_{2,ij}=1\Bigr)$$

正規化の性質により $\sum_{ij}U'_{ij} = \sum_{ij}U_{ij}$ が保証される。

#### ⑤ スムージング済み Transfer Integral

$$U' = H_1^n \, U \, H_2^n$$

$H_1, H_2$：モノマー1・2のフィルタ行列。$n$ = Apply Count。

---

## 削除する実装

### ファイル削除

| ファイル | 対応 |
|---|---|
| `src/utils/localCancelTIPattern2.ts` | ファイルごと削除 |

#### `localCancelTIPattern2.ts` の主要関数

- `buildH1(atoms, cancelRatio, precomputedAdj?)` — $H_1$ を構築（列確率行列）
- `buildH2(atoms, cancelRatio, precomputedAdj?)` — $H_2$ を構築（行確率行列）
- `calPattern2TI(tiMatrix, atoms1, atoms2, cancelRatio, power, bonds1?, bonds2?)` — メイン計算関数

### `src/App.tsx` の変更

削除する状態変数：

```typescript
const [smoothingPattern, setSmoothingPattern] = useState<1 | 2>(1);  // 削除（常にパターン1）
const [cancelRatio, setCancelRatio] = useState(1.0);                  // 削除
const [hPower, setHPower] = useState(1);                              // 削除
```

削除する `useMemo` 内のコード（行 48）：

```typescript
// パターン2分岐を削除し、パターン1のみに
return calPattern2TI(csv.matrix, mol1.atoms, mol2.atoms, cancelRatio, hPower, mol1.bonds, mol2.bonds);
```

削除する UI コード：

- パターン選択ボタン（Pattern 1 / Pattern 2 の切り替えボタン）（行 269〜282）
- パターン2のパラメータ入力（Neighbor Weight スライダー・Apply Count 入力）（行 317〜345）
- `InfoModal` への `pattern` prop（固定で `1` にするか、prop 自体を削除）

### `src/components/InfoModal.tsx` の変更

- `Props` インターフェースから `pattern: 1 | 2` を削除
- `pattern === 2` の条件分岐とパターン2の数式セクション全体を削除（行 122〜158）
- パターン1のみの表示に固定

---

## 検証方法

1. `npm run dev` でアプリを起動
2. 「Local Smoothing」チェックボックスを有効化
3. パターン選択ボタンが表示されないことを確認
4. パターン1のパラメータ（Weight・Apply Count）が正常に動作することを確認
5. `npm run build` でビルドエラーが無いことを確認
