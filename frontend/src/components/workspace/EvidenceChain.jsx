import React from 'react'

export default function EvidenceChain({ chain = [], activeStep = null, onSelectStep }) {
  return (
    <div className="w-full bg-[#080a0e] border border-neutral-800/90 rounded-lg p-4 font-mono text-xs text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Hierarchical Evidence Chain
          </h4>
        </div>
        <span className="text-[10px] text-neutral-500">
          STEPWISE VERIFICATION PROTOCOL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 my-1">
        {chain.map((item, idx) => {
          const isPass = item.status === 'PASS'
          const isSelected = activeStep === item.id

          return (
            <div
              key={item.id || idx}
              onClick={() => onSelectStep?.(item.id)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 bg-neutral-900 shadow-md'
                  : isPass
                  ? 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
                  : 'border-neutral-800 bg-neutral-950/40 text-neutral-500'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-neutral-500 font-bold">{item.step}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    isPass
                      ? 'text-emerald-400 bg-emerald-950/40'
                      : 'text-neutral-400 bg-neutral-900'
                  }`}
                >
                  {isPass ? 'VERIFIED ✓' : 'CHECK'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-neutral-200 mb-1">{item.title}</p>
              <p className="text-[9.5px] text-neutral-400 truncate">{item.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
