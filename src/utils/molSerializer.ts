import type { ParsedMolecule } from '../types';

export function serializeMol(mol: ParsedMolecule): string {
  const { atoms, bonds, bondOrders } = mol;
  const n = atoms.length;
  const bondList: [number, number, number][] = [];
  if (bonds) {
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (bonds[i][j] > 0) bondList.push([i + 1, j + 1, bondOrders?.[i][j] ?? bonds[i][j]]);
  }
  const fmt3 = (v: number) => v.toString().padStart(3);
  const fmtC = (v: number) => v.toFixed(4).padStart(10);
  const lines = [
    '', '', '',
    `${fmt3(n)}${fmt3(bondList.length)}  0  0  0  0  0  0  0  0999 V2000`,
    ...atoms.map(a => `${fmtC(a.x)}${fmtC(a.y)}${fmtC(a.z)} ${a.symbol.padEnd(3)} 0  0  0  0  0  0  0  0  0  0  0  0`),
    ...bondList.map(([a, b, t]) => `${fmt3(a)}${fmt3(b)}${fmt3(t)}  0  0  0  0`),
    'M  END', '$$$$', '',
  ];
  return lines.join('\n');
}
