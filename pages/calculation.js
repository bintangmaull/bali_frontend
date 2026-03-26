// pages/calculation.js
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Hooks
import useAALKota from '../hooks/useAALKota'
import useChartData from '../hooks/useChartData'
import useDirectLoss from '../hooks/useDirectLoss'

// Components
import Header from '../components/Header'
import FilterChoropleth from '../components/FilterChoropleth'
const ChoroplethMap = dynamic(() => import('../components/ChoroplethMap'), { ssr: false })

const ChartsSection = dynamic(() => import('../components/ChartsSection'), { ssr: false })
import FilterDirectLoss from '../components/FilterDirectLoss'
const DirectLossMap = dynamic(() => import('../components/DirectLossMap'), { ssr: false })

import { useTheme } from '../context/ThemeContext'

export default function Calculation() {
  const { darkMode } = useTheme()

  // Choropleth state
  const [hazard, setHazard] = useState('')
  const [model, setModel] = useState('')
  const { geojson: aalGeojson } = useAALKota()

  // Charts state
  const { provs, data, load } = useChartData()

  // Direct Loss state
  const {
    provList,
    kotaList,
    selectedProv,
    setSelectedProv,
    selectedKota,
    setSelectedKota,
    filters,
    setFilters,
    search,
    setSearch,
    geojson: dlGeojson
  } = useDirectLoss()

  // Classes berdasarkan mode
  const pageBg = darkMode ? 'bg-[#0D0F12] text-gray-200' : 'bg-gray-100 text-gray-800'
  const cardBg = darkMode ? 'bg-[#1E2023]' : 'bg-white'
  const shadow = darkMode ? 'shadow-gray-600' : 'shadow-gray-300'
  const headText = darkMode ? 'text-white' : 'text-gray-900'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <Header />

      <main className="max-w-screen mx-auto pb-6 px-6 space-y-4 pt-32 md:pt-24 lg:pt-20">
        {/* AAL Choropleth */}
        <section className="w-full">
          <div className={`${cardBg} shadow-xs rounded-lg p-6 flex flex-col space-y-3 md:col-span-2 ${shadow} transition-colors duration-300`}>
            <h2 className={`text-2xl font-semibold mb-4 font-[SF Pro] ${headText}`}>
              Average Annual Loss per Kota di Provinsi Bali
            </h2>
            <FilterChoropleth
              hazard={hazard}
              setHazard={setHazard}
              model={model}
              setModel={setModel}
            />
            <div className="relative h-[450px] bg-gray-700 rounded-lg overflow-hidden group">
              <ChoroplethMap
                geojson={aalGeojson}
                hazard={hazard}
                model={model}
              />
              <div className="absolute top-4 right-4 z-[1000] transition-opacity duration-300">
                <button
                  className="px-4 py-1.5 bg-[#22D3EE] text-black rounded-4xl hover:bg-[#3B82F6] hover:text-white font-[SF Pro] transition text-sm shadow-lg flex items-center gap-2"
                  onClick={() => window.open('/api/aal-kota/download', '_blank')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Unduh Data
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AAL Charts */}
        <section className={`${cardBg} rounded-lg shadow-xs p-6 ${shadow} transition-colors duration-300`}>
          <ChartsSection provs={provs} data={data} load={load} />
        </section>

        {/* Direct Loss */}
        <section className={`${cardBg} shadow-xs ${shadow} rounded-lg p-6 transition-colors duration-300`}>
          <h2 className={`text-2xl font-semibold font-[SF Pro] mb-2 ${headText}`}>
            Informasi Direct Loss
          </h2>
          <div className="space-y-6">
            <FilterDirectLoss
              provList={provList}
              kotaList={kotaList}
              selectedProv={selectedProv}
              setSelectedProv={setSelectedProv}
              selectedKota={selectedKota}
              setSelectedKota={setSelectedKota}
              filters={filters}
              setFilters={setFilters}
              search={search}
              setSearch={setSearch}
              geojson={dlGeojson}
            />
            <div className="h-[350px] md:h-[480px] bg-gray-700 rounded-lg overflow-hidden">
              <DirectLossMap
                geojson={dlGeojson}
                cityGeojson={aalGeojson}
                filters={filters}
                search={search}
                selectedKota={selectedKota}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
