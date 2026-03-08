// pages/calculation.js
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Hooks
import useAALProvinsi from '../hooks/useAALProvinsi'
import useChartData from '../hooks/useChartData'
import useDirectLoss from '../hooks/useDirectLoss'

// Components
import Header from '../components/Header'
import FilterChoropleth from '../components/FilterChoropleth'
const ChoroplethMap = dynamic(() => import('../components/ChoroplethMap'), { ssr: false })

import ChartsSection from '../components/ChartsSection'
import FilterDirectLoss from '../components/FilterDirectLoss'
const DirectLossMap = dynamic(() => import('../components/DirectLossMap'), { ssr: false })

import { useTheme } from '../context/ThemeContext'

export default function Calculation() {
  const { darkMode } = useTheme()

  // Choropleth state
  const [hazard, setHazard] = useState('')
  const [model, setModel] = useState('')
  const { geojson: aalGeojson } = useAALProvinsi()

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

      <main className="max-w-screen mx-auto py-10 px-6 space-y-6 mt-18">
        {/* AAL Choropleth */}
        <section className="w-full">
          <div className={`${cardBg} shadow-xs rounded-lg p-6 flex flex-col space-y-4 md:col-span-2 ${shadow} transition-colors duration-300`}>
            <h2 className={`text-2xl font-semibold mb-6 font-[SF Pro] ${headText}`}>
              Average Annual Loss di Indonesia
            </h2>
            <FilterChoropleth
              hazard={hazard}
              setHazard={setHazard}
              model={model}
              setModel={setModel}
            />
            <div className="h-[480px] bg-gray-700 rounded-lg overflow-hidden">
              <ChoroplethMap
                geojson={aalGeojson}
                hazard={hazard}
                model={model}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-6 py-2 bg-[#22D3EE] text-black rounded-4xl hover:bg-[#3B82F6] hover:text-white font-[SF Pro] transition"
                onClick={() => window.open('/api/aal-provinsi/download', '_blank')}
              >
                Unduh Data
              </button>
            </div>
          </div>
        </section>

        {/* AAL Charts */}
        <section className={`${cardBg} rounded-lg shadow-xs p-6 ${shadow} transition-colors duration-300`}>
          <h2 className={`text-2xl font-semibold px-4 mb-0.5 font-[SF Pro] ${headText}`}>
            Diagram Batang Average Annual Loss Provinsi
          </h2>
          <ChartsSection provs={provs} data={data} load={load} />
        </section>

        {/* Direct Loss */}
        <section className={`${cardBg} shadow-xs ${shadow} rounded-lg p-6 transition-colors duration-300`}>
          <h2 className={`text-2xl font-semibold font-[SF Pro] mb-6 ${headText}`}>
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
            <div className="h-[480px] bg-gray-700 rounded-lg overflow-hidden">
              <DirectLossMap
                geojson={dlGeojson}
                filters={filters}
                search={search}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
