import React, { useState, useEffect, useRef } from 'react'
import { Download, FileText, Map as MapIcon, BarChart3, Database, Check, X, AlertCircle, FileJson, Lock, Key, Image as ImageIcon, CheckSquare, Square, Printer } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Modal from './ui/Modal'
import { toPng, toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'
import MapPrintLayout from './MapPrintLayout'

export default function DownloadModal({ 
  isOpen, 
  onClose, 
  exposureData, 
  boundaryDataDL, 
  boundaryDataAAL,
  droughtSawahData,
  floodSawahData,
  selectedGroup,
  user,
  initialType = 'building'
}) {
  const { darkMode } = useTheme()
  const [downloadType, setDownloadType] = useState(initialType) // building | city | sawah | map_chart | map_layout
  const [format, setFormat] = useState(initialType === 'map_chart' ? 'png' : 'csv')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [selectedColumns, setSelectedColumns] = useState({
    info: true,
    asset: true,
    gempa: true,
    banjir: true,
    tsunami: true,
    aal: true
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [mapCaptureUrl, setMapCaptureUrl] = useState(null)

  // Sync downloadType with initialType when modal opens
  useEffect(() => {
    if (isOpen) {
      setDownloadType(initialType)
      if (initialType === 'map_chart') setFormat('png')
      else if (initialType === 'map_layout') setFormat('pdf')
      else if (format === 'png' || format === 'pdf') setFormat('csv')
    }
  }, [isOpen, initialType])

  const cities = ['ALL', ...new Set((exposureData?.features || []).map(f => f.properties.kota).filter(Boolean))].sort()

  const handleDownload = async () => {
    setIsProcessing(true)
    setTimeout(async () => {
      try {
        if (downloadType === 'building') {
          downloadBuildingData()
        } else if (downloadType === 'city') {
          downloadCityData()
        } else if (downloadType === 'sawah') {
          downloadSawahData()
        } else if (downloadType === 'map_chart') {
          await captureCharts()
        } else if (downloadType === 'map_layout') {
          await exportMapLayoutPDF()
        }
        onClose()
      } catch (err) {
        console.error('Download failed:', err)
        alert('Gagal mengunduh data.')
      } finally {
        setIsProcessing(false)
      }
    }, 500)
  }

  const exportMapLayoutPDF = async () => {
    // 1. Capture the raw map first
    const mapElement = document.getElementById('map')
    if (!mapElement) {
      alert('Map container not found.')
      return
    }

    try {
      // Temporarily hide map controls for cleaner capture
      const controls = mapElement.querySelectorAll('.leaflet-control-container')
      controls.forEach(c => c.style.display = 'none')

      const mapCanvas = await toCanvas(mapElement, {
        pixelRatio: 2,
        backgroundColor: darkMode ? '#0F1115' : '#FFFFFF'
      })
      
      controls.forEach(c => c.style.display = 'block')
      const mapImg = mapCanvas.toDataURL('image/png')
      setMapCaptureUrl(mapImg)

      // 2. Wait for React to render the hidden Layout with the new image
      // We use a small delay or a separate useEffect, but for simplicity here:
      await new Promise(r => setTimeout(r, 500))

      const layoutCanvas = await toCanvas(layoutElement, {
        pixelRatio: 2,
        backgroundColor: '#FFFFFF'
      })

      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape, mm, A4
      const imgData = layoutCanvas.toDataURL('image/png')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`layout_peta_risiko_${new Date().toISOString().split('T')[0]}.pdf`)
      
      setMapCaptureUrl(null)
    } catch (error) {
      console.error('PDF Export failed:', error)
      alert('Gagal mengekspor PDF.')
    }
  }

  const captureCharts = async () => {
    // Strategy: If there's a specific chart target, capture that. Otherwise capture everything.
    const exportTarget = document.getElementById('aal-comparison-chart') || 
                         document.getElementById('exposure-distribution-chart') || 
                         document.querySelector('.recharts-wrapper')?.parentElement ||
                         document.body

    try {
      const dataUrl = await toPng(exportTarget, {
        backgroundColor: darkMode ? '#0F1115' : '#FFFFFF',
        pixelRatio: 2,
      })
      
      const link = document.createElement('a')
      link.download = `capture_risiko_${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Capture failed:', error)
      throw error
    }
  }

  const downloadBuildingData = () => {
    let features = exposureData?.features || []
    if (selectedCity !== 'ALL') {
      features = features.filter(f => f.properties.kota === selectedCity)
    }

    if (format === 'geojson') {
      const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features }, null, 2)], { type: 'application/json' })
      saveAs(blob, `data_bangunan_${selectedCity.toLowerCase()}_${new Date().toISOString().split('T')[0]}.geojson`)
    } else if (format === 'json') {
      const data = features.map(f => f.properties)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      saveAs(blob, `data_bangunan_${selectedCity.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`)
    } else {
      // CSV
      const data = []
      features.forEach(item => {
        const props = item.properties || item
        const row = {}

        // 1. Informasi Umum
        if (selectedColumns.info) {
          const infoKeys = [
            'id_bangunan', 'nama_gedung', 'id_desa', 'id_kec', 'id_kota', 
            'kota', 'provinsi', 'alamat', 'luas', 'hsbgn', 
            'jenis_prasarana', 'taxonomy', 'jumlah_lantai', 'lat', 'lon'
          ]
          infoKeys.forEach(k => {
            if (props[k] !== undefined) row[k] = props[k]
            // Fallback for kota/provinsi if not in props but in root (common for GeoJSON)
            if (k === 'kota' && !props.kota && item.kota) row.kota = item.kota
            if (k === 'provinsi' && !props.provinsi && item.provinsi) row.provinsi = item.provinsi
          })
          // If no lat/lon in props, check geometry
          if (row.lat === undefined && item.geometry?.type === 'Point') {
            row.lat = item.geometry.coordinates[1]
            row.lon = item.geometry.coordinates[0]
          }
        }

        // 2. Nilai Aset
        if (selectedColumns.asset) {
          row.nilai_aset = (props.luas || 0) * (props.hsbgn || 0)
        }

        // 3. Hazard Losses (Loss Ratios)
        Object.keys(props).forEach(k => {
          const kl = k.toLowerCase()
          const isGempa = kl.includes('pga_')
          const isBanjir = kl.includes('r_') || kl.includes('rc_')
          const isTsunami = kl.includes('inundansi')

          if (isGempa && selectedColumns.gempa) row[k] = props[k]
          if (isBanjir && selectedColumns.banjir) row[k] = props[k]
          if (isTsunami && selectedColumns.tsunami) row[k] = props[k]
        })

        // 4. AAL
        if (selectedColumns.aal) {
          if (props.aal !== undefined) row.aal = props.aal
          if (props.aal_idr !== undefined) row.aal_idr = props.aal_idr
        }

        data.push(row)
      })
      
      if (data.length === 0) return
      
      // Collect all unique keys from ALL rows
      const allUniqueKeys = new Set()
      data.forEach(row => Object.keys(row).forEach(k => allUniqueKeys.add(k)))
      const allKeys = Array.from(allUniqueKeys)
      
      const csv = [
        allKeys.join(','),
        ...data.map(p => allKeys.map(h => {
          const val = p[h] !== undefined ? p[h] : ''
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        }).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      saveAs(blob, `data_bangunan_${selectedCity.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`)
    }
  }

  const downloadCityData = () => {
    const dlMap = new Map((boundaryDataDL?.features || []).map(f => [f.properties.id_kota, f.properties]))
    const aalMap = new Map((boundaryDataAAL?.features || []).map(f => [f.properties.id_kota, f.properties]))
    
    // Get all unique city IDs
    const allCityIds = Array.from(new Set([...dlMap.keys(), ...aalMap.keys()]))
    const exposures = [
      { id: 'fs', label: 'healthcare' },
      { id: 'fd', label: 'educational' },
      { id: 'electricity', label: 'electricity' },
      { id: 'airport', label: 'airport' },
      { id: 'hotel', label: 'hotel' }
    ]
    
    const data = allCityIds.map(id => {
      const dlProps = dlMap.get(id) || {}
      const aalProps = aalMap.get(id) || {}
      
      // Extract main metrics from objects if they exist
      const dlExp = typeof dlProps.dl_exposure === 'string' ? JSON.parse(dlProps.dl_exposure) : (dlProps.dl_exposure || {})
      const aalExp = typeof aalProps.aal_exposure === 'string' ? JSON.parse(aalProps.aal_exposure) : (aalProps.aal_exposure || {})
      
      const row = {
        id_kota: id,
        kota: dlProps.kota || aalProps.kota || '',
        provinsi: dlProps.provinsi || aalProps.provinsi || 'Bali',
      }

      // info: Building counts
      if (selectedColumns.info) {
        row.total_building_count = dlProps.count_total || 0
        exposures.forEach(exp => {
          row[`${exp.label}_count`] = dlProps[`count_${exp.id}`] || 0
        })
      }

      // asset: Building assets
      if (selectedColumns.asset) {
        row.total_building_asset = dlProps.total_asset_total || 0
        exposures.forEach(exp => {
          row[`${exp.label}_asset`] = dlProps[`total_asset_${exp.id}`] || 0
        })
      }

      // Hazard Losses
      let cityDlSum = 0
      let cityAalSum = 0

      // Process DL
      Object.entries(dlExp).forEach(([cat, metrics]) => {
        if (cat === 'bmn' || cat === 'residential' || cat === 'res') return
        if (typeof metrics !== 'object') return

        Object.entries(metrics).forEach(([hazard, val]) => {
          const hl = hazard.toLowerCase()
          const isGempa = hl.includes('pga_')
          const isBanjir = hl.includes('r_') || hl.includes('rc_')
          const isTsunami = hl.includes('inundansi')

          if ((isGempa && selectedColumns.gempa) || (isBanjir && selectedColumns.banjir) || (isTsunami && selectedColumns.tsunami)) {
            row[`dl_${cat}_${hazard}`] = val
            cityDlSum += (typeof val === 'number' ? val : 0)
          }
        })
      })

      // Process AAL
      if (selectedColumns.aal) {
        Object.entries(aalExp).forEach(([cat, metrics]) => {
          if (cat === 'bmn' || cat === 'residential' || cat === 'res') return
          if (typeof metrics !== 'object') return

          Object.entries(metrics).forEach(([hazard, val]) => {
            row[`aal_${cat}_${hazard}`] = val
            cityAalSum += (typeof val === 'number' ? val : 0)
          })
        })
      }

      if (selectedColumns.gempa || selectedColumns.banjir || selectedColumns.tsunami || selectedColumns.aal) {
        if (selectedColumns.gempa || selectedColumns.banjir || selectedColumns.tsunami) {
          row.total_building_loss = cityDlSum
        }
        if (selectedColumns.aal) {
          row.total_aal_idr = cityAalSum
        }
      }

      return row
    })

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      saveAs(blob, `data_ringkasan_kota_${new Date().toISOString().split('T')[0]}.json`)
    } else {
      // CSV
      if (data.length === 0) return
      
      const allUniqueKeys = new Set()
      data.forEach(row => Object.keys(row).forEach(k => allUniqueKeys.add(k)))
      
      const preferred = [
        'id_kota', 'kota', 'provinsi', 
        'total_building_count', 'total_building_asset', 'total_building_loss', 'total_aal_idr',
        ...exposures.flatMap(e => [`${e.label}_count`, `${e.label}_asset`])
      ]
      
      const headers = [
        ...preferred.filter(k => allUniqueKeys.has(k)),
        ...Array.from(allUniqueKeys).filter(k => !preferred.includes(k))
      ]

      const csv = [
        headers.join(','),
        ...data.map(d => headers.map(h => {
          const val = d[h] !== undefined ? d[h] : 0
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        }).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      saveAs(blob, `data_ringkasan_kota_${new Date().toISOString().split('T')[0]}.csv`)
    }
  }

  const downloadSawahData = () => {
    const cityRows = {}
    const years = ['2022', '2025', '2028']

    const processSawah = (rawSawah, prefix) => {
      if (!rawSawah || !rawSawah.r || !rawSawah.rc) return
      const rps = rawSawah.return_periods || []

      rps.forEach(rp => {
        const rpKey = String(rp)
        
        // NCC
        if (rawSawah.r[rpKey]) {
          rawSawah.r[rpKey].forEach(row => {
            if (!cityRows[row.kota]) cityRows[row.kota] = { kota: row.kota }
            years.forEach(yr => {
              cityRows[row.kota][`${prefix}_loss_${yr}_rp${rp}_ncc`] = row[`loss_${yr}`] || 0
            })
            if (selectedColumns.aal) {
              if (row.aal !== undefined) cityRows[row.kota][`${prefix}_aal_ncc`] = row.aal
              if (row.aal_idr !== undefined) cityRows[row.kota][`${prefix}_aal_idr_ncc`] = row.aal_idr
            }
          })
        }
        
        // CC
        if (rawSawah.rc[rpKey]) {
          rawSawah.rc[rpKey].forEach(row => {
            if (!cityRows[row.kota]) cityRows[row.kota] = { kota: row.kota }
            years.forEach(yr => {
              cityRows[row.kota][`${prefix}_loss_${yr}_rp${rp}_cc`] = row[`loss_${yr}`] || 0
            })
            if (selectedColumns.aal) {
              if (row.aal !== undefined) cityRows[row.kota][`${prefix}_aal_cc`] = row.aal
              if (row.aal_idr !== undefined) cityRows[row.kota][`${prefix}_aal_idr_cc`] = row.aal_idr
            }
          })
        }
      })
    }

    // Process both hazards
    processSawah(droughtSawahData, 'drought')
    processSawah(floodSawahData, 'flood')

    const exportData = Object.values(cityRows).sort((a,b) => a.kota.localeCompare(b.kota))

    if (exportData.length === 0) {
      alert('Data sawah/pertanian belum dimuat. Silakan tunggu sebentar atau aktifkan layer sawah.')
      return
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `data_sawah_lengkap_${timestamp}`

    if (format === 'csv') {
      const allUniqueKeys = new Set()
      exportData.forEach(row => Object.keys(row).forEach(k => allUniqueKeys.add(k)))
      const headers = Array.from(allUniqueKeys).sort((a,b) => {
        if (a === 'kota') return -1
        if (b === 'kota') return 1
        return a.localeCompare(b)
      })

      const csv = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => {
          const val = row[h] !== undefined ? row[h] : 0
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        }).join(','))
      ].join('\n')
      triggerDownload(csv, `${filename}.csv`, 'text/csv')
    } else {
      triggerDownload(JSON.stringify(exportData, null, 2), `${filename}.json`, 'application/json')
    }
  }

  const triggerDownload = (content, filename, type) => {
    const blob = new Blob([content], { type })
    saveAs(blob, filename)
  }

  const saveAs = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user && downloadType !== 'map_chart') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
        <div className="flex flex-col items-center text-center py-6 gap-6">
          <div className={`w-20 h-20 rounded-[28px] ${darkMode ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'bg-amber-50 text-amber-600'} flex items-center justify-center transition-all duration-500 group hover:scale-110`}>
            <Lock size={36} strokeWidth={2.5} className="animate-in zoom-in duration-500" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className={`text-xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Fitur ini memerlukan login
            </h3>
            <p className={`text-sm leading-relaxed max-w-[280px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Silakan masuk ke akun Anda untuk mengunduh data analisis risiko dashboard.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full max-w-[200px] py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Key size={14} strokeWidth={3} />
            Masuk Sekarang
          </button>
          
          <button 
            onClick={() => setDownloadType('map_chart')}
            className={`text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
          >
            Atau tetap Capture Grafik (Gratis)
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Hidden Layout for PDF generation */}
        {mapCaptureUrl && (
          <MapPrintLayout 
            mapImage={mapCaptureUrl} 
            selectedGroup={selectedGroup} 
            darkMode={darkMode} 
          />
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Download size={20} strokeWidth={2.5} />
            </div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>
              Export Data Selection
            </h2>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            Pilih jenis data dan format yang ingin Anda unduh ke perangkat Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex flex-col gap-3">
            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              Tipe Data
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'building', label: 'Data Bangunan (Detailed)', icon: Database },
                { id: 'city', label: 'Ringkasan Kota/Kabupaten', icon: FileText },
                { id: 'sawah', label: 'Data Sawah/Pertanian', icon: MapIcon },
                { id: 'map_chart', label: 'Capture Grafik & Peta', icon: BarChart3 },
                { id: 'map_layout', label: 'Layout Peta Profesional (PDF)', icon: Printer },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setDownloadType(item.id)
                    if (item.id === 'map_chart') setFormat('png')
                    else if (item.id === 'map_layout') setFormat('pdf')
                    else if (format === 'png' || format === 'pdf') setFormat('csv')
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                    downloadType === item.id 
                      ? (darkMode ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-blue-50 border-blue-200 text-blue-600')
                      : (darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10 text-gray-400' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-500')
                  }`}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Format File
              </label>
              <div className="flex gap-2">
                {downloadType === 'map_chart' ? (
                  <button className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-black' : 'bg-emerald-50 border-emerald-200 text-emerald-600 font-bold'}`}>
                    <ImageIcon size={16} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500">PNG Image</span>
                  </button>
                ) : downloadType === 'map_layout' ? (
                  <button className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-red-500/10 border-red-500 text-red-400 font-black' : 'bg-red-50 border-red-200 text-red-600 font-bold'}`}>
                    <FileText size={16} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Document PDF</span>
                  </button>
                ) : (
                  [
                    { id: 'csv', label: 'CSV', icon: FileText },
                    { id: 'json', label: 'JSON', icon: FileJson },
                    { id: 'geojson', label: 'GeoJSON', icon: MapIcon },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setFormat(item.id)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-300 ${
                        format === item.id 
                          ? (darkMode ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                          : (darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10 text-gray-400' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-400')
                      }`}
                    >
                      <item.icon size={16} />
                      <span className="text-[10px] font-black">{item.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {downloadType === 'building' && (
              <div className="flex flex-col gap-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Filter Wilayah
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className={`w-full text-sm font-bold py-2.5 px-4 rounded-xl border focus:outline-none appearance-none cursor-pointer transition-all ${
                    darkMode ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                  }`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '14px' }}
                >
                  {cities.map(c => (
                    <option key={c} value={c} className={darkMode ? 'bg-[#1A1D21]' : ''}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {(downloadType === 'building' || downloadType === 'city' || downloadType === 'sawah') && (
              <div className="flex flex-col gap-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Kolom Informasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'info', label: 'Informasi Umum' },
                    { id: 'asset', label: 'Nilai Aset' },
                    { id: 'gempa', label: 'Direct Loss Gempa' },
                    { id: 'banjir', label: 'Direct Loss Banjir' },
                    { id: 'tsunami', label: 'Direct Loss Tsunami' },
                    { id: 'aal', label: 'Informasi AAL' },
                  ].map(col => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        selectedColumns[col.id]
                          ? (darkMode ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                          : (darkMode ? 'bg-white/[0.02] border-white/5 text-gray-500' : 'bg-slate-50 border-slate-100 text-slate-400')
                      }`}
                    >
                      {selectedColumns[col.id] ? <CheckSquare size={14} /> : <Square size={14} />}
                      <span className="text-[10px] font-bold">{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {downloadType === 'map_layout' && (
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${darkMode ? 'bg-blue-500/5 border-blue-500/10 text-blue-200/60' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                <div className="flex items-center gap-2">
                  <Printer size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Layout PDF</span>
                </div>
                <p className="text-[11px] leading-relaxed font-medium">
                  Mencetak peta saat ini ke dalam format tata letak kartografi profesional (A4 Landscape) lengkap dengan legenda dan skala.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex gap-3 mt-6 ${darkMode ? 'bg-amber-500/5 border-amber-500/10 text-amber-200/60' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed font-medium">
            Pastikan layer yang ingin Anda tampilkan pada peta sudah aktif sebelum melakukan export layout.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 py-3.5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 ${
              darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Batal
          </button>
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className={`flex-[2] py-3.5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              isProcessing 
                ? 'bg-blue-500/50 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} strokeWidth={3} />
            )}
            {isProcessing ? 'Memproses...' : 'Unduh Data Sekarang'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
