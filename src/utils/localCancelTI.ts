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

// H1 = A * D^{-1}: column-stochastic (each column sums to 1)
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

// H2 = E^{-1} * B: row-stochastic (each row sums to 1)
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
  const filter1 = matPow(buildH1(atoms1, cancelRatio, bonds1), power);
  const filter2 = matPow(buildH2(atoms2, cancelRatio, bonds2), power);
  return matMul(matMul(filter1, tiMatrix), filter2);
}
