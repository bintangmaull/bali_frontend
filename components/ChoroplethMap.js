// components/ChoroplethMap.js
import { useRef, useEffect } from 'react'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'


const colors = ['#209c05', '#85e62c', '#ebff0a', '#f2ce02', '#ff0a0a']

// Fungsi Jenks Natural Breaks untuk membagi data ke n_classes
function jenks(data, n_classes) {
  if (!Array.isArray(data) || data.length === 0) return []
  const sorted = data.slice().sort((a, b) => a - b)
  const matrices = Array(sorted.length + 1).fill(0)
    .map(() => Array(n_classes + 1).fill(0))
  const variances = Array(sorted.length + 1).fill(0)
    .map(() => Array(n_classes + 1).fill(Infinity))

  for (let i = 1; i <= n_classes; i++) {
    matrices[0][i] = 1
    variances[0][i] = 0
  }
  for (let l = 1; l <= sorted.length; l++) {
    let sum = 0, sumSq = 0
    for (let m = 1; m <= l; m++) {
      const val = sorted[l - m]
      sum += val
      sumSq += val * val
      const variance = sumSq - (sum * sum) / m
      for (let k = 2; k <= n_classes; k++) {
        if (variances[l][k] > variance + variances[l - m][k - 1]) {
          matrices[l][k] = l - m + 1
          variances[l][k] = variance + variances[l - m][k - 1]
        }
      }
    }
    matrices[l][1] = 1
    variances[l][1] = sumSq - (sum * sum) / l
  }
  const kclass = Array(n_classes + 1).fill(0)
  kclass[n_classes] = sorted[sorted.length - 1]
  kclass[0] = sorted[0]
  let count = n_classes, idx = sorted.length
  while (count > 1) {
    kclass[count - 1] = sorted[matrices[idx][count] - 2]
    idx = matrices[idx][count] - 1
    count--
  }
  return kclass
}

export default function ChoroplethMap({ geojson, hazard, model }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const legendRef = useRef(null)

  // Inisialisasi peta sekali
  useEffect(() => {
    if (!L || mapRef.current) return
    // Bali center: -8.4, 115.2, zoom 9
    // preferCanvas: render poligon dengan Canvas (lebih cepat dari SVG)
    mapRef.current = L.map(mapEl.current, {
      center: [-8.4, 115.2],
      zoom: 9,
      zoomControl: false,
      minZoom: 5,
      maxZoom: 14,
      preferCanvas: true
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM'
    }).addTo(mapRef.current)
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

  // Render choropleth + popup + legend setiap data berubah
  useEffect(() => {
    const map = mapRef.current
    if (!map || !geojson || !hazard || !model) return

    // Hapus layer & legend lama
    if (layerRef.current) layerRef.current.remove()
    if (legendRef.current) map.removeControl(legendRef.current)

    // siapkan Jenks pada data geojson
    const metric = `aal_${hazard}_${model === 'total' ? 'total' : model}`
    const vals = geojson.features.map(f => f.properties[metric] || 0)
    const grades = jenks(vals, 5).sort((a, b) => a - b)

    // helper format popup dan legend
    const fmtPopup = n => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    const fmtLegend = n => {
      if (n >= 1e12) return Math.round(n / 1e12) + 'T'
      if (n >= 1e9) return Math.round(n / 1e9) + 'M'
      if (n >= 1e6) return Math.round(n / 1e6) + 'JT'
      return n.toLocaleString('id-ID')
    }
    const getColor = v => {
      for (let i = 0; i < grades.length - 1; i++) {
        if (v >= grades[i] && v < grades[i + 1]) return colors[i]
      }
      return colors[colors.length - 1]
    }

    // Tambah layer choropleth dengan popup
    layerRef.current = L.geoJSON(geojson, {
      interactive: true,
      style: feature => ({
        fillColor: getColor(feature.properties[metric] || 0),
        weight: 1,
        color: '#fff',
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties
        const nama = props.kota || props.nama_kota || props.provinsi || props.nama_provinsi || 'Unknown'
        const val = props[metric] || 0

        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 2,
              color: '#666',
              dashArray: '',
              fillOpacity: 0.8
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              layer.bringToFront();
            }
            L.popup()
              .setLatLng(layer.getBounds().getCenter())
              .setContent(`<strong>${nama}</strong><br/>AAL: ${fmtPopup(val)}`)
              .openOn(map);
          },
          mouseout: (e) => {
            layerRef.current.resetStyle(e.target);
            map.closePopup();
          },
        });
      }
    }).addTo(map)

    // Tambah legend di pojok kiri bawah
    const legend = L.control({ position: 'bottomleft' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      div.style.background = 'rgba(255,255,255,0.95)'
      div.style.padding = '6px 10px'
      div.style.borderRadius = '4px'
      div.style.color = '#000'
      div.style.fontFamily = 'sans-serif'
      div.style.lineHeight = '1.2'
      div.style.fontSize = '0.7rem'
      div.style.border = '1px solid #ccc'
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      div.innerHTML = '<strong style="font-size:0.75rem">AAL (Rp)</strong><br/>'

      div.innerHTML +=
        `<div style="display:flex; align-items:center; margin-bottom:2px;">` +
        `<i style="background:${colors[0]};width:12px;height:10px;display:inline-block;margin-right:6px;border:1px solid #ccc"></i>` +
        `<span>&lt; ${fmtLegend(grades[1])}</span></div>`

      for (let i = 1; i < grades.length - 2; i++) {
        div.innerHTML +=
          `<div style="display:flex; align-items:center; margin-bottom:2px;">` +
          `<i style="background:${colors[i]};width:12px;height:10px;display:inline-block;margin-right:6px;border:1px solid #ccc"></i>` +
          `<span>${fmtLegend(grades[i])} – ${fmtLegend(grades[i + 1])}</span></div>`
      }

      div.innerHTML +=
        `<div style="display:flex; align-items:center;">` +
        `<i style="background:${colors[colors.length - 1]};width:12px;height:10px;display:inline-block;margin-right:6px;border:1px solid #ccc"></i>` +
        `<span>&gt; ${fmtLegend(grades[grades.length - 2])}</span></div>`

      return div
    }
    legend.addTo(mapRef.current)
    legendRef.current = legend

    return () => {
      if (legendRef.current) legendRef.current.remove()
    }
  }, [geojson, hazard, model])

  return (
    <div className="relative h-full">
      <style>
      </style>
      <div ref={mapEl} id="map" className="h-full w-full rounded-lg" />
    </div>
  )
}
