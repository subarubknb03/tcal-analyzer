import { useCallback, useState } from 'react';
import type { ParsedMolecule, ParsedCsv, ParsedCube, SelectedPair } from './types';
import { FileUpload } from './components/FileUpload';
import { MoleculeViewer } from './components/MoleculeViewer';
import { HeatmapView } from './components/HeatmapView';

export default function App() {
  const [mol1, setMol1] = useState<ParsedMolecule | null>(null);
  const [mol2, setMol2] = useState<ParsedMolecule | null>(null);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [selected, setSelected] = useState<SelectedPair | null>(null);
  const [cube1, setCube1] = useState<ParsedCube | null>(null);
  const [cube2, setCube2] = useState<ParsedCube | null>(null);
  const [isovalue, setIsovalue] = useState(0.02);

  const handleAtomClick = useCallback((monomer: 1 | 2, atomIndex: number) => {
    setSelected(prev => {
      if (monomer === 1) return { row: atomIndex, col: prev?.col ?? 0 };
      return { row: prev?.row ?? 0, col: atomIndex };
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col gap-4 p-4">
      <header className="bg-white rounded-xl shadow px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-800">tcal analyzer</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload monomer files (.gjf / .xyz) and transfer integral CSV
        </p>
      </header>

      <FileUpload
        onMol1Change={setMol1}
        onMol2Change={setMol2}
        onCsvChange={setCsv}
        onCube1Change={setCube1}
        onCube2Change={setCube2}
      />

      <div className="flex-1 grid grid-cols-2 gap-4" style={{ minHeight: '60vh' }}>
        <div className="relative bg-white rounded-xl shadow overflow-hidden">
          {(cube1 || cube2) && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-slate-900/70 text-white text-xs px-3 py-1.5 rounded-lg">
              <label htmlFor="isovalue" className="whitespace-nowrap">Isovalue</label>
              <input
                id="isovalue"
                type="number"
                min="0.001"
                max="1"
                step="0.005"
                value={isovalue}
                onChange={e => setIsovalue(Number(e.target.value))}
                className="w-20 bg-slate-700 rounded px-1.5 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}
          <MoleculeViewer
            mol1={mol1}
            mol2={mol2}
            cube1={cube1}
            cube2={cube2}
            isovalue={isovalue}
            selectedPair={selected}
            onAtomClick={handleAtomClick}
          />
        </div>
        <div className="bg-white rounded-xl shadow p-2">
          <HeatmapView
            csv={csv}
            selectedPair={selected}
            onCellClick={(row, col) => setSelected({ row, col })}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow px-4 py-3 text-sm text-slate-700">
        <span className="font-medium">Selected:</span>{' '}
        {selected && csv ? (
          <>
            m1[{csv.rowLabels[selected.row] ?? selected.row}] ×
            m2[{csv.colLabels[selected.col] ?? selected.col}]
            {' '}&nbsp;→&nbsp;
            <span className="font-mono font-semibold text-blue-600">
              {csv.matrix[selected.row]?.[selected.col]?.toFixed(4) ?? '—'}
            </span>
          </>
        ) : (
          <span className="text-slate-400">Select a cell in the heatmap</span>
        )}
      </div>
    </div>
  );
}
