import type { Atom } from '../types';
import { buildAdjacencyMatrix } from './bondDetection';

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const k = B.length;
  const n = B[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let l = 0; l < k; l++) {
      if (A[i][l] === 0) continue;
      for (let j = 0; j < n; j++)
        C[i][j] += A[i][l] * B[l][j];
    }
  return C;
}

function buildFilterMatrix(atoms: Atom[], cancelRatio: number, precomputedAdj?: number[][]): number[][] {
  const adj = precomputedAdj ?? buildAdjacencyMatrix(atoms);
  const n = atoms.length;

  // A_mod = cancelRatio * adj + I
  const aMod = adj.map((row, i) =>
    row.map((v, j) => cancelRatio * v + (i === j ? 1 : 0))
  );

  // D[i] = row sum of A_mod
  const d = aMod.map(row => row.reduce((s, v) => s + v, 0));

  // filter[i][j] = A_mod[i][j] / sqrt(D[i] * D[j])
  const filter = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      aMod[i][j] / Math.sqrt(d[i] * d[j])
    )
  );

  return filter;
}

function matPow(M: number[][], n: number): number[][] {
  const size = M.length;
  if (n === 0) return Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => i === j ? 1 : 0));
  if (n === 1) return M.map(row => [...row]);
  let result = M.map(row => [...row]);
  for (let i = 1; i < n; i++) result = matMul(result, M);
  return result;
}

export function calLocalCancelTI(
  tiMatrix: number[][],
  atoms1: Atom[],
  atoms2: Atom[],
  cancelRatio: number,
  power = 1,
  bonds1?: number[][],
  bonds2?: number[][]
): number[][] {
  const filter1 = matPow(buildFilterMatrix(atoms1, cancelRatio, bonds1), power);
  const filter2 = matPow(buildFilterMatrix(atoms2, cancelRatio, bonds2), power);
  return matMul(matMul(filter1, tiMatrix), filter2);
}
