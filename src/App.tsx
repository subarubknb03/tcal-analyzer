import { useCallback, useMemo, useState } from 'react';
import type { ParsedMolecule, ParsedCsv, ParsedCube, SelectedPair } from './types';
import { FileUpload } from './components/FileUpload';
import { MoleculeViewer } from './components/MoleculeViewer';
import { HeatmapView } from './components/HeatmapView';
import { InfoModal } from './components/InfoModal';
import { calPattern1TI } from './utils/localCancelTIPattern1';
import { calPattern2TI } from './utils/localCancelTIPattern2';

export default function App() {
  const [mol1, setMol1] = useState<ParsedMolecule | null>(null);
  const [mol2, setMol2] = useState<ParsedMolecule | null>(null);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [selected, setSelected] = useState<SelectedPair | null>(null);
  const [cube1, setCube1] = useState<ParsedCube | null>(null);
  const [cube2, setCube2] = useState<ParsedCube | null>(null);
  const [isovalue, setIsovalue] = useState(0.02);
  const [localBlurEnabled, setLocalBlurEnabled] = useState(false);
  const [smoothingPattern, setSmoothingPattern] = useState<1 | 2>(1);
  const [showInfo, setShowInfo] = useState(false);

  // --- Pattern 1 params ---
  const [p1Weight, setP1Weight] = useState(0.01);
  const [p1Power, setP1Power] = useState(10);
  // --- End Pattern 1 params ---

  // --- Pattern 2 params ---
  const [cancelRatio, setCancelRatio] = useState(1.0);
  const [hPower, setHPower] = useState(1);
  // --- End Pattern 2 params ---

  const displayMatrix = useMemo(() => {
    if (!localBlurEnabled || !csv || !mol1 || !mol2) return null;
    // --- Pattern 1 ---
    if (smoothingPattern === 1)
      return calPattern1TI(csv.matrix, mol1.atoms, mol2.atoms, p1Weight, p1Power, mol1.bonds, mol2.bonds);
    // --- Pattern 2 ---
    return calPattern2TI(csv.matrix, mol1.atoms, mol2.atoms, cancelRatio, hPower, mol1.bonds, mol2.bonds);
  }, [localBlurEnabled, csv, mol1, mol2, smoothingPattern, p1Weight, p1Power, cancelRatio, hPower]);

  const molecularTI = useMemo(() => {
    const m = displayMatrix ?? csv?.matrix;
    if (!m) return null;
    return m.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);
  }, [displayMatrix, csv]);

  const swapMonomers = () => {
    setMol1(mol2);
    setMol2(mol1);
  };

  const swapCubes = () => {
    setCube1(cube2);
    setCube2(cube1);
  };

  const handleAtomClick = useCallback((monomer: 1 | 2, atomIndex: number) => {
    setSelected(prev => {
      if (monomer === 1) return { row: atomIndex, col: prev?.col ?? 0 };
      return { row: prev?.row ?? 0, col: atomIndex };
    });
  }, []);

  const canSmooth = !!(csv && mol1 && mol2);

  return (
    <>
    {showInfo && <InfoModal onClose={() => setShowInfo(false)} pattern={smoothingPattern} />}
    <div className="min-h-screen bg-slate-100 flex flex-col gap-4 p-4">
      <header className="bg-white rounded-xl shadow px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-800">tcal analyzer</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload monomer files (.gjf / .xyz / .mol) and transfer integral CSV
        </p>
      </header>

      <FileUpload
        onMol1Change={setMol1}
        onMol2Change={setMol2}
        onCsvChange={setCsv}
        onCube1Change={setCube1}
        onCube2Change={setCube2}
        onSwapMonomers={swapMonomers}
        onSwapCubes={swapCubes}
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
            molecularTI={molecularTI}
          />
        </div>
        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 text-sm flex-wrap">
            <button
              onClick={() => setShowInfo(true)}
              className="flex-shrink-0 w-5 h-5 rounded-full border border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-400 text-xs font-bold leading-none flex items-center justify-center transition-colors"
              aria-label="計算式の説明"
            >
              i
            </button>
            <label className={`relative inline-flex items-center gap-2 select-none ${canSmooth ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
              <input
                type="checkbox"
                checked={localBlurEnabled}
                disabled={!canSmooth}
                onChange={e => setLocalBlurEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:border-white" />
              <span className="text-slate-700 font-medium">Local Smoothing</span>
            </label>

            {localBlurEnabled && canSmooth && (
              <>
                {/* Pattern selector */}
                <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs font-medium">
                  <button
                    onClick={() => setSmoothingPattern(1)}
                    className={`px-2.5 py-1 transition-colors ${smoothingPattern === 1 ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Pattern 1
                  </button>
                  <button
                    onClick={() => setSmoothingPattern(2)}
                    className={`px-2.5 py-1 border-l border-slate-200 transition-colors ${smoothingPattern === 2 ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Pattern 2
                  </button>
                </div>

                {/* --- Pattern 1 params --- */}
                {smoothingPattern === 1 && (
                  <>
                    <span className="text-slate-500 text-xs">Weight w</span>
                    <input
                      type="number"
                      min={0}
                      max={0.3}
                      step={0.001}
                      value={p1Weight}
                      onChange={e => {
                        const v = Number(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 0.5) setP1Weight(v);
                      }}
                      className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <span className="text-slate-500 text-xs">Apply Count</span>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      step={1}
                      value={p1Power}
                      onChange={e => {
                        const v = Math.floor(Number(e.target.value));
                        if (!isNaN(v) && v >= 1 && v <= 1000) setP1Power(v);
                      }}
                      className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </>
                )}
                {/* --- End Pattern 1 params --- */}

                {/* --- Pattern 2 params --- */}
                {smoothingPattern === 2 && (
                  <>
                    <span className="text-slate-500 text-xs">Neighbor Weight</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={cancelRatio}
                      onChange={e => setCancelRatio(Number(e.target.value))}
                      className="w-28 accent-blue-500"
                    />
                    <span className="text-slate-600 font-mono text-xs w-8">{cancelRatio.toFixed(2)}</span>
                    <span className="text-slate-500 text-xs">Apply Count</span>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      step={1}
                      value={hPower}
                      onChange={e => {
                        const v = Math.floor(Number(e.target.value));
                        if (!isNaN(v) && v >= 1 && v <= 1000) setHPower(v);
                      }}
                      className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </>
                )}
                {/* --- End Pattern 2 params --- */}
              </>
            )}
          </div>
          <div className="flex-1 min-h-0 p-2">
            <HeatmapView
              csv={csv}
              displayMatrix={displayMatrix}
              selectedPair={selected}
              onCellClick={(row, col) => setSelected({ row, col })}
            />
          </div>
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
              {(displayMatrix ?? csv.matrix)[selected.row]?.[selected.col]?.toFixed(4) ?? '—'}
            </span>
          </>
        ) : (
          <span className="text-slate-400">Select a cell in the heatmap</span>
        )}
      </div>
    </div>
    </>
  );
}
