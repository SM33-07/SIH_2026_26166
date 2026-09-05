import React, { useEffect } from 'react'
import Header from './components/Header'
import OverviewScreen from './components/OverviewScreen'
import MatchingScreen from './components/MatchingScreen'
import ThreeSensorView from './components/ThreeSensorView'
import ResultsDashboard from './components/ResultsDashboard'
import EvaluationComparison from './components/EvaluationComparison'
import { useMatchStore } from './store/matchStore'

export default function App() {
  const { activeTab, initAppData } = useMatchStore()

  useEffect(() => {
    initAppData()
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 px-6 pb-12">
        {activeTab === 'overview' && <OverviewScreen />}
        {activeTab === 'matching' && <MatchingScreen />}
        {activeTab === 'threesensor' && <ThreeSensorView />}
        {activeTab === 'results' && <ResultsDashboard />}
        {activeTab === 'benchmark' && <EvaluationComparison />}
      </main>
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        SIH26166 Prototype • Chandrayaan-2 OHRC / TMC-2 / IIRS Image Correspondence • ISRO Space Technology
      </footer>
    </div>
  )
}
