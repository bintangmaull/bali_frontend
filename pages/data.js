// pages/data.js
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Hooks
import useChartData from '../hooks/useChartData'
import useDirectLoss from '../hooks/useDirectLoss'

// Components
import Header from '../components/Header'
import CrudHSBGN from '../components/CrudHSBGN'
import FilterPetaBencana from '../components/FilterPetaBencana'
import { useTheme } from '../context/ThemeContext'

// Dynamic Imports
const HazardMap = dynamic(() => import('../components/HazardMap'), { ssr: false })
const DisasterCurves = dynamic(() => import('../components/DisasterCurves'), { ssr: false })
const PetaBencana = dynamic(() => import('../components/PetaBencana'), { ssr: false })

export default function Home() {
  const { darkMode } = useTheme()

  // Charts state
  const { provs, data, load } = useChartData()

  // Direct Loss state
  const direct = useDirectLoss()

  // Lifted filters for buildings
  const [selectedProv, setSelectedProv] = useState('')
  const [selectedKota, setSelectedKota] = useState('')
  const [layer, setLayer] = useState('hazard_gempa_mmi_500')

  // Classes berdasarkan mode
  const pageBg = darkMode ? 'bg-[#0D0F12]' : 'bg-gray-100'
  const cardBg = darkMode ? 'bg-[#1E2023]' : 'bg-white'
  const shadow = darkMode ? 'shadow-gray-600' : 'shadow-gray-300'
  const headText = darkMode ? 'text-white' : 'text-gray-900'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <Header />

      <main className="max-w-screen mx-auto pb-4 md:pb-6 px-2 md:px-6 space-y-4 pt-32 md:pt-24 lg:pt-20">
        {/* Manajemen Data Bangunan */}
        <section className={`${cardBg} rounded-xl p-3 md:p-6 shadow-xs ${shadow} transition-colors duration-300`}>
          <h2 className={`text-xl md:text-2xl font-bold mb-6 ${headText}`}>Manajemen Data Bangunan</h2>
          <HazardMap
            provinsi={selectedProv}
            kota={selectedKota}
            setProvinsi={setSelectedProv}
            setKota={setSelectedKota}
          />
        </section>

        {/* HSBGN */}
        <section className={`${cardBg} rounded-xl p-3 md:p-6 shadow-xs ${shadow} w-full max-w-3xl mx-auto transition-colors duration-300`}>
          <h2 className={`text-xl md:text-2xl font-bold mb-2 ${headText}`}>Manajemen Harga Satuan Bangunan Gedung Negara</h2>
          <CrudHSBGN />
        </section>

        {/* Peta Bencana */}
        <section className="w-full">
          <div className={`${cardBg} shadow-xs rounded-lg p-6 flex flex-col space-y-4 md:col-span-2 ${shadow} transition-colors duration-300`}>
            <PetaBencana />
          </div>
        </section>

        {/* Kurva Kerentanan */}
        <section className={`${cardBg} rounded-xl p-6 shadow-xs ${shadow} transition-colors duration-300`}>
          <h2 className={`text-2xl font-bold mb-2 ${headText}`}>Kurva Kerentanan</h2>
          <DisasterCurves />
        </section>
      </main>
    </div>
  )
}
