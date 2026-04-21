import type { ParsedMolecule } from '../types';

export function parseGjf(text: string): ParsedMolecule {
  const lines = text.split('\n');
  const atoms: ParsedMolecule['atoms'] = [];

  let chargeMultiplicityFound = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('--Link1--')) break;
    if (trimmed.startsWith('%') || trimmed.startsWith('#')) continue;

    if (!chargeMultiplicityFound) {
      if (/^-?\d+\s+-?\d+$/.test(trimmed)) {
        chargeMultiplicityFound = true;
      }
      continue;
    }

    // atom line: Symbol  x  y  z
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 4) {
      const [symbol, xs, ys, zs] = parts;
      const x = parseFloat(xs);
      const y = parseFloat(ys);
      const z = parseFloat(zs);
      if (/^[A-Za-z]+$/.test(symbol) && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({ symbol, x, y, z });
      }
    }
  }

  return { atoms };
}
