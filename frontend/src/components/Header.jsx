import React, { useState, useEffect } from 'react'

export default function Header() {
  const [activeSection, setActiveSection] = useState('hero')

  const navItems = [
    { id: 'hero', label: 'OVERVIEW' },
    { id: 'region', label: 'REGION' },
    { id: 'correspondence', label: 'CORRESPONDENCE' },
    { id: 'integration', label: 'INTEGRATION' },
    { id: 'performance', label: 'PERFORMANCE' },
    { id: 'methodology', label: 'METHOD' },
    { id: 'limitations', label: 'LIMITATIONS' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => document.getElementById(item.id))
      const scrollPosition = window.scrollY + 180

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-md border-b border-[#252525] px-6 py-3 font-mono text-xs text-[#A0A0A0]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand & ISRO / Chandrayaan-2 Tag */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-none animate-pulse" />
          <span className="font-bold text-[#F2F2F2] tracking-wider uppercase text-sm">
            CHANDRAYAAN-2 <span className="text-[#5F5F5F] font-normal">| SIH26166</span>
          </span>
        </div>

        {/* Navigation Item Links */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`transition-colors uppercase tracking-wider py-1 border-b-2 cursor-pointer ${
                activeSection === item.id
                  ? 'text-amber-500 border-amber-500 font-bold'
                  : 'text-[#A0A0A0] hover:text-[#F2F2F2] border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* System Status Pill */}
        <div className="flex items-center space-x-2 border border-[#252525] bg-[#0D0D0D] px-3 py-1 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[#F2F2F2] font-semibold">MISSION CONTROL ONLINE</span>
        </div>
      </div>
    </header>
  )
}
