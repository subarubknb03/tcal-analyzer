import type { Atom, ParsedCube } from '../types';

const ELEMENT_SYMBOLS: Record<number, string> = {
  1: 'H',  2: 'He', 3: 'Li', 4: 'Be', 5: 'B',  6: 'C',  7: 'N',  8: 'O',
  9: 'F',  10: 'Ne',11: 'Na',12: 'Mg',13: 'Al',14: 'Si',15: 'P', 16: 'S',
  17: 'Cl',18: 'Ar',19: 'K', 20: 'Ca',21: 'Sc',22: 'Ti',23: 'V', 24: 'Cr',
  25: 'Mn',26: 'Fe',27: 'Co',28: 'Ni',29: 'Cu',30: 'Zn',31: 'Ga',32: 'Ge',
  33: 'As',34: 'Se',35: 'Br',36: 'Kr',
};

const BOHR_TO_ANGSTROM = 0.529177;

export function parseCube(text: string): ParsedCube {
  const lines = text.split(/\r?\n/);
  // lines 0,1: comments
  // line 2: natoms ox oy oz [nval]
  const line2 = lines[2].trim().split(/\s+/).map(Number);
  const natomsRaw = line2[0];
  const natoms = Math.abs(natomsRaw);

  // lines 3-5: grid axes — n vx vy vz
  const nx = parseInt(lines[3].trim().split(/\s+/)[0], 10);
  const inBohr = nx > 0;
  const scale = inBohr ? BOHR_TO_ANGSTROM : 1.0;

  const atoms: Atom[] = [];
  for (let i = 0; i < natoms; i++) {
    const parts = lines[6 + i].trim().split(/\s+/).map(Number);
    const atomicNum = parts[0];
    atoms.push({
      symbol: ELEMENT_SYMBOLS[atomicNum] ?? 'X',
      x: parts[2] * scale,
      y: parts[3] * scale,
      z: parts[4] * scale,
    });
  }

  return { atoms, rawText: text };
}
