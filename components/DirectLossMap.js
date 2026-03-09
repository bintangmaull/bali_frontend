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

  // Fungsi format angka ke string dengan satuan (triliun, miliar, juta)
  function formatNumberWithUnit(value) {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T'  // Triliun
    if (value >= 1e9) return (value / 1e9).toFixed(2) + ' M'   // Miliar
    if (value >= 1e6) return (value / 1e6).toFixed(2) + ' jt'  // Juta
    if (value >= 1e3) return (value / 1e3).toFixed(2) + ' rb'  // Ribu (optional)
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

  // Render batas kota
  useEffect(() => {
    if (!mapRef.current) return
    // Hapus boundary lama
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
    cluster.clearLayers()
    if (!geojson) return

    const selectedProvinsi = filters.provinsi || null
    const selectedKota = filters.kota || null

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
      .map(f => {
        const p = f.properties
        const [lon, lat] = f.geometry.coordinates
        const type = (p.id_bangunan || '').split('_')[0]

        if (!filters[type]) return null
        if (search && !p.nama_gedung.toLowerCase().includes(search.toLowerCase())) return null

        const directLossValue = Object.entries(p)
          .filter(([k]) => k.startsWith('direct_loss_'))
          .reduce((sum, [_, v]) => sum + (v || 0), 0)

        const popupHtml = `
          <div style="min-width:220px; max-width:320px; font-family:inherit; bg-gray-300">
            <div style="font-size:1.1rem; font-weight:700; color:#2563eb; margin-bottom:2px;">${p.nama_gedung}</div>
            <div style="font-size:0.95rem; color:#374151; margin-bottom:4px;">
              <span style="font-style:italic;">${p.taxonomy}</span> &bull; Luas: <b>${p.luas} m²</b><br/>
              Jumlah Lantai: <b>${p.jumlah_lantai || '-'}</b><br/>
              <span style="color:#6b7280;">${p.alamat}</span><br/>
              <span style="font-size:0.9em; color:#6b7280;">${p.kota}, ${p.provinsi}</span>
            </div>
            <hr style="margin:6px 0 8px 0; border:none; border-top:1px solid #e5e7eb;"/>
            <div style="font-size:0.95rem;">
              <div style="margin-bottom:6px;"><b style="color:#2563eb;">Kerugian Gempa</b><br/>
                <span style="margin-left:8px;">500-th: <b>${formatRupiah(p.direct_loss_gempa_500)}</b></span><br/>
                <span style="margin-left:8px;">250-th: <b>${formatRupiah(p.direct_loss_gempa_250)}</b></span><br/>
                <span style="margin-left:8px;">100-th: <b>${formatRupiah(p.direct_loss_gempa_100)}</b></span>
              </div>
              <div style="margin-bottom:6px;"><b style="color:#059669;">Kerugian Banjir</b><br/>
                <span style="margin-left:8px;">100-th: <b>${formatRupiah(p.direct_loss_banjir_100)}</b></span><br/>
                <span style="margin-left:8px;">50-th: <b>${formatRupiah(p.direct_loss_banjir_50)}</b></span><br/>
                <span style="margin-left:8px;">25-th: <b>${formatRupiah(p.direct_loss_banjir_25)}</b></span>
              </div>
              <div style="margin-bottom:6px;"><b style="color:#d97706;">Kerugian Longsor</b><br/>
                <span style="margin-left:8px;">5-th: <b>${formatRupiah(p.direct_loss_longsor_5)}</b></span><br/>
                <span style="margin-left:8px;">2-th: <b>${formatRupiah(p.direct_loss_longsor_2)}</b></span>
              </div>
              <div><b style="color:#dc2626;">Kerugian Gunung Berapi</b><br/>
                <span style="margin-left:8px;">250-th: <b>${formatRupiah(p.direct_loss_gunungberapi_250)}</b></span><br/>
                <span style="margin-left:8px;">100-th: <b>${formatRupiah(p.direct_loss_gunungberapi_100)}</b></span><br/>
                <span style="margin-left:8px;">50-th: <b>${formatRupiah(p.direct_loss_gunungberapi_50)}</b></span>
              </div>
            </div>
          </div>
        `

        return L.marker([lat, lon], { icon: icons[type] || icons.FD, directLossValue })
          .bindPopup(popupHtml)
          .bindTooltip(p.nama_gedung, { permanent: false, direction: 'right', offset: [10, 0], className: 'building-label' })
      })
      .filter(Boolean)
      .forEach(marker => cluster.addLayer(marker))

    const jenksBreaks = getJenksBreaks(allDirectLossValues, 3)

    cluster.options.iconCreateFunction = function (cluster) {
      const markers = cluster.getAllChildMarkers()
      const avgDirectLoss = markers.reduce((acc, m) => acc + (m.options.directLossValue || 0), 0) / markers.length

      let color = '#ffeb3b' // kuning: kelas rendah
      if (avgDirectLoss > jenksBreaks[2]) color = '#f44336' // merah: kelas atas
      else if (avgDirectLoss > jenksBreaks[1]) color = '#ff9800' // orange: kelas tengah

      const count = cluster.getChildCount()
      const html = `
        <div style="
          background-color: ${color};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: black;
          font-weight: bold;
          opacity: 0.8;
        ">
          ${count}
        </div>
      `

      return L.divIcon({
        html,
        className: 'custom-cluster-icon',
        iconSize: L.point(40, 40)
      })
    }

    cluster.refreshClusters()

    if (legendRef.current) {
      legendRef.current.remove()
      legendRef.current = null
    }
    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      const grades = jenksBreaks
      const colors = ['#ffeb3b', '#ff9800', '#f44336']

      if (grades.length < 4) {
        div.innerHTML = ''
        return div
      }

      const labels = [
        `Kurang dari Rp. ${formatNumberWithUnit(grades[1])}`,
        `Rp. ${formatNumberWithUnit(grades[1])} - Rp. ${formatNumberWithUnit(grades[2])}`,
        `Lebih dari Rp. ${formatNumberWithUnit(grades[2])}`
      ]

      let html = '<h4 class="text-black font-bold mb-1">Kerugian Bangunan per Cluster (Rp)</h4>'
      labels.forEach((label, i) => {
        html += `<i style="background:${colors[i]}; width:18px; height:12px; display:inline-block; margin-right:6px;"></i> ${label}<br>`
      })

      // Tambahkan legenda ikon bangunan
      html += '<hr style="margin:8px 0; border:none; border-top:1px solid #e5e7eb;"/>'
      html += '<h4 class="text-black font-bold mb-1">Jenis Bangunan</h4>'
      html += `
        <div style="display:flex; align-items:center; margin-bottom:4px;">
          <img src="icons/gedungnegara.svg" style="width:20px; height:20px; margin-right:6px; background:white; padding:2px; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"/>
          <span>Bangunan Milik Negara</span>
        </div>
        <div style="display:flex; align-items:center; margin-bottom:4px;">
          <img src="icons/kesehatan.svg" style="width:20px; height:20px; margin-right:6px; background:white; padding:2px; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"/>
          <span>Fasilitas Kesehatan</span>
        </div>
        <div style="display:flex; align-items:center;">
          <img src="icons/sekolah.svg" style="width:20px; height:20px; margin-right:6px; background:white; padding:2px; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"/>
          <span>Fasilitas Pendidikan</span>
        </div>
      `

      div.innerHTML = html
      div.style.background = '#ffffff'
      div.style.padding = '6px 12px'
      div.style.borderRadius = '6px'
      div.style.color = 'black'
      div.style.opacity = '0.8'
      div.style.fontSize = '0.8rem'
      return div
    }
    legend.addTo(mapRef.current)
    legendRef.current = legend

    const bounds = cluster.getBounds()
    if (bounds.isValid()) mapRef.current.fitBounds(bounds, { maxZoom: 14 })
  }, [geojson, filters, search])


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
        `}
      </style>
      <div ref={mapEl} className="h-full w-full rounded-lg" />
    </div>
  )
}
