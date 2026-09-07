import React, { useState } from 'react'

const FAQS = [
  {
    q: 'Are these real lunar images?',
    a: 'Yes. The imagery originates from ISRO Chandrayaan-2 PDS-4 observation archives: OHRC, TMC-2, and IIRS. In preset demonstrations, the raw sensor arrays are served directly from the model package.',
  },
  {
    q: 'Are the three images pixel-perfect correspondences?',
    a: 'No. The three sensors operate on separate focal planes, orbits, and ground sample distances (0.28m vs 5.0m vs 86.5m). ChandraVue establishes mathematical and geometric co-registration across these disparate modalities.',
  },
  {
    q: 'What does the model predict?',
    a: 'The LoFTR neural model predicts dense 2D feature correspondences between cross-sensor image pairs. RANSAC then solves the planar homography matrix, and the decision engine synthesizes whether the frames capture the SAME LUNAR ZONE.',
  },
  {
    q: 'How is scale handled?',
    a: 'Direct matching across 300× scale gap is ill-posed. TMC-2 (5.0 m/px) serves as an intermediate resolution bridge between coarse IIRS (86.5 m/px) and fine OHRC (0.28 m/px) using multi-scale feature pyramids.',
  },
  {
    q: 'How is illumination handled?',
    a: 'Lunar craters exhibit extreme shadow variances due to low sun elevation angles. Physical Lunar-Lambertian reflectance modeling and CLAHE normalize local contrast to reveal subtle ejecta texture in shadowed maria.',
  },
  {
    q: 'How are incorrect matches rejected?',
    a: 'Outliers are filtered through a 2-stage sieve: first, softmax mutual nearest neighbor attention suppresses ambiguous repetitions; second, MAGSAC++ projective homography eliminates matches with high transfer error.',
  },
  {
    q: 'What does confidence mean?',
    a: 'Confidence is the softmax attention match probability [0, 1] output by the transformer layers. It reflects matching distinctiveness and is verified downstream by geometric reprojection RMSE.',
  },
  {
    q: 'Are the benchmark results synthetic?',
    a: 'The synthetic IIRS benchmark represents controlled offline validation on paired test sets. Real multi-sensor flight co-registration relies on actual flight candidate retrieval and geometric verification.',
  },
  {
    q: 'What data was used?',
    a: 'ISRO Chandrayaan-2 PDS-4 datasets covering high-latitude and polar observation tracks, with spatial index cataloging 1,514 common multi-sensor observation candidates and 500 validated demonstration points.',
  },
  {
    q: 'What are the current limitations?',
    a: 'Inference runtime is bounded to active candidate swaths. Completely untextured flat basalt plains with zero crater relief produce fewer inliers, where the system honestly reports INCONCLUSIVE or UNAVAILABLE rather than fabricating matches.',
  },
]

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div id="faq-section" className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-6 font-mono text-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800/80 mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-neutral-100">
              Technical FAQ & Evaluation Guide
            </h3>
          </div>
          <p className="text-xs text-neutral-400">
            Authoritative answers to common judging and methodological questions.
          </p>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
          10 CORE QUESTIONS
        </span>
      </div>

      <div className="space-y-2.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={idx}
              className="bg-neutral-950/70 border border-neutral-800 rounded-lg overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-4 text-xs font-semibold text-neutral-200 hover:text-amber-400 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-amber-500/70 text-[11px]">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{faq.q}</span>
                </span>
                <span className="text-neutral-500 font-bold">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-[11px] text-neutral-400 border-t border-neutral-800/60 leading-relaxed animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
