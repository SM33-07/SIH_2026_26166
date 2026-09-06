import React, { useEffect } from 'react'
import Header from './components/Header'
import MoonHero from './components/MoonHero'
import SelectedRegion from './components/SelectedRegion'
import CorrespondenceSection from './components/CorrespondenceSection'
import ThreeWayIntegration from './components/ThreeWayIntegration'
import PerformanceSection from './components/PerformanceSection'
import MethodologySection from './components/MethodologySection'
import LimitationsSection from './components/LimitationsSection'
import StarfieldBackground from './components/StarfieldBackground'
import { useMatchStore } from './store/matchStore'

export default function App() {
  const { loadInitialData } = useMatchStore()

  useEffect(() => {
    loadInitialData()
  }, [])

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F2F2F2] font-mono selection:bg-amber-500 selection:text-black">
      {/* Dynamic Starfield Canvas Background */}
      <StarfieldBackground />

      <div className="relative z-10">
        <Header />
        <main>
          <MoonHero />
          <SelectedRegion />
          <CorrespondenceSection />
          <ThreeWayIntegration />
          <PerformanceSection />
          <MethodologySection />
          <LimitationsSection />
        </main>
        <footer className="py-8 border-t border-[#252525] bg-[#050505]/90 backdrop-blur-sm text-center text-xs text-[#5F5F5F]">
          CHANDRAYAAN-2 MULTI-MODAL LUNAR CORRESPONDENCE ENGINE • SIH26166
        </footer>
      </div>
    </div>
  )
}
