import { useRef } from 'react';
import PlotModule from 'react-plotly.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot: any = (PlotModule as any).default ?? PlotModule;

interface Props {
  data: { counts: number[]; values: number[] };
  selectedLabel: string;
  onClose: () => void;
}

export function TIConvergenceChart({ data, selectedLabel, onClose }: Props) {
  const graphDivRef = useRef<HTMLElement | null>(null);

  const handleDownload = () => {
    graphDivRef.current?.querySelector<HTMLElement>('.modebar-btn')?.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: 640, maxWidth: '95vw' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <div className="text-sm font-semibold text-slate-800">Apply Count vs Interatomic Transfer Integral</div>
            <div className="text-xs text-slate-400 mt-0.5">{selectedLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="PNG でダウンロード"
              title="PNG でダウンロード"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="閉じる"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div id="ti-convergence-plot" className="p-4">
          <style>{`#ti-convergence-plot .modebar-container { display: none !important; }`}</style>
          <Plot
            data={[
              {
                x: data.counts,
                y: data.values,
                type: 'scatter',
                mode: 'lines+markers',
                marker: { color: '#3b82f6', size: 6 },
                line: { color: '#3b82f6', width: 2 },
                name: 'Interatomic Transfer Integral (meV)',
              },
            ]}
            layout={{
              width: 592,
              height: 360,
              margin: { l: 80, r: 20, t: 20, b: 100 },
              xaxis: { title: { text: 'Apply Count', standoff: 20 }, tickmode: 'array', tickvals: data.counts, ticktext: data.counts.map(String), tickangle: -45 },
              yaxis: { title: { text: 'Interatomic Transfer Integral (meV)' } },
              showlegend: false,
              plot_bgcolor: '#f8fafc',
              paper_bgcolor: '#ffffff',
            }}
            config={{
              displayModeBar: true,
              modeBarButtons: [['toImage']],
              toImageButtonOptions: { format: 'png', filename: 'ti_convergence', width: 800, height: 480, scale: 2 },
            }}
            onInitialized={(_figure: unknown, graphDiv: HTMLElement) => { graphDivRef.current = graphDiv; }}
            onUpdate={(_figure: unknown, graphDiv: HTMLElement) => { graphDivRef.current = graphDiv; }}
          />
        </div>
      </div>
    </div>
  );
}
