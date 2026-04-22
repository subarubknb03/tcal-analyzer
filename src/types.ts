export interface Atom {
  symbol: string;
  x: number;
  y: number;
  z: number;
}

export interface ParsedMolecule {
  atoms: Atom[];
  bonds?: number[][];       // 0/1 の隣接行列（smoothing 用）
  bondOrders?: number[][];  // 表示・シリアライズ用の結合次数行列（0-3）
  rawMolText?: string;
}

export interface ParsedCsv {
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
}

export interface SelectedPair {
  row: number;
  col: number;
}

export interface ParsedCube {
  atoms: Atom[];
  rawText: string;
}
