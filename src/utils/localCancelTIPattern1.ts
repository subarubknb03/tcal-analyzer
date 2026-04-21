import type { Atom } from '../types';
import { buildAdjacencyMatrix } from './bondDetection';
import { matMul, matPow } from './matrixUtils';

// A_tilde: column-stochastic (each column sums to 1)
// Diagonal: 1 - w * (column sum of A)
// Off-diagonal: w * A[i][j]
function buildAtilde(atoms: Atom[], w: number, precomputedAdj?: number[][]): number[][] {
  const adj = precomputedAdj ?? buildAdjacencyMatrix(atoms);
  const n = adj.length;
  const colSums = Array.from({ length: n }, (_, j) =>
    adj.reduce((s, row) => s + row[j], 0)
  );
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 1 - w * colSums[j] : w * adj[i][j]
    )
  );
}

// B_tilde: row-stochastic (each row sums to 1)
// Diagonal: 1 - w * (row sum of A)
// Off-diagonal: w * A[i][j]
function buildBtilde(atoms: Atom[], w: number, precomputedAdj?: number[][]): number[][] {
  const adj = precomputedAdj ?? buildAdjacencyMatrix(atoms);
  const n = adj.length;
  const rowSums = adj.map(row => row.reduce((s, v) => s + v, 0));
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 1 - w * rowSums[i] : w * adj[i][j]
    )
  );
}

export function calPattern1TI(
  tiMatrix: number[][],
  atoms1: Atom[],
  atoms2: Atom[],
  w: number,
  power = 1,
  bonds1?: number[][],
  bonds2?: number[][]
): number[][] {
  const filterA = matPow(buildAtilde(atoms1, w, bonds1), power);
  const filterB = matPow(buildBtilde(atoms2, w, bonds2), power);
  return matMul(matMul(filterA, tiMatrix), filterB);
}
