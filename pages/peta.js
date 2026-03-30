// pages/peta.js
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'

// Load map client-side only (Leaflet needs window)
const CogHazardMap = dynamic(
  () => import('../components/CogHazardMap'),
  {
    ssr: false, loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0D0F12]">
        <div className="flex flex-col items-center gap-3 text-white">
          <svg className="animate-spin w-10 h-10 text-[#1E5C9A]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium">Memuat peta…</span>
        </div>
      </div>
    )
  }
)

export default function PetaHazard() {
  const { darkMode } = useTheme()

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#0D0F12]' : 'bg-gray-100'}`}>
      <Header />

      {/* Full-screen map area, offset by header height */}
      <main className="flex-1 pt-[40px] overflow-hidden">
        <div className="w-full h-full">
          <CogHazardMap />
        </div>
      </main>
    </div>
  )
}
