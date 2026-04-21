import type { Atom } from '../types';

const COVALENT_RADII: Record<string, number> = {
  H: 0.31, He: 0.28,
  Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
  Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06,
  K: 2.03, Ca: 1.76, Sc: 1.70, Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.61, Fe: 1.52,
  Co: 1.50, Ni: 1.24, Cu: 1.32, Zn: 1.22, Ga: 1.22, Ge: 1.20, As: 1.19,
  Se: 1.20, Br: 1.20, Kr: 1.16,
  Rb: 2.20, Sr: 1.95, Y: 1.90, Zr: 1.75, Nb: 1.64, Mo: 1.54, Tc: 1.47,
  Ru: 1.46, Rh: 1.42, Pd: 1.39, Ag: 1.45, Cd: 1.44, In: 1.42, Sn: 1.39,
  Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.40,
};

const DEFAULT_RADIUS = 1.50;
const BOND_TOLERANCE = 1.15;

export function buildAdjacencyMatrix(atoms: Atom[]): number[][] {
  const n = atoms.length;
  const adj = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const ri = COVALENT_RADII[atoms[i].symbol] ?? DEFAULT_RADIUS;
      const rj = COVALENT_RADII[atoms[j].symbol] ?? DEFAULT_RADIUS;
      if (dist < (ri + rj) * BOND_TOLERANCE) {
        adj[i][j] = 1;
        adj[j][i] = 1;
      }
    }
  }

  return adj;
}
