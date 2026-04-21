# T00007 複数ファイル一括ドロップ機能

## 目的

5つのファイルを同時にドラッグ&ドロップしたとき、ファイル名に含まれる "m1"/"m2" を手がかりに各スロットへ自動割り当てする。m1/m2 が含まれない場合は空きスロットへ順番に割り当てる。

## 変更対象

- `src/components/FileUpload.tsx` のみ

## 実装内容

### DropZoneProps に `onMultipleFiles` を追加

```tsx
interface DropZoneProps {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  onMultipleFiles?: (files: File[]) => void;
  loaded: boolean;
}
```

### DropZone の handleDrop を変更

複数ファイルが渡されたとき `onMultipleFiles` を呼ぶ。

### FileUpload に `distributeFiles` 関数を追加

| 拡張子 | 行き先 |
|---|---|
| `.gjf` / `.xyz` / `.mol` | mol1 or mol2（m1/m2 で判定、なければ順番） |
| `.csv` | CSV スロット |
| `.cube` | cube1 or cube2（m1/m2 で判定、なければ順番） |

全 DropZone に `onMultipleFiles={distributeFiles}` を渡す。
