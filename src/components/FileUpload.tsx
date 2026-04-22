import React, { useRef } from 'react';
import type { ParsedMolecule, ParsedCsv, ParsedCube } from '../types';
import { parseGjf } from '../parsers/gjf';
import { parseXyz } from '../parsers/xyz';
import { parseMol } from '../parsers/mol';
import { parseCsv } from '../parsers/csv';
import { parseCube } from '../parsers/cube';

interface Props {
  onMol1Change: (mol: ParsedMolecule) => void;
  onMol2Change: (mol: ParsedMolecule) => void;
  onCsvChange: (csv: ParsedCsv) => void;
  onCube1Change: (cube: ParsedCube) => void;
  onCube2Change: (cube: ParsedCube) => void;
  onSwapMonomers: () => void;
  onSwapCubes: () => void;
  mol1?: ParsedMolecule | null;
  mol2?: ParsedMolecule | null;
  onMol1Clear?: () => void;
  onMol2Clear?: () => void;
  onCsvClear?: () => void;
  onCube1Clear?: () => void;
  onCube2Clear?: () => void;
}

function splitMolecule(mol: ParsedMolecule, n: number): [ParsedMolecule, ParsedMolecule] {
  const mol1Atoms = mol.atoms.slice(0, n);
  const mol2Atoms = mol.atoms.slice(n);
  const mol1Bonds = mol.bonds?.slice(0, n).map(row => row.slice(0, n));
  const mol2Bonds = mol.bonds?.slice(n).map(row => row.slice(n));
  return [
    { atoms: mol1Atoms, bonds: mol1Bonds },
    { atoms: mol2Atoms, bonds: mol2Bonds },
  ];
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseMolFile(filename: string, text: string): ParsedMolecule {
  if (filename.endsWith('.gjf')) return parseGjf(text);
  if (filename.endsWith('.mol')) return parseMol(text);
  return parseXyz(text);
}

interface DropZoneProps {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  onMultipleFiles?: (files: File[]) => void;
  loaded: boolean;
  fileName?: string | null;
  onClear?: () => void;
}

function DropZone({ label, accept, onFile, onMultipleFiles, loaded, fileName, onClear }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1 && onMultipleFiles) {
      onMultipleFiles(files);
    } else {
      const file = files[0];
      if (file) onFile(file);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        loaded ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-blue-400 text-gray-500'
      }`}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs mt-1 truncate max-w-full">
        {loaded ? (fileName ?? 'Loaded') : 'Click or drop'}
      </p>
      {loaded && onClear && (
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="absolute bottom-1 right-1 text-xs px-2 py-1 rounded bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
          title="削除"
        >
          Remove
        </button>
      )}
    </div>
  );
}

export function FileUpload({ onMol1Change, onMol2Change, onCsvChange, onCube1Change, onCube2Change, onSwapMonomers, onSwapCubes, mol1, mol2, onMol1Clear, onMol2Clear, onCsvClear, onCube1Clear, onCube2Clear }: Props) {
  const [mol1Loaded, setMol1Loaded] = React.useState(false);
  const [mol2Loaded, setMol2Loaded] = React.useState(false);
  const [csvLoaded, setCsvLoaded] = React.useState(false);
  const [cube1Loaded, setCube1Loaded] = React.useState(false);
  const [cube2Loaded, setCube2Loaded] = React.useState(false);

  const [mol1FileName, setMol1FileName] = React.useState<string | null>(null);
  const [mol2FileName, setMol2FileName] = React.useState<string | null>(null);
  const [csvFileName, setCsvFileName] = React.useState<string | null>(null);
  const [cube1FileName, setCube1FileName] = React.useState<string | null>(null);
  const [cube2FileName, setCube2FileName] = React.useState<string | null>(null);

  const [splitCount, setSplitCount] = React.useState<number | null>(null);

  const handleMol = async (
    file: File,
    setter: (mol: ParsedMolecule) => void,
    markLoaded: () => void,
    setFileName: (name: string) => void,
  ) => {
    const text = await readTextFile(file);
    setter(parseMolFile(file.name, text));
    markLoaded();
    setFileName(file.name);
    setSplitCount(null);
  };

  const handleCube = async (
    file: File,
    setter: (cube: ParsedCube) => void,
    markLoaded: () => void,
    setFileName: (name: string) => void,
  ) => {
    const text = await readTextFile(file);
    setter(parseCube(text));
    markLoaded();
    setFileName(file.name);
  };

  const distributeFiles = async (files: File[]) => {
    const molFiles  = files.filter(f => /\.(gjf|xyz|mol)$/i.test(f.name));
    const csvFiles  = files.filter(f => /\.csv$/i.test(f.name));
    const cubeFiles = files.filter(f => /\.cube$/i.test(f.name));

    if (csvFiles.length > 0) {
      const text = await readTextFile(csvFiles[0]);
      onCsvChange(parseCsv(text));
      setCsvLoaded(true);
      setCsvFileName(csvFiles[0].name);
    }

    const mol1File = molFiles.find(f => /m1/i.test(f.name));
    const mol2File = molFiles.find(f => /m2/i.test(f.name));
    const unassignedMols = molFiles.filter(f => !/m[12]/i.test(f.name));
    let ui = 0;
    if (mol1File) {
      await handleMol(mol1File, onMol1Change, () => setMol1Loaded(true), setMol1FileName);
    } else if (ui < unassignedMols.length) {
      await handleMol(unassignedMols[ui++], onMol1Change, () => setMol1Loaded(true), setMol1FileName);
    }
    if (mol2File) {
      await handleMol(mol2File, onMol2Change, () => setMol2Loaded(true), setMol2FileName);
    } else if (ui < unassignedMols.length) {
      await handleMol(unassignedMols[ui++], onMol2Change, () => setMol2Loaded(true), setMol2FileName);
    }

    const cube1File = cubeFiles.find(f => /m1/i.test(f.name));
    const cube2File = cubeFiles.find(f => /m2/i.test(f.name));
    const unassignedCubes = cubeFiles.filter(f => !/m[12]/i.test(f.name));
    let uc = 0;
    if (cube1File) {
      await handleCube(cube1File, onCube1Change, () => setCube1Loaded(true), setCube1FileName);
    } else if (uc < unassignedCubes.length) {
      await handleCube(unassignedCubes[uc++], onCube1Change, () => setCube1Loaded(true), setCube1FileName);
    }
    if (cube2File) {
      await handleCube(cube2File, onCube2Change, () => setCube2Loaded(true), setCube2FileName);
    } else if (uc < unassignedCubes.length) {
      await handleCube(unassignedCubes[uc++], onCube2Change, () => setCube2Loaded(true), setCube2FileName);
    }
  };

  const onlyOneMolLoaded = mol1Loaded !== mol2Loaded;
  const loadedMol = mol1Loaded ? mol1 : mol2;
  const totalAtoms = loadedMol?.atoms.length ?? 0;
  const effectiveSplitCount = splitCount ?? Math.floor(totalAtoms / 2);

  const handleSplit = () => {
    if (!loadedMol || totalAtoms < 2) return;
    const n = Math.max(1, Math.min(effectiveSplitCount, totalAtoms - 1));
    const [splitMol1, splitMol2] = splitMolecule(loadedMol, n);
    const baseName = mol1Loaded ? mol1FileName : mol2FileName;
    onMol1Change(splitMol1);
    onMol2Change(splitMol2);
    setMol1Loaded(true);
    setMol2Loaded(true);
    setMol1FileName(baseName ? `${baseName} (1–${n})` : null);
    setMol2FileName(baseName ? `${baseName} (${n + 1}–${totalAtoms})` : null);
    setSplitCount(null);
  };

  const handleSwapMonomers = () => {
    const [l1, l2] = [mol1Loaded, mol2Loaded];
    const [f1, f2] = [mol1FileName, mol2FileName];
    setMol1Loaded(l2); setMol2Loaded(l1);
    setMol1FileName(f2); setMol2FileName(f1);
    onSwapMonomers();
  };

  const handleSwapCubes = () => {
    const [l1, l2] = [cube1Loaded, cube2Loaded];
    const [f1, f2] = [cube1FileName, cube2FileName];
    setCube1Loaded(l2); setCube2Loaded(l1);
    setCube1FileName(f2); setCube2FileName(f1);
    onSwapCubes();
  };

  const handleClearAll = () => {
    setMol1Loaded(false); setMol1FileName(null); onMol1Clear?.();
    setMol2Loaded(false); setMol2FileName(null); onMol2Clear?.();
    setCsvLoaded(false); setCsvFileName(null); onCsvClear?.();
    setCube1Loaded(false); setCube1FileName(null); onCube1Clear?.();
    setCube2Loaded(false); setCube2FileName(null); onCube2Clear?.();
  };

  const swapButtonClass =
    'flex-shrink-0 px-2 py-1 rounded text-base text-slate-400 hover:text-blue-500 hover:bg-slate-100 transition-colors';

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow">
      <p className="text-xs text-gray-400 text-center">You can drop all files at once onto any zone</p>
      <div className="flex gap-3 items-stretch">
        <div className="flex-1">
          <DropZone
            label="Monomer 1 (.gjf / .xyz / .mol)"
            accept=".gjf,.xyz,.mol"
            loaded={mol1Loaded}
            fileName={mol1FileName}
            onFile={f => handleMol(f, onMol1Change, () => setMol1Loaded(true), setMol1FileName)}
            onMultipleFiles={distributeFiles}
            onClear={() => { setMol1Loaded(false); setMol1FileName(null); onMol1Clear?.(); }}
          />
        </div>
        <div className={`flex-shrink-0 flex flex-col items-center py-1 ${onlyOneMolLoaded && totalAtoms >= 2 ? 'justify-between' : 'justify-center'}`}>
          <button
            className={swapButtonClass}
            onClick={handleSwapMonomers}
            title="Monomer 1 / 2 を入れ替え"
          >
            ⇄
          </button>
          {onlyOneMolLoaded && totalAtoms >= 2 && (
            <>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min={1}
                  max={totalAtoms - 1}
                  value={effectiveSplitCount}
                  onChange={e => {
                    const v = Math.floor(Number(e.target.value));
                    if (!isNaN(v)) setSplitCount(v);
                  }}
                  className="w-10 bg-white border border-slate-300 rounded px-0.5 py-0.5 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  title="Monomer1の原子数"
                />
                <span className="text-xs text-slate-400">/{totalAtoms}</span>
              </div>
              <button
                onClick={handleSplit}
                className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="ファイルを分割"
              >
                Split
              </button>
            </>
          )}
        </div>
        <div className="flex-1">
          <DropZone
            label="Monomer 2 (.gjf / .xyz / .mol)"
            accept=".gjf,.xyz,.mol"
            loaded={mol2Loaded}
            fileName={mol2FileName}
            onFile={f => handleMol(f, onMol2Change, () => setMol2Loaded(true), setMol2FileName)}
            onMultipleFiles={distributeFiles}
            onClear={() => { setMol2Loaded(false); setMol2FileName(null); onMol2Clear?.(); }}
          />
        </div>
        <div className="flex-1">
          <DropZone
            label="Transfer Integral CSV"
            accept=".csv"
            loaded={csvLoaded}
            fileName={csvFileName}
            onFile={async f => {
              const text = await readTextFile(f);
              onCsvChange(parseCsv(text));
              setCsvLoaded(true);
              setCsvFileName(f.name);
            }}
            onMultipleFiles={distributeFiles}
            onClear={() => { setCsvLoaded(false); setCsvFileName(null); onCsvClear?.(); }}
          />
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <DropZone
            label="Molecular Orbital Cube 1 (.cube)"
            accept=".cube"
            loaded={cube1Loaded}
            fileName={cube1FileName}
            onFile={f => handleCube(f, onCube1Change, () => setCube1Loaded(true), setCube1FileName)}
            onMultipleFiles={distributeFiles}
            onClear={() => { setCube1Loaded(false); setCube1FileName(null); onCube1Clear?.(); }}
          />
        </div>
        <button
          className={swapButtonClass}
          onClick={handleSwapCubes}
          title="Cube 1 / 2 を入れ替え"
        >
          ⇄
        </button>
        <div className="flex-1">
          <DropZone
            label="Molecular Orbital Cube 2 (.cube)"
            accept=".cube"
            loaded={cube2Loaded}
            fileName={cube2FileName}
            onFile={f => handleCube(f, onCube2Change, () => setCube2Loaded(true), setCube2FileName)}
            onMultipleFiles={distributeFiles}
            onClear={() => { setCube2Loaded(false); setCube2FileName(null); onCube2Clear?.(); }}
          />
        </div>
        {(mol1Loaded || mol2Loaded || csvLoaded || cube1Loaded || cube2Loaded) && (
          <button
            onClick={handleClearAll}
            className="flex-shrink-0 text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors whitespace-nowrap"
            title="すべてのデータを削除"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
