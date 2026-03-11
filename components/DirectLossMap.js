import { useRef, useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { getKotaBoundary } from '../src/lib/api'

const icons = {
  BMN: L.icon({
    iconUrl: 'icons/gedungnegara.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  FS: L.icon({
    iconUrl: 'icons/kesehatan.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  FD: L.icon({
    iconUrl: 'icons/sekolah.svg',
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

export default function DirectLossMap({ geojson, filters, search, selectedKota }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const clusterRef = useRef(null)
  const legendRef = useRef(null)
  const boundaryRef = useRef(null)

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

    clusterRef.current = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      chunkInterval: 200
    })
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
        const type = (p.id_bangunan || '').split('_')[0]
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
        const type = (p.id_bangunan || '').split('_')[0]

        if (!filters[type]) return
        if (selectedKota && p.kota !== selectedKota) return
        if (search && !p.nama_gedung.toLowerCase().includes(search.toLowerCase())) return

        const directLossValue = Object.entries(p)
          .filter(([k]) => k.startsWith('direct_loss_'))
          .reduce((sum, [_, v]) => sum + (v || 0), 0)

        const popupHtml = `
          <div class="custom-popup-content" style="font-family:'SF Pro', sans-serif;">
            <div style="font-size:1rem; font-weight:700; color:#2563eb; margin-bottom:2px; border-bottom:1px solid #e5e7eb; padding-bottom:2px;">${p.nama_gedung}</div>
            <div style="font-size:0.75rem; color:#4b5563; margin-bottom:4px; line-height:1.2;">
              <span style="font-style:italic; font-weight:600;">${p.taxonomy}</span> &bull; Luas: <b>${p.luas} m²</b><br/>
              Jumlah Lantai: <b>${p.jumlah_lantai || '-'}</b><br/>
              <span style="color:#6b7280;">${p.alamat}</span><br/>
              <span style="font-size:0.85em; color:#9ca3af;">${p.kota}, ${p.provinsi}</span>
            </div>
            
            <div style="border-top:1px solid #f3f4f6; padding-top:4px;">
              <div style="font-weight:700; color:#3b82f6; margin-bottom:1px; font-size:0.8rem;">Kerugian Gempa</div>
              <div style="font-size:0.75rem; padding-left:4px; color:#4b5563; margin-bottom:4px;">
                500-th: <b>${formatNumberWithUnit(p.direct_loss_gempa_500 || 0)}</b><br/>
                250-th: <b>${formatNumberWithUnit(p.direct_loss_gempa_250 || 0)}</b><br/>
                100-th: <b>${formatNumberWithUnit(p.direct_loss_gempa_100 || 0)}</b>
              </div>

              <div style="font-weight:700; color:#10b981; margin-bottom:1px; font-size:0.8rem;">Kerugian Banjir</div>
              <div style="font-size:0.75rem; padding-left:4px; color:#4b5563; margin-bottom:4px;">
                100-th: <b>${formatNumberWithUnit(p.direct_loss_banjir_100 || 0)}</b><br/>
                50-th: <b>${formatNumberWithUnit(p.direct_loss_banjir_50 || 0)}</b><br/>
                25-th: <b>${formatNumberWithUnit(p.direct_loss_banjir_25 || 0)}</b>
              </div>

              <div style="font-weight:700; color:#f59e0b; margin-bottom:1px; font-size:0.8rem;">Kerugian Longsor</div>
              <div style="font-size:0.75rem; padding-left:4px; color:#4b5563; margin-bottom:4px;">
                5-th: <b>${formatNumberWithUnit(p.direct_loss_longsor_5 || 0)}</b><br/>
                2-th: <b>${formatNumberWithUnit(p.direct_loss_longsor_2 || 0)}</b>
              </div>

              <div style="font-weight:700; color:#ef4444; margin-bottom:1px; font-size:0.8rem;">Kerugian Gunung Berapi</div>
              <div style="font-size:0.75rem; padding-left:4px; color:#4b5563;">
                 250-th: <b>${formatNumberWithUnit(p.direct_loss_gunungberapi_250 || 0)}</b><br/>
                 100-th: <b>${formatNumberWithUnit(p.direct_loss_gunungberapi_100 || 0)}</b><br/>
                 50-th: <b>${formatNumberWithUnit(p.direct_loss_gunungberapi_50 || 0)}</b>
              </div>
            </div>
          </div>
        `

        const marker = L.marker([lat, lon], { icon: icons[type] || icons.FD, directLossValue })
          .bindPopup(popupHtml, { maxWidth: 280, minWidth: 150 })
          .bindTooltip(p.nama_gedung, { permanent: false, direction: 'right', offset: [10, 0], className: 'building-label' })
        
        cluster.addLayer(marker)
      })

    const jenksBreaks = getJenksBreaks(allDirectLossValues, 3)

    cluster.options.iconCreateFunction = function (cluster) {
      const markers = cluster.getAllChildMarkers()
      const avgDirectLoss = markers.reduce((acc, m) => acc + (m.options.directLossValue || 0), 0) / markers.length

      let color = '#ffeb3b'
      if (avgDirectLoss > jenksBreaks[2]) color = '#f44336'
      else if (avgDirectLoss > jenksBreaks[1]) color = '#ff9800'

      const count = cluster.getChildCount()
      const html = `
        <div style="background-color: ${color}; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; color: black; font-weight: bold; opacity: 0.8;">
          ${count}
        </div>
      `
      return L.divIcon({ html, className: 'custom-cluster-icon', iconSize: L.point(40, 40) })
    }

    cluster.refreshClusters()

    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      const colors = ['#ffeb3b', '#ff9800', '#f44336']

      if (jenksBreaks.length < 4) {
        div.innerHTML = ''
        return div
      }

      const labels = [
        `Kurang dari Rp. ${formatNumberWithUnit(jenksBreaks[1])}`,
        `Rp. ${formatNumberWithUnit(jenksBreaks[1])} - Rp. ${formatNumberWithUnit(jenksBreaks[2])}`,
        `Lebih dari Rp. ${formatNumberWithUnit(jenksBreaks[2])}`
      ]

      div.style.background = '#ffffff'
      div.style.padding = '8px 12px'
      div.style.borderRadius = '4px'
      div.style.color = 'black'
      div.style.opacity = '0.95'
      div.style.fontSize = '0.7rem'
      div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'
      div.style.border = '1px solid #ddd'
      
      let html = '<h4 style="font-weight:bold; margin-bottom:6px; font-size:0.75rem;">Kerugian (Rp)</h4>'
      labels.forEach((label, i) => {
        html += `<div style="display:flex; align-items:center; margin-bottom:3px;">` +
                `<i style="background:${colors[i]}; width:14px; height:10px; display:inline-block; margin-right:6px;"></i>` +
                `<span>${label}</span></div>`
      })

      html += '<hr style="margin:6px 0; border:none; border-top:1px solid #eee;"/>'
      html += '<h4 style="margin-bottom:4px; font-size:0.75rem;">Jenis Gedung</h4>'
      html += `
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <img src="icons/gedungnegara.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>BMN</span>
        </div>
        <div style="display:flex; align-items:center; margin-bottom:3px;">
          <img src="icons/kesehatan.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Faskes</span>
        </div>
        <div style="display:flex; align-items:center;">
          <img src="icons/sekolah.svg" style="width:16px; height:16px; margin-right:6px;"/>
          <span>Fasdik</span>
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
        `}
      </style>
      <div ref={mapEl} className="h-full w-full rounded-lg" />
    </div>
  )
}
