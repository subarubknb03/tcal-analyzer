import { useCallback, useMemo, useState } from 'react';
import type { ParsedMolecule, ParsedCsv, ParsedCube, SelectedPair } from './types';
import { FileUpload } from './components/FileUpload';
import { MoleculeViewer } from './components/MoleculeViewer';
import { HeatmapView } from './components/HeatmapView';
import { InfoModal } from './components/InfoModal';
import { TIConvergenceChart } from './components/TIConvergenceChart';
import { calPattern1TI } from './utils/localCancelTIPattern1';
import { buildAdjacencyMatrix } from './utils/bondDetection';
import { serializeMol } from './utils/molSerializer';

export default function App() {
  const [mol1, setMol1] = useState<ParsedMolecule | null>(null);
  const [mol2, setMol2] = useState<ParsedMolecule | null>(null);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [selected, setSelected] = useState<SelectedPair | null>(null);
  const [cube1, setCube1] = useState<ParsedCube | null>(null);
  const [cube2, setCube2] = useState<ParsedCube | null>(null);
  const [isovalue, setIsovalue] = useState(0.02);
  const [localBlurEnabled, setLocalBlurEnabled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [p1Weight, setP1Weight] = useState(0.01);
  const [p1Power, setP1Power] = useState(100);
  const [convergenceData, setConvergenceData] = useState<{ counts: number[]; values: number[] } | null>(null);
  const [convergenceLoading, setConvergenceLoading] = useState(false);

  // --- Bond Edit state ---
  const [bondEditMode, setBondEditMode] = useState(false);
  const [bondEditFirst, setBondEditFirst] = useState<{ monomer: 1 | 2; index: number } | null>(null);
  const [bondEditPending, setBondEditPending] = useState<{
    monomer: 1 | 2; a: number; b: number; currentOrder: number;
  } | null>(null);
  // --- End Bond Edit state ---

  const displayMatrix = useMemo(() => {
    if (!localBlurEnabled || !csv || !mol1 || !mol2) return null;
    return calPattern1TI(csv.matrix, mol1.atoms, mol2.atoms, p1Weight, p1Power, mol1.bonds, mol2.bonds);
  }, [localBlurEnabled, csv, mol1, mol2, p1Weight, p1Power]);

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

  const toggleBondEditMode = useCallback(() => {
    setBondEditMode(prev => {
      if (prev) { setBondEditFirst(null); setBondEditPending(null); }
      return !prev;
    });
  }, []);

  const handleAtomClick = useCallback((monomer: 1 | 2, atomIndex: number) => {
    if (!bondEditMode) {
      setSelected(prev => {
        if (monomer === 1) return { row: atomIndex, col: prev?.col ?? 0 };
        return { row: prev?.row ?? 0, col: atomIndex };
      });
      return;
    }
    if (!bondEditFirst) {
      setBondEditFirst({ monomer, index: atomIndex });
      return;
    }
    if (atomIndex === bondEditFirst.index && monomer === bondEditFirst.monomer) {
      setBondEditFirst(null);
      return;
    }
    if (monomer !== bondEditFirst.monomer) {
      setBondEditFirst({ monomer, index: atomIndex });
      return;
    }
    const mol = monomer === 1 ? mol1 : mol2;
    const lo = Math.min(bondEditFirst.index, atomIndex);
    const hi = Math.max(bondEditFirst.index, atomIndex);
    const currentOrder = mol?.bondOrders
      ? (mol.bondOrders[lo][hi] ?? 0)
      : (mol?.bonds ? (mol.bonds[lo][hi] ?? 0) : 0);
    setBondEditPending({ monomer, a: bondEditFirst.index, b: atomIndex, currentOrder });
    setBondEditFirst(null);
  }, [bondEditMode, bondEditFirst, mol1, mol2]);

  const handleBondOrderChange = useCallback((newOrder: number) => {
    if (!bondEditPending) return;
    const { monomer, a, b } = bondEditPending;
    const updateMol = (mol: ParsedMolecule): ParsedMolecule => {
      const bonds = mol.bonds
        ? mol.bonds.map(row => [...row])
        : buildAdjacencyMatrix(mol.atoms);
      const bondOrders = mol.bondOrders
        ? mol.bondOrders.map(row => [...row])
        : bonds.map(row => [...row]);
      bonds[a][b] = newOrder > 0 ? 1 : 0;
      bonds[b][a] = newOrder > 0 ? 1 : 0;
      bondOrders[a][b] = newOrder;
      bondOrders[b][a] = newOrder;
      const updated = { ...mol, bonds, bondOrders };
      updated.rawMolText = serializeMol(updated);
      return updated;
    };
    if (monomer === 1) setMol1(prev => prev ? updateMol(prev) : prev);
    else setMol2(prev => prev ? updateMol(prev) : prev);
    setBondEditPending(null);
  }, [bondEditPending]);

  const handleRunConvergence = useCallback(async () => {
    if (!csv || !mol1 || !mol2 || !selected) return;
    setConvergenceLoading(true);
    await new Promise(r => setTimeout(r, 0));
    const counts = [1, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 10)];
    const values = counts.map(count =>
      calPattern1TI(csv.matrix, mol1.atoms, mol2.atoms, p1Weight, count, mol1.bonds, mol2.bonds)
        [selected.row][selected.col]
    );
    setConvergenceData({ counts, values });
    setConvergenceLoading(false);
  }, [csv, mol1, mol2, selected, p1Weight]);

  const canSmooth = !!(csv && mol1 && mol2);

  return (
    <>
    {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    {convergenceData && selected && csv && (
      <TIConvergenceChart
        data={convergenceData}
        selectedLabel={`m1[${csv.rowLabels[selected.row] ?? selected.row}] × m2[${csv.colLabels[selected.col] ?? selected.col}]`}
        onClose={() => setConvergenceData(null)}
      />
    )}
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
        mol1={mol1}
        mol2={mol2}
        onMol1Clear={() => setMol1(null)}
        onMol2Clear={() => setMol2(null)}
        onCsvClear={() => setCsv(null)}
        onCube1Clear={() => setCube1(null)}
        onCube2Clear={() => setCube2(null)}
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
                step="0.001"
                value={isovalue}
                onChange={e => setIsovalue(Number(e.target.value))}
                className="w-20 bg-slate-700 rounded px-1.5 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}
          {(mol1 || mol2) && (
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={toggleBondEditMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  bondEditMode
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-900/70 text-white hover:bg-slate-700/80'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Bond Edit
              </button>
              {bondEditMode && bondEditFirst && (
                <div className="mt-1 bg-slate-900/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Atom {bondEditFirst.index + 1} (M{bondEditFirst.monomer}) — click 2nd atom
                </div>
              )}
            </div>
          )}
          {bondEditPending && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-sm text-white rounded-xl shadow-xl px-5 py-4 flex flex-col gap-3 min-w-[220px]">
                <div className="text-xs text-slate-300 text-center">
                  Bond: atom {bondEditPending.a + 1} – {bondEditPending.b + 1}
                  {' '}(M{bondEditPending.monomer})
                </div>
                <div className="flex gap-2 justify-center">
                  {([0, 1, 2, 3] as const).map(order => {
                    const labels = ['No Bond', 'Single', 'Double', 'Triple'];
                    const isCurrent = order === bondEditPending.currentOrder;
                    return (
                      <button
                        key={order}
                        onClick={() => handleBondOrderChange(order)}
                        className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          isCurrent
                            ? 'bg-blue-500 border-blue-400 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                        }`}
                      >
                        <span className="font-mono text-base leading-tight">{order}</span>
                        <span>{labels[order]}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setBondEditPending(null)}
                  className="text-xs text-slate-400 hover:text-white text-center transition-colors"
                >
                  Cancel
                </button>
              </div>
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
            bondEditFirstAtom={bondEditFirst}
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
                <button
                  onClick={handleRunConvergence}
                  disabled={convergenceLoading || !selected}
                  title={selected ? 'Apply Count 収束グラフを表示' : 'ヒートマップでセルを選択してください'}
                  className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {convergenceLoading ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  )}
                </button>
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
