# T00001: 技術選定

## Context

ダイマー計算の結果を読み込み、3D 分子構造上でモノマー1×モノマー2の原子ペア相互作用（移動積分）を可視化する公開 Web アプリを作る。

**入力ファイル:**
- Gaussian の場合: モノマー1・モノマー2 の `.gjf`（Gaussian 入力ファイル）2つ
- PySCF の場合: モノマー1・モノマー2 の `.xyz` 2つ
- 共通: tcal が出力した原子間移動積分 `.csv`

`.gjf` も `.xyz` も単純なテキスト形式、CSV も同様なので **バックエンド不要**。全処理をブラウザ内で完結できる。

## 採用技術スタック

**React + TypeScript（Vite）— フロントエンドのみ**

| ライブラリ | 用途 | 採用理由 |
|---|---|---|
| `3Dmol.js` | 3D 分子表示・原子クリック選択 | Web 分子可視化のデファクト。`setClickable()` で原子選択コールバック対応。自作は数週間コストで非合理 |
| `react-plotly.js` | 移動積分行列ヒートマップ | セルクリックイベント取得可能。科学データ向け |
| TailwindCSS | スタイリング | — |
| Vite | ビルドツール | — |

**パーサー（自前実装、外部依存なし）:**
- `gjf.ts` — テキスト行をスキャンして原子記号・座標を抽出
- `xyz.ts` — 3行目以降を行ごとにパース
- `csv.ts` — 移動積分行列を2次元配列に変換

**デプロイ先:** Vercel（静的サイト）

## アーキテクチャ

```
ブラウザのみで完結
  │
  ├─ FileUpload UI
  │    ├─ モノマー1（.gjf or .xyz）
  │    ├─ モノマー2（.gjf or .xyz）
  │    └─ 移動積分 CSV
  │
  ├─ パーサー（TypeScript）
  │    ├─ parseGjf()  → { atoms: [{symbol, x, y, z}] }
  │    ├─ parseXyz()  → { atoms: [{symbol, x, y, z}] }
  │    └─ parseCsv()  → number[][]
  │
  ├─ MoleculeViewer（3Dmol.js）
  │    └─ ダイマー 3D 表示・原子クリック → 移動積分値ハイライト
  │
  └─ HeatmapView（react-plotly.js）
       └─ 行: m1 原子、列: m2 原子、値: 移動積分 / セルクリック → 原子ペアハイライト
```

## 主要ファイル構成（予定）

```
tcal-analyzer/
├── src/
│   ├── components/
│   │   ├── MoleculeViewer.tsx
│   │   ├── HeatmapView.tsx
│   │   └── FileUpload.tsx
│   ├── parsers/
│   │   ├── gjf.ts
│   │   ├── xyz.ts
│   │   └── csv.ts
│   └── App.tsx
├── package.json
├── vite.config.ts
├── test/
└── plan/
```

## 代替案（却下理由）

| 案 | 却下理由 |
|---|---|
| FastAPI バックエンド追加 | .gjf / .xyz / CSV は全てテキスト形式なので不要 |
| 3Dmol.js の代わりに自作 | カメラ制御・レイキャスティング等で数週間コスト。今回の主目的は移動積分可視化 |
| Streamlit | py3Dmol での原子選択コールバックが困難 |
| Next.js | 静的サイトで十分なため過剰 |

## 検証方法

1. `test/` の Anthracene `.gjf` or `.xyz` をアップロードし、3D 構造が正しく表示されることを確認
2. tcal CSV をアップロードし、ヒートマップに正しい行列が表示されることを確認
3. ヒートマップのセルクリック → 対応する原子ペアが 3D 上でハイライトされることを確認
4. Gaussian / PySCF 両方の入力形式で動作することを確認
