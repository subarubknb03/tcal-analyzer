import type { ParsedCsv } from '../types';

export function parseCsv(text: string): ParsedCsv {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return { rowLabels: [], colLabels: [], matrix: [] };

  const headerCols = lines[0].split(',');
  // skip first col ("atom") and last col ("sum")
  const colLabels = headerCols.slice(1, -1);

  const rowLabels: string[] = [];
  const matrix: number[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const label = cols[0].trim();
    if (label === 'sum') continue;

    rowLabels.push(label);
    // skip first (label) and last (sum) columns
    const values = cols.slice(1, -1).map(v => parseFloat(v.trim()));
    matrix.push(values);
  }

  return { rowLabels, colLabels, matrix };
}
