# T00010 モノマー1ファイル分割機能

## 概要

Monomer1 または Monomer2 のどちらか一方だけにファイルがロードされている場合、
そのファイルを前半（Monomer1）・後半（Monomer2）に分割してセットする機能を追加する。

## 変更内容

### `src/components/FileUpload.tsx`

- `Props` に `mol1?: ParsedMolecule | null` と `mol2?: ParsedMolecule | null` を追加
- `splitMolecule(mol, n)` ピュア関数を追加（原子配列と bonds 行列をスライス）
- `splitCount: number | null` 状態を追加（null = デフォルト値 = 総原子数 / 2）
- `handleMol` 内で新ファイルロード時に `setSplitCount(null)` でリセット
- `handleSplit` 関数を追加
- ⇄ ボタンカラムを `flex flex-col` 縦積みに変更し、片方のみロード済みかつ原子数 ≥ 2 のとき：
  - 数値 input（Monomer1 の原子数）
  - `/{totalAtoms}` テキスト
  - 「分割」ボタン
  を表示

### `src/App.tsx`

- `<FileUpload>` に `mol1={mol1}` と `mol2={mol2}` を追加

## 動作

1. 片方のスロットにファイルをロード
2. ⇄ ボタン下に数値 input（デフォルト: 総原子数 / 2）と「分割」ボタンが出現
3. 分割後は両スロットがロード済みになり、ファイル名に `(1–N)` / `(N+1–total)` が付く
4. bonds を持つ .mol ファイルの場合、隣接行列も前半/後半にスライスされる
