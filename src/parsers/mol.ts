import type { ParsedMolecule } from '../types';

export function parseMol(text: string): ParsedMolecule {
  const lines = text.split(/\r?\n/);

  const countsIdx = lines.findIndex(l => l.includes('V2000'));
  if (countsIdx === -1) throw new Error('MOL V2000 counts line not found');

  const countParts = lines[countsIdx].trim().split(/\s+/);
  const nAtoms = parseInt(countParts[0], 10);
  const nBonds = parseInt(countParts[1], 10);

  const atoms: ParsedMolecule['atoms'] = [];
  for (let i = 0; i < nAtoms; i++) {
    const p = lines[countsIdx + 1 + i].trim().split(/\s+/);
    atoms.push({ x: parseFloat(p[0]), y: parseFloat(p[1]), z: parseFloat(p[2]), symbol: p[3] });
  }

  const adj: number[][] = Array.from({ length: nAtoms }, () => new Array(nAtoms).fill(0));
  const bondStart = countsIdx + 1 + nAtoms;
  for (let i = 0; i < nBonds; i++) {
    const p = lines[bondStart + i].trim().split(/\s+/);
    const a = parseInt(p[0], 10) - 1;
    const b = parseInt(p[1], 10) - 1;
    adj[a][b] = 1;
    adj[b][a] = 1;
  }

  return { atoms, bonds: adj, rawMolText: text };
}
