import { useRef, useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getKotaBoundary } from '../src/lib/api'

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
  const [selectedBuildingHtml, setSelectedBuildingHtml] = useState(null)

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
          const luasVal = parseFloat(p.luas) || 0;
          const hsbgnVal = parseFloat(p.hsbgn) || 0;
          const assetValue = luasVal * hsbgnVal;

          const formatPercent = (loss, totalVal) => {
            if (!totalVal || totalVal === 0 || !loss) return '<span class="text-gray-400 font-normal">(0%)</span>'
            const pct = (loss / totalVal) * 100
            if (pct < 0.1 && pct > 0) return '<span class="text-gray-400 font-normal">(<0.1%)</span>'
            if (pct >= 99.9) return '<span class="text-[#2FA69A] font-normal opacity-80">(100%)</span>'
            return `<span class="text-gray-500 font-normal opacity-80">(${pct.toFixed(1)}%)</span>`
          }

          const assetStr = assetValue > 0 ? formatNumberWithUnit(assetValue) : '-';

          // Helper to check if any value in a group is > 0
          const hasBanjirR = [p.direct_loss_r_250, p.direct_loss_r_100, p.direct_loss_r_50, p.direct_loss_r_25, p.direct_loss_r_10, p.direct_loss_r_5, p.direct_loss_r_2].some(v => (v || 0) > 0);
          const hasBanjirRC = [p.direct_loss_rc_250, p.direct_loss_rc_100, p.direct_loss_rc_50, p.direct_loss_rc_25, p.direct_loss_rc_10, p.direct_loss_rc_5, p.direct_loss_rc_2].some(v => (v || 0) > 0);
          const hasGempa = true; // Always show earthquake section since we have ratios in dl_exposure now
          const hasTsunami = (p.direct_loss_inundansi || 0) > 0;

          // Helper to conditionally render a row
          const renderRow = (label, val, className = "") => {
            const numVal = parseFloat(val) || 0;
            return '<div class="' + className + '">' + label + ': <b class="' + (darkMode ? 'text-white' : 'text-gray-800') + '">' + formatNumberWithUnit(numVal) + '</b> ' + formatPercent(numVal, assetValue) + '</div>';
          };

          let hazardContent = '';

          if (hasGempa) {
            hazardContent += `
              <div class="flex border-l-2 border-[#2F6FAF] pl-1">
                <div class="w-12 text-[8px] font-bold shrink-0 ${darkMode ? 'text-blue-400' : 'text-[#1E5C9A]'}">PGA</div>
                <div class="flex-1 grid grid-cols-1 gap-y-0 text-[8px] leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-600'}">
                  ${['1000', '500', '250', '200', '100'].map(rp => {
                    const cityFeature = (cityGeojson?.features || []).find(f => 
                      (f.properties.nama_kota || f.properties.id_kota || '').toUpperCase() === (p.kota || '').toUpperCase()
                    );
                    const dlExp = cityFeature?.properties?.dl_exposure || {};
                    
                    // Map building type to ratio category
                    const id = (p.id_bangunan || '').toUpperCase();
                    let category = 'bmn';
                    if (id.startsWith('FS')) category = 'healthcare';
                    else if (id.startsWith('FD')) category = 'educational';
                    else if (id.startsWith('ELECTRICITY')) category = 'electricity';
                    else if (id.startsWith('AIRPORT')) category = 'airport';
                    else if (id.startsWith('HOTEL')) category = 'hotel';
                    else if (id.startsWith('RESIDENTIAL')) category = 'residential';
                    
                    const catData = dlExp[category] || {};
                    const ratio = catData[`pga_${rp}`];
                    const ratioStr = ratio != null ? (parseFloat(ratio) * 100).toFixed(6) + '%' : '-';
                    
                    return `<div>${rp}th: <b class="${darkMode ? 'text-blue-300' : 'text-blue-700'}">${ratioStr}</b> (Loss Ratio)</div>`;
                  }).join('')}
                </div>
              </div>
            `;
          }

          if (hasBanjirR) {
            hazardContent += `
              <div class="flex border-l-2 border-green-500 pl-1">
                <div class="w-12 text-[8px] font-bold shrink-0 ${darkMode ? 'text-green-400' : 'text-green-600'}">Banjir R</div>
                <div class="flex-1 grid grid-cols-2 gap-x-1 gap-y-0 text-[8px] leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-600'}">
                  ${renderRow('250th', p.direct_loss_r_250)}
                  ${renderRow('100th', p.direct_loss_r_100)}
                  ${renderRow('50th', p.direct_loss_r_50)}
                  ${renderRow('25th', p.direct_loss_r_25)}
                  ${renderRow('10th', p.direct_loss_r_10)}
                  ${renderRow('5th', p.direct_loss_r_5)}
                  ${renderRow('2th', p.direct_loss_r_2, 'col-span-2')}
                </div>
              </div>
            `;
           }

           if (hasBanjirRC) {
            hazardContent += `
              <div class="flex border-l-2 border-emerald-500 pl-1">
                <div class="w-12 text-[8px] font-bold shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}">Banjir RC</div>
                <div class="flex-1 grid grid-cols-2 gap-x-1 gap-y-0 text-[8px] leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-600'}">
                  ${renderRow('250th', p.direct_loss_rc_250)}
                  ${renderRow('100th', p.direct_loss_rc_100)}
                  ${renderRow('50th', p.direct_loss_rc_50)}
                  ${renderRow('25th', p.direct_loss_rc_25)}
                  ${renderRow('10th', p.direct_loss_rc_10)}
                  ${renderRow('5th', p.direct_loss_rc_5)}
                  ${renderRow('2th', p.direct_loss_rc_2, 'col-span-2')}
                </div>
              </div>
            `;
           }

           if (hasTsunami) {
             hazardContent += `
              <div class="flex border-l-2 border-[#6FB5C2] pl-1">
                <div class="w-12 text-[8px] font-bold shrink-0 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}">Tsunami</div>
                <div class="flex-1 text-[8px] leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-600'}">
                  ${renderRow('Total', p.direct_loss_inundansi)}
                </div>
              </div>
             `;
           }

           if (!hasGempa && !hasBanjirR && !hasBanjirRC && !hasTsunami) {
             hazardContent += `<div class="text-[9px] text-gray-400 italic text-center py-1">Tidak ada risiko (Rp 0)</div>`;
           }

          const popupHtml = `
            <div class="flex flex-col gap-1.5 font-[SF Pro] text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}">
              <!-- Header -->
              <div>
                <h3 class="font-bold text-[11px] leading-tight ${darkMode ? 'text-white' : 'text-gray-800'}">${p.nama_gedung || 'Tanpa Nama'}</h3>
                <p class="text-[9px] italic mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}">${p.taxonomy || '-'} • Lt: ${p.jumlah_lantai || '-'}</p>
                <p class="text-[8px] mt-0.5 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}">${p.alamat || '-'}</p>
              </div>
              
              <!-- Core Attrs -->
              <div class="grid grid-cols-2 gap-1 text-[9px] p-1 rounded border ${
                darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-100'
              }">
                <div class="flex flex-col leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}">
                  <span class="text-[8px] uppercase tracking-tighter opacity-70">Luas</span>
                  <span class="font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}">${p.luas || '-'} m²</span>
                </div>
                <div class="flex flex-col leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}">
                  <span class="text-[8px] uppercase tracking-tighter opacity-70">Nilai Aset</span>
                  <span class="font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}">Rp ${assetStr}</span>
                </div>
              </div>

              <!-- Hazards -->
              <div class="space-y-1 mt-0.5 border-t pt-1 ${darkMode ? 'border-gray-800' : 'border-gray-100'}">
                ${hazardContent}
              </div>
            </div>
          `;

          // Reset panel position when selecting a new building
          setPanelPos({ x: 0, y: 0 })
          setSelectedBuildingHtml(popupHtml)
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
      {selectedBuildingHtml && (
        <div 
          className={`absolute top-24 left-[280px] z-[2000] backdrop-blur-md rounded-xl shadow-2xl p-4 w-[240px] border pointer-events-auto cursor-grab active:cursor-grabbing transition-all ${
            darkMode ? 'bg-[#1E2023]/95 border-gray-700 shadow-black/40' : 'bg-white/95 border-gray-100 shadow-xl'
          }`}
          style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="flex justify-end pb-1 mb-1 border-b border-gray-100">
            <button onClick={() => setSelectedBuildingHtml(null)} className="close-btn text-gray-400 hover:text-gray-800 focus:outline-none cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: selectedBuildingHtml }} />
        </div>
      )}
    </div>
  )
}
