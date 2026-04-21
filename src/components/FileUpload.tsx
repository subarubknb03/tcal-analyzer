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
}

function DropZone({ label, accept, onFile, onMultipleFiles, loaded, fileName }: DropZoneProps) {
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
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
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
    </div>
  );
}

export function FileUpload({ onMol1Change, onMol2Change, onCsvChange, onCube1Change, onCube2Change, onSwapMonomers, onSwapCubes }: Props) {
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

  const swapButtonClass =
    'flex-shrink-0 px-2 py-1 rounded text-base text-slate-400 hover:text-blue-500 hover:bg-slate-100 transition-colors';

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow">
      <p className="text-xs text-gray-400 text-center">You can drop all files at once onto any zone</p>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <DropZone
            label="Monomer 1 (.gjf / .xyz / .mol)"
            accept=".gjf,.xyz,.mol"
            loaded={mol1Loaded}
            fileName={mol1FileName}
            onFile={f => handleMol(f, onMol1Change, () => setMol1Loaded(true), setMol1FileName)}
            onMultipleFiles={distributeFiles}
          />
        </div>
        <button
          className={swapButtonClass}
          onClick={handleSwapMonomers}
          title="Monomer 1 / 2 を入れ替え"
        >
          ⇄
        </button>
        <div className="flex-1">
          <DropZone
            label="Monomer 2 (.gjf / .xyz / .mol)"
            accept=".gjf,.xyz,.mol"
            loaded={mol2Loaded}
            fileName={mol2FileName}
            onFile={f => handleMol(f, onMol2Change, () => setMol2Loaded(true), setMol2FileName)}
            onMultipleFiles={distributeFiles}
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
          />
        </div>
      </div>
    </div>
  );
}
