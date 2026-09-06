export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] mt-12">
      <div className="max-w-screen-xl mx-auto px-5 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <div className="tele-label mb-2 text-amber-400">Mission</div>
          <div className="text-xs font-mono text-neutral-400">
            SIH26166 · Chandrayaan-2<br/>
            Multi-Modal Lunar Image Correspondence<br/>
            OHRC · TMC-2 · IIRS
          </div>
        </div>
        <div>
          <div className="tele-label mb-2 text-amber-400">Pipeline</div>
          <div className="text-xs font-mono text-neutral-500 space-y-1">
            <div>LOCATE → Spatial catalog query</div>
            <div>MATCH → Deep feature correspondence</div>
            <div>VERIFY → Geometric + geographic</div>
            <div>DECIDE → Tri-state evidence synthesis</div>
          </div>
        </div>
        <div>
          <div className="tele-label mb-2 text-amber-400">Scientific Note</div>
          <div className="text-[10px] font-mono text-neutral-500 leading-relaxed">
            All metrics, coordinates, and decisions are provided by the
            inference backend. The consistency score is not a calibrated
            probability. IIRS geolocation is approximate in the current
            proxy product.
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-5 py-2.5 text-[9px] font-mono text-neutral-600 text-center uppercase tracking-widest bg-black">
        Data: ISRO Chandrayaan-2 · Inference: LoFTR + ResNet-18 · Backend: FastAPI + PyTorch
      </div>
    </footer>
  )
}
