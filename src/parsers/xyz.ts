import type { ParsedMolecule } from '../types';

export function parseXyz(text: string): ParsedMolecule {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const atoms: ParsedMolecule['atoms'] = [];

  // line 0: atom count, line 1: comment, line 2+: atoms
  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length >= 4) {
      const [symbol, xs, ys, zs] = parts;
      const x = parseFloat(xs);
      const y = parseFloat(ys);
      const z = parseFloat(zs);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({ symbol, x, y, z });
      }
    }
  }

  return { atoms };
}
