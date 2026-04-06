import { useRef, useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getKotaBoundary } from '../src/lib/api'
import BuildingInfoPanel from './BuildingInfoPanel'

const icons = {
  FS: L.icon({
    iconUrl: 'icons/healthcare.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  FD: L.icon({
    iconUrl: 'icons/education.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  ELECTRICITY: L.icon({
    iconUrl: 'icons/electricity.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  HOTEL: L.icon({
    iconUrl: 'icons/hotel.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  AIRPORT: L.icon({
    iconUrl: 'icons/airport.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  })
}

function getJenksBreaks(data, nClasses) {
  if (data.length === 0) return []
  const sorted = data.slice().sort((a, b) => a - b)
  const lowerClassLimits = Array(sorted.length + 1).fill().map(() => Array(nClasses + 1).fill(0))
  const varianceCombinations = Array(sorted.length + 1).fill().map(() => Array(nClasses + 1).fill(Infinity))

  for (let i = 1; i <= nClasses; i++) {
    lowerClassLimits[1][i] = 1
    varianceCombinations[1][i] = 0
    for (let j = 2; j <= sorted.length; j++) {
      varianceCombinations[j][i] = Infinity
    }
  }

  for (let l = 2; l <= sorted.length; l++) {
    let sum = 0, sumSquares = 0, w = 0
    let varianceTemp = 0

    for (let m = 1; m <= l; m++) {
      const val = sorted[l - m]
      sum += val
      sumSquares += val * val
      w++
      varianceTemp = sumSquares - (sum * sum) / w
      const i4 = l - m
      if (i4 !== 0) {
        for (let j = 2; j <= nClasses; j++) {
          const val2 = varianceTemp + varianceCombinations[i4][j - 1]
          if (varianceCombinations[l][j] > val2) {
            lowerClassLimits[l][j] = i4 + 1
            varianceCombinations[l][j] = val2
          }
        }
      }
    }
    varianceCombinations[l][1] = varianceTemp
    lowerClassLimits[l][1] = 1
  }

  const breaks = Array(nClasses + 1).fill(0)
  breaks[nClasses] = sorted[sorted.length - 1]
  breaks[0] = sorted[0]

  let k = sorted.length
  for (let count = nClasses; count > 1; count--) {
    const idx = lowerClassLimits[k][count] - 2
    breaks[count - 1] = sorted[idx]
    k = lowerClassLimits[k][count] - 1
  }
  return breaks
}

export default function DirectLossMap({ geojson, cityGeojson, filters, search, selectedKota }) {
  const { darkMode } = useTheme()
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const clusterRef = useRef(null)
  const legendRef = useRef(null)
  const boundaryRef = useRef(null)
  const [selectedBuildingData, setSelectedBuildingData] = useState(null)
  const [activeBuildingTab, setActiveBuildingTab] = useState('eq')

  // Drag state for Building Detail Panel
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e) => {
    // Only drag on the header area or panel itself, not on close button
    if (e.target.closest('.close-btn')) return;
    setIsDragging(true)
    dragStartPos.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPanelPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      })
    }
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const formatRupiah = (num) =>
    'Rp ' + Number(num).toLocaleString('id-ID', { minimumFractionDigits: 0 })

  function formatNumberWithUnit(value) {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T'
    if (value >= 1e9) return (value / 1e9).toFixed(2) + ' M'
    if (value >= 1e6) return (value / 1e6).toFixed(2) + ' jt'
    if (value >= 1e3) return (value / 1e3).toFixed(2) + ' rb'
    return value.toString()
  }

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map(mapEl.current, { zoomControl: false }).setView([-8.9, 116.4], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      opacity: 0.7
    }).addTo(mapRef.current)

    clusterRef.current = L.layerGroup()
    mapRef.current.addLayer(clusterRef.current)
  }, [])

  // Handle zoom adjustment on fullscreen
  useEffect(() => {
    const handleFullscreen = () => {
      const map = mapRef.current
      if (!map) return
      if (document.fullscreenElement) {
        map.setZoom(map.getZoom() + 2)
      } else {
        map.setZoom(map.getZoom() - 2)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (boundaryRef.current) {
      mapRef.current.removeLayer(boundaryRef.current)
      boundaryRef.current = null
    }
    if (!selectedKota) return
    getKotaBoundary(selectedKota)
      .then(data => {
        if (!data || !data.features || data.features.length === 0) return
        boundaryRef.current = L.geoJSON(data, {
          style: {
            color: '#3b82f6',
            weight: 2.5,
            opacity: 0.9,
            fillOpacity: 0,
            dashArray: '6 4'
          }
        }).addTo(mapRef.current)
      })
      .catch(() => { })
  }, [selectedKota])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const cluster = clusterRef.current
    
    if (legendRef.current) {
        map.removeControl(legendRef.current)
        legendRef.current = null
    }
    
    cluster.clearLayers()
    if (!geojson) return

    const selectedProvinsi = filters.provinsi || null
    const kota = filters.kota || null

    const allDirectLossValues = geojson.features
      .filter(f => {
        const p = f.properties
        if (selectedProvinsi && p.provinsi !== selectedProvinsi) return false
        if (selectedKota && p.kota !== selectedKota) return false
        const type = (p.id_bangunan || '').split('_')[0].toUpperCase()
        if (!filters[type]) return false
        return true
      })
      .map(f => {
        const p = f.properties
        return Object.entries(p)
          .filter(([k]) => k.startsWith('direct_loss_'))
          .reduce((sum, [_, v]) => sum + (v || 0), 0)
      })

    geojson.features
      .forEach(f => {
        const p = f.properties
        const [lon, lat] = f.geometry.coordinates
        const type = (p.id_bangunan || '').split('_')[0].toUpperCase()

        if (!filters[type]) return
        if (selectedKota && p.kota !== selectedKota) return
        if (search && !p.nama_gedung.toLowerCase().includes(search.toLowerCase())) return

        const directLossValue = Object.entries(p)
          .filter(([k]) => k.startsWith('direct_loss_'))
          .reduce((sum, [_, v]) => sum + (v || 0), 0)

        const marker = L.marker([lat, lon], { icon: icons[type] || icons.FD, directLossValue })
          .bindTooltip(p.nama_gedung, { permanent: false, direction: 'right', offset: [10, 0], className: 'building-label' })
        
        marker.on('click', () => {
          // Reset panel position when selecting a new building
          setPanelPos({ x: 0, y: 0 })
          setSelectedBuildingData(p)
        })
        
        cluster.addLayer(marker)
      })



    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      const html = `
        <h4 style="font-weight:bold; margin-bottom:6px; font-size:0.75rem;">Kerugian (Rp)</h4>
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <i style="background:#ffeb3b; width:14px; height:10px; display:inline-block; margin-right:6px;"></i>
          <span>Rendah</span>
        </div>
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <i style="background:#ff9800; width:14px; height:10px; display:inline-block; margin-right:6px;"></i>
          <span>Sedang</span>
        </div>
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <i style="background:#f44336; width:14px; height:10px; display:inline-block; margin-right:6px;"></i>
          <span>Tinggi</span>
        </div>
        <hr style="margin:6px 0; border:none; border-top:1px solid #eee;"/>
        <h4 style="margin-bottom:4px; font-size:0.75rem;">Jenis Gedung</h4>
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <img src="icons/healthcare.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Healthcare Facilities</span>
        </div>
        <div style="display:flex; align-items:center;">
          <img src="icons/education.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Educational Facilities</span>
        </div>
        <div style="display:flex; align-items:center; margin-top:3px;">
          <img src="icons/electricity.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Electricity</span>
        </div>
        <div style="display:flex; align-items:center; margin-top:3px;">
          <img src="icons/hotel.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Hotel</span>
        </div>
        <div style="display:flex; align-items:center; margin-top:3px;">
          <img src="icons/airport.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Airport</span>
        </div>
      `
      div.innerHTML = html
      return div
    }
    legend.addTo(map)
    legendRef.current = legend

    const bounds = cluster.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { maxZoom: 13, paddingBottomRight: [180, 50] })
  }, [geojson, filters, search, selectedKota])

  return (
    <div className="relative h-full">
      <style>
        {`
          .rounded-icon {
            border-radius: 50%;
            background-color: white;
            padding: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .rounded-icon img {
            border-radius: 50%;
          }
          .custom-popup-content {
            padding-right: 5px;
          }
          
          /* Mobile adjustments */
          @media (max-width: 640px) {
            .custom-popup-content {
              font-size: 0.7rem;
            }
            .leaflet-popup-content {
              margin: 4px;
            }
          }
          
          .compact-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 8px;
          }
          .compact-popup .leaflet-popup-content {
            margin: 10px 12px;
            line-height: 1.2;
          }
        `}
      </style>
      <div ref={mapEl} className="h-full w-full rounded-lg" />
      {selectedBuildingData && (
        <div 
          className={`absolute top-20 left-3 md:left-[280px] z-[2000] backdrop-blur-xl rounded-xl shadow-2xl p-2.5 md:p-3 w-[calc(100vw-24px)] md:w-[220px] max-h-[80vh] overflow-y-auto custom-scrollbar border animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto cursor-grab active:cursor-grabbing transition-all ${
            darkMode ? 'bg-[#0D0F12]/95 border-white/10 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
          }`}
          style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="flex justify-between items-center pb-2 mb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-300' : 'text-slate-500'}`}>Building Info</span>
            </div>
            <button 
              onClick={() => { setSelectedBuildingData(null); }} 
              className={`close-btn transition-all p-1.5 rounded-lg ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <BuildingInfoPanel 
            data={selectedBuildingData}
            darkMode={darkMode}
            dlExposure={(cityGeojson?.features || []).find(f => 
              (f.properties.nama_kota || f.properties.id_kota || '').toUpperCase() === (selectedBuildingData?.kota || '').toUpperCase()
            )?.properties?.dl_exposure}
            activeTab={activeBuildingTab}
            setActiveTab={setActiveBuildingTab}
          />
        </div>
      )}
    </div>
  )
}
