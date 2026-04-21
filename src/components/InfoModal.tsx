import katex from 'katex';
import 'katex/dist/katex.min.css';

function M({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !!block });
  if (block) {
    return (
      <div
        className="overflow-x-auto py-2 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

interface Props {
  onClose: () => void;
  pattern: 1 | 2;
}

export function InfoModal({ onClose, pattern }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 p-6 text-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Local Smoothing — Pattern {pattern}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Variable definitions */}
        <section className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Variables</h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {pattern === 1 ? (
                <>
                  {[
                    ['U', 'Transfer integral matrix (size ', 'N_1 \\times N_2', ')'],
                    ['A_1,\\,A_2', 'Adjacency matrices of monomer 1 and 2 (', 'N\\times N', ') — bonded: 1, not bonded: 0'],
                    ['d^{(1)}_j,\\,d^{(2)}_i', 'Degree (number of bonds) of each atom', null, null],
                    ['w', 'Weight w (input value, recommended \\(\\ll 1/d_{\\max}\\))', null, null],
                    ['n', 'Apply Count', null, null],
                  ].map(([sym, desc, tex, rest], i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-1 pr-3 w-12 font-medium"><M tex={sym as string} /></td>
                      <td className="py-1 text-slate-600 text-xs">{desc}{tex && <><M tex={tex} />{rest}</>}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {[
                    ['U', 'Transfer integral matrix (size ', 'N_1 \\times N_2', ')'],
                    ['A', 'Adjacency matrix (size ', 'N \\times N', ') — bonded: 1, not bonded: 0'],
                    ['I', 'Identity matrix', null, null],
                    ['w', 'Neighbor Weight (slider value)', null, null],
                  ].map(([sym, desc, tex, rest], i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-1 pr-3 w-12 font-medium"><M tex={sym as string} /></td>
                      <td className="py-1 text-slate-600 text-xs">{desc}{tex && <><M tex={tex} />{rest}</>}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </section>

        {/* Derivation steps */}
        <section className="space-y-4 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Derivation</h3>

          {/* --- Pattern 1 derivation --- */}
          {pattern === 1 && (
            <>
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">① Bond detection (adjacency matrix <M tex="A" />)</p>
                <M block tex="\operatorname{dist}(i,j) < (r_i + r_j) \times 1.15 \;\Rightarrow\; A_{ij}=1" />
                <p className="text-xs text-slate-400 mt-1"><M tex="r" /> is the covalent radius (Å)</p>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">② Degree of each atom (column sum of <M tex="A_1" />, row sum of <M tex="A_2" />)</p>
                <M block tex="d^{(1)}_j = \sum_{i} A_{1,ij} \qquad d^{(2)}_i = \sum_{j} A_{2,ij}" />
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">③ Filter matrices <M tex="\tilde{A}" /> (column-stochastic) and <M tex="\tilde{B}" /> (row-stochastic)</p>
                <M block tex="\tilde{A}_{ij} = \begin{cases} 1 - w\, d^{(1)}_j & (i = j) \\ w\, A_{1,ij} & (i \neq j) \end{cases}" />
                <M block tex="\tilde{B}_{ij} = \begin{cases} 1 - w\, d^{(2)}_i & (i = j) \\ w\, A_{2,ij} & (i \neq j) \end{cases}" />
                <p className="text-xs text-slate-400 mt-1">
                  <M tex="\sum_i \tilde{A}_{ij} = 1" />,&ensp;
                  <M tex="\sum_j \tilde{B}_{ij} = 1" />&ensp;（both are also doubly stochastic）
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">④ Smoothed transfer integral</p>
                <M block tex="U' = \tilde{A}^n \, U \, \tilde{B}^n" />
                <p className="text-xs text-slate-500 mt-1">
                  <M tex="n" /> = Apply Count. Ensures <M tex="\sum_{ij}U'_{ij} = \sum_{ij}U_{ij}" />.
                  As <M tex="n \to \infty" />, each cell converges to <M tex="\text{(molecular TI)} / (N_1 N_2)" />.
                </p>
              </div>
            </>
          )}
          {/* --- End Pattern 1 derivation --- */}

          {/* --- Pattern 2 derivation --- */}
          {pattern === 2 && (
            <>
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">① Bond detection (adjacency matrix <M tex="A" />)</p>
                <M block tex="\operatorname{dist}(i,j) < (r_i + r_j) \times 1.15 \;\Rightarrow\; A_{ij}=1" />
                <p className="text-xs text-slate-400 mt-1"><M tex="r" /> is the covalent radius (Å)</p>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">② Adjacency matrices with self-loops <M tex="\tilde{A},\,\tilde{B}" /></p>
                <M block tex="\tilde{A} = w \cdot A_1 + I \qquad \tilde{B} = w \cdot A_2 + I" />
                <p className="text-xs text-slate-400 mt-1"><M tex="A_1, A_2" />: adjacency matrices of monomer 1 and 2. When <M tex="w=0" />, no smoothing.</p>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">③ Column-sum matrix <M tex="D" /> (from <M tex="\tilde{A}" />) and row-sum matrix <M tex="E" /> (from <M tex="\tilde{B}" />)</p>
                <M block tex="D_{jj} = \sum_{i} \tilde{A}_{ij} \qquad E_{ii} = \sum_{j} \tilde{B}_{ij}" />
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">④ Filter matrices <M tex="H_1" /> (column-stochastic) and <M tex="H_2" /> (row-stochastic)</p>
                <M block tex="H_1 = \tilde{A}\,D^{-1} \quad \Bigl(\sum_i H_{1,ij}=1\Bigr)" />
                <M block tex="H_2 = E^{-1}\tilde{B} \quad \Bigl(\sum_j H_{2,ij}=1\Bigr)" />
                <p className="text-xs text-slate-400 mt-1">Ensures <M tex="\sum_{ij}U'_{ij} = \sum_{ij}U_{ij}" /></p>
              </div>

              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">⑤ Smoothed transfer integral</p>
                <M block tex="U' = H_1^n \, U \, H_2^n" />
                <p className="text-xs text-slate-500 mt-1">
                  <M tex="H_1, H_2" />: filter matrices for monomer 1 and 2. <M tex="n" /> = Apply Count
                </p>
              </div>
            </>
          )}
          {/* --- End Pattern 2 derivation --- */}
        </section>
      </div>
    </div>
  );
}
