export function matMul(A: number[][], B: number[][]): number[][] {
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

export function matPow(M: number[][], n: number): number[][] {
  const size = M.length;
  if (n === 0) return Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => i === j ? 1 : 0));
  if (n === 1) return M.map(row => [...row]);
  let result = M.map(row => [...row]);
  for (let i = 1; i < n; i++) result = matMul(result, M);
  return result;
}
