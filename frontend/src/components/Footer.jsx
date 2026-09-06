export default function Footer() {
  return (
    <footer className="border-t border-lunar-border bg-lunar-card mt-8">
      <div className="max-w-screen-xl mx-auto px-5 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <div className="tele-label mb-2">Mission</div>
          <div className="text-xs font-mono text-slate-500">
            SIH26166 · Chandrayaan-2<br/>
            Multi-Modal Lunar Image Correspondence<br/>
            OHRC · TMC-2 · IIRS
          </div>
        </div>
        <div>
          <div className="tele-label mb-2">Pipeline</div>
          <div className="text-xs font-mono text-slate-600 space-y-0.5">
            <div>LOCATE → Spatial catalog query</div>
            <div>MATCH → Deep feature correspondence</div>
            <div>VERIFY → Geometric + geographic</div>
            <div>DECIDE → Tri-state evidence synthesis</div>
          </div>
        </div>
        <div>
          <div className="tele-label mb-2">Scientific Note</div>
          <div className="text-[10px] font-mono text-slate-600 leading-relaxed">
            All metrics, coordinates, and decisions are provided by the
            inference backend. The consistency score is not a calibrated
            probability. IIRS geolocation is approximate in the current
            proxy product.
          </div>
        </div>
      </div>
      <div className="border-t border-lunar-border/40 px-5 py-2 text-[9px] font-mono text-slate-700 text-center uppercase tracking-widest">
        Data: ISRO Chandrayaan-2 · Inference: LoFTR + ResNet-18 · Backend: FastAPI + PyTorch
      </div>
    </footer>
  )
}
