# T00005: MOLファイル読み込み対応

## 目的

`.mol`（MDL MOL V2000）形式のファイルを分子ファイルとして読み込めるようにする。
MOLファイル読み込み時は距離ベースの結合自動判定を行わず、ファイルに記載された結合情報を直接使用する。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `ParsedMolecule` に `bonds?` と `rawMolText?` を追加 |
| `src/parsers/mol.ts` | 新規作成（MOL V2000パーサー） |
| `src/utils/localCancelTI.ts` | `calLocalCancelTI` に隣接行列オプション引数を追加 |
| `src/components/FileUpload.tsx` | `.mol` 拡張子対応 |
| `src/App.tsx` | `bonds` を `calLocalCancelTI` に渡す |
| `src/components/MoleculeViewer.tsx` | MOLファイル時は `sdf` 形式で3Dmolに渡す |

## MOL V2000 フォーマット概要

```
<分子名>               ← 1行目（無視）
  --CCDC--...         ← 2行目（無視）
                      ← 3行目（無視）
 30 32  0  0...V2000  ← カウンツ行（原子数・結合数）
  x      y      z  Symbol  ← 原子ブロック（原子数分）
111 222 ttt            ← 結合ブロック（1始まりインデックス）
M  END
$$$$
```
