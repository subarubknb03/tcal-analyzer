export interface Atom {
  symbol: string;
  x: number;
  y: number;
  z: number;
}

export interface ParsedMolecule {
  atoms: Atom[];
  bonds?: number[][];
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
