import { useEffect, useRef } from 'react';
import type { ParsedMolecule, ParsedCube, SelectedPair } from '../types';

// 3Dmol.js has no TS types package; use window global
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any;
  }
}

interface Props {
  mol1: ParsedMolecule | null;
  mol2: ParsedMolecule | null;
  cube1: ParsedCube | null;
  cube2: ParsedCube | null;
  isovalue: number;
  selectedPair: SelectedPair | null;
  onAtomClick: (monomer: 1 | 2, atomIndex: number) => void;
}

const CPK_COLORS: Record<string, string> = {
  H:  '#FFFFFF', He: '#D9FFFF',
  Li: '#CC80FF', Be: '#C2FF00', B:  '#FFB5B5', C:  '#909090',
  N:  '#3050F8', O:  '#FF0D0D', F:  '#90E050', Ne: '#B3E3F5',
  Na: '#AB5CF2', Mg: '#8AFF00', Al: '#BFA6A6', Si: '#F0C8A0',
  P:  '#FF8000', S:  '#FFFF30', Cl: '#1FF01F', Ar: '#80D1E3',
  K:  '#8F40D4', Ca: '#3DFF00',
  Sc: '#E6E6E6', Ti: '#BFC2C7', V:  '#A6A6AB', Cr: '#8A99C7',
  Mn: '#9C7AC7', Fe: '#E06633', Co: '#F090A0', Ni: '#50D050',
  Cu: '#C88033', Zn: '#7D80B0',
  Ga: '#C28F8F', Ge: '#668F8F', As: '#BD80E3', Se: '#FFA100',
  Br: '#A62929', Kr: '#5CB8D1',
  I:  '#940094', At: '#754F45', Ts: '#754F45',
};
const cpkColor = (symbol: string): string => CPK_COLORS[symbol] ?? '#808080';

function atomsToXyz(atoms: ParsedMolecule['atoms'], offset: number): string {
  const lines = [`${atoms.length}`, 'molecule'];
  for (const a of atoms) {
    lines.push(`${a.symbol} ${a.x} ${a.y} ${a.z}`);
  }
  void offset;
  return lines.join('\n');
}

export function MoleculeViewer({ mol1, mol2, cube1, cube2, isovalue, selectedPair, onAtomClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  // Initialize viewer once
  useEffect(() => {
    if (!containerRef.current || !window.$3Dmol) return;
    viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: '#1e293b',
    });
  }, []);

  // Rebuild scene when molecules or selection change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.clear();

    const renderMol = (
      mol: ParsedMolecule,
      defaultColor: string,
      monomer: 1 | 2,
      highlightIdx: number | null,
    ) => {
      const xyz = atomsToXyz(mol.atoms, 0);
      const model = viewer.addModel(xyz, 'xyz');
      model.setStyle({}, {
        sphere: { radius: 0.3, colorfunc: (atom: { elem: string }) => cpkColor(atom.elem) },
        stick: { radius: 0.1, color: defaultColor },
      });

      if (highlightIdx !== null && highlightIdx < mol.atoms.length) {
        model.setStyle(
          { index: highlightIdx },
          { sphere: { radius: 0.3, color: '#facc15' }, stick: { radius: 0.1, color: defaultColor } },
        );
        const atom = mol.atoms[highlightIdx];
        viewer.addLabel(atom.symbol, {
          position: { x: atom.x, y: atom.y, z: atom.z },
          fontSize: 14,
          fontColor: 'white',
          backgroundColor: '#1e293b',
          showBackground: true,
          inFront: true,
        });
      }

      model.setClickable({}, true, (atom: { index: number }) => {
        onAtomClick(monomer, atom.index);
      });
    };

    if (mol1) renderMol(mol1, '#60a5fa', 1, selectedPair?.row ?? null);
    if (mol2) renderMol(mol2, '#f87171', 2, selectedPair?.col ?? null);

    const addIsosurfaces = (cube: ParsedCube) => {
      viewer.addVolumetricData(cube.rawText, 'cube', {
        isoval: isovalue, color: '#0041ff', opacity: 0.85, smoothness: 1,
      });
      viewer.addVolumetricData(cube.rawText, 'cube', {
        isoval: -isovalue, color: '#fff500', opacity: 0.85, smoothness: 1,
      });
    };
    if (cube1) addIsosurfaces(cube1);
    if (cube2) addIsosurfaces(cube2);

    viewer.zoomTo();
    viewer.render();
  }, [mol1, mol2, cube1, cube2, isovalue, selectedPair, onAtomClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800">
      <div ref={containerRef} className="w-full h-full" />
      {!mol1 && !mol2 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
          Upload a molecule file to view in 3D
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs pointer-events-none">
        {mol1 && <span className="bg-blue-500/80 text-white px-2 py-0.5 rounded">● Monomer 1</span>}
        {mol2 && <span className="bg-red-500/80 text-white px-2 py-0.5 rounded">● Monomer 2</span>}
      </div>
    </div>
  );
}
