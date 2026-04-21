import PlotModule from 'react-plotly.js';
// Vite/Rolldown CJS→ESM 変換で default が二重にネストされる場合を吸収する
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot: any = (PlotModule as any).default ?? PlotModule;
import type { ParsedCsv, SelectedPair } from '../types';

interface Props {
  csv: ParsedCsv | null;
  selectedPair: SelectedPair | null;
  onCellClick: (row: number, col: number) => void;
}

export function HeatmapView({ csv, selectedPair, onCellClick }: Props) {
  if (!csv) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Upload a CSV to display the transfer integral heatmap
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotData: any[] = [
    {
      type: 'heatmap',
      z: csv.matrix,
      x: csv.colLabels,
      y: csv.rowLabels,
      colorscale: 'RdBu',
      zmid: 0,
      hovertemplate: 'm1: %{y}<br>m2: %{x}<br>Value: %{z:.4f}<extra></extra>',
    },
  ];

  if (selectedPair !== null) {
    plotData.push({
      type: 'scatter',
      x: [csv.colLabels[selectedPair.col]],
      y: [csv.rowLabels[selectedPair.row]],
      mode: 'markers',
      marker: { symbol: 'square-open', size: 18, color: '#facc15', line: { width: 3 } },
      showlegend: false,
      hoverinfo: 'skip',
    });
  }

  return (
    <Plot
      data={plotData}
      layout={{
        margin: { t: 30, r: 20, b: 100, l: 80 },
        xaxis: { title: { text: 'Monomer 2 Atom' }, tickangle: -45, automargin: true },
        yaxis: { title: { text: 'Monomer 1 Atom' }, autorange: 'reversed', automargin: true },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#1e293b', size: 11 },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: '100%', height: '100%' }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick={(data: any) => {
        const pt = data.points[0];
        if (pt && pt.curveNumber === 0) {
          const row = csv.rowLabels.indexOf(pt.y as string);
          const col = csv.colLabels.indexOf(pt.x as string);
          if (row >= 0 && col >= 0) onCellClick(row, col);
        }
      }}
    />
  );
}
