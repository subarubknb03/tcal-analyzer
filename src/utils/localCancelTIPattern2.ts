import type { Atom } from '../types';
import { buildAdjacencyMatrix } from './bondDetection';
import { matMul, matPow } from './matrixUtils';

// H1 = A_tilde * D^{-1}: column-stochastic (each column sums to 1)
// A_tilde = w*A + I (adjacency with self-loops)
function buildH1(atoms: Atom[], cancelRatio: number, precomputedAdj?: number[][]): number[][] {
  const adj = precomputedAdj ?? buildAdjacencyMatrix(atoms);
  const n = atoms.length;
  const aMod = adj.map((row, i) =>
    row.map((v, j) => cancelRatio * v + (i === j ? 1 : 0))
  );
  const d = Array.from({ length: n }, (_, j) =>
    aMod.reduce((s, row) => s + row[j], 0)
  );
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => aMod[i][j] / d[j])
  );
}

// H2 = E^{-1} * B_tilde: row-stochastic (each row sums to 1)
// B_tilde = w*A + I (adjacency with self-loops)
function buildH2(atoms: Atom[], cancelRatio: number, precomputedAdj?: number[][]): number[][] {
  const adj = precomputedAdj ?? buildAdjacencyMatrix(atoms);
  const n = atoms.length;
  const aMod = adj.map((row, i) =>
    row.map((v, j) => cancelRatio * v + (i === j ? 1 : 0))
  );
  const e = aMod.map(row => row.reduce((s, v) => s + v, 0));
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => aMod[i][j] / e[i])
  );
}

export function calPattern2TI(
  tiMatrix: number[][],
  atoms1: Atom[],
  atoms2: Atom[],
  cancelRatio: number,
  power = 1,
  bonds1?: number[][],
  bonds2?: number[][]
): number[][] {
  const filter1 = matPow(buildH1(atoms1, cancelRatio, bonds1), power);
  const filter2 = matPow(buildH2(atoms2, cancelRatio, bonds2), power);
  return matMul(matMul(filter1, tiMatrix), filter2);
}
