# tcal-analyzer

A browser-based visualization tool for interatomic transfer integrals in molecular dimer systems. Upload quantum chemistry output files and interactively explore atomic-level transfer integral data — no backend required.

**[Live Demo](https://subarubknb03.github.io/tcal-analyzer/)**

## Features

- **3D molecular visualization** — interactive structure viewer for dimer systems (3Dmol.js)
- **Transfer integral heatmap** — clickable matrix view with cross-selection to/from the 3D viewer
- **Molecular orbital isosurfaces** — render HOMO/LUMO from Gaussian `.cube` files with adjustable isovalue
- **Substructure TI** — select multiple atoms from each monomer to compute the summed transfer integral over all selected atom pairs; highlights the corresponding sub-matrix in the heatmap
- **Local smoothing** — graph signal processing filter (symmetric normalized Laplacian) applied to the transfer integral matrix; when Substructure Mode is active, smoothing is applied to the selected sub-matrix only
- **Cross-selection** — click an atom in the 3D viewer to highlight its row/column in the heatmap, and vice versa

## Supported File Formats

| File | Format | Purpose |
|------|--------|---------|
| `.gjf` | Gaussian input | Monomer coordinates |
| `.xyz` | XYZ | Monomer coordinates |
| `.mol` | MDL MOL V2000 | Monomer coordinates + bond connectivity |
| `.csv` | Matrix CSV | Interatomic transfer integral values |
| `.cube` | Gaussian cube | Molecular orbital volumetric data |

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **3Dmol.js** — WebGL molecular visualization
- **Plotly.js** — interactive heatmap
- **KaTeX** — math formula rendering
- **TailwindCSS** — styling

## Getting Started

### npm

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # output to /docs (GitHub Pages)
npm run lint
```

### Docker + Nix

```bash
docker compose build       # first build: ~10–20 min
docker compose up -d
docker compose exec web zsh
# inside container:
cd /mnt/workspace && npm run dev
```

## Usage

1. Upload two monomer structure files (`.gjf`, `.xyz`, or `.mol`) in the **Monomer 1** and **Monomer 2** upload zones
2. Upload a transfer integral matrix as a `.csv` file
3. Optionally upload `.cube` files for molecular orbital visualization
4. Click atoms in the 3D viewer or cells in the heatmap — selections sync between both views
5. Enable **Substructure Mode** to select multiple atoms from each monomer; the status bar shows the summed transfer integral over all selected atom pairs
6. Enable **Local Smoothing** to apply graph-based filtering to the transfer integral matrix (applies to the selected sub-matrix when Substructure Mode is active)

## License

MIT
