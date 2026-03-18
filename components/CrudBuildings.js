// components/CrudBuildings.js
import { useState, useEffect, useRef } from 'react'
import Select from './ui/Select'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { useTheme } from '../context/ThemeContext'
import {
  getBuildingKota,
  getBuildingAllKota,
  getBuildings,
  uploadBuildingsCSV,
  getNewBuildingId,
  addBuilding,
  getBuilding,
  updateBuilding,
  deleteBuilding,
  recalc as recalcApi,
  recalcKota,
  getKota,
  getKotaAll
} from '../src/lib/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Definisi ikon untuk tiap tipe bangunan
const icons = {
  FS: L.icon({ iconUrl: 'icons/healthcare.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  FD: L.icon({ iconUrl: 'icons/education.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  ELECTRICITY: L.icon({ iconUrl: 'icons/electricity.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  HOTEL: L.icon({ iconUrl: 'icons/hotel.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  AIRPORT: L.icon({ iconUrl: 'icons/airport.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function MiniMap({ lat, lon, onLatLonChange, onLocationSelect, kode_bangunan }) {
  const { darkMode } = useTheme()
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapEl.current).setView([lat || -6.2, lon || 106.8], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    mapRef.current = map
    markerRef.current = L.marker([lat || -6.2, lon || 106.8], {
      draggable: true,
      icon: icons[kode_bangunan] || icons.FD
    })
      .addTo(map)
      .on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        onLatLonChange(lat, lng)
      })
  }, [])

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat || -6.2, lon || 106.8], 13)
      markerRef.current.setLatLng([lat || -6.2, lon || 106.8])
      markerRef.current.setIcon(icons[kode_bangunan] || icons.FD)
    }
  }, [lat, lon, kode_bangunan])

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!search.trim()) return
    setIsSearching(true)
    setResults([])
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&addressdetails=1&extratags=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        setResults(data)
      } else {
        alert('Lokasi tidak ditemukan')
        setResults([])
      }
    } catch (err) {
      console.error(err)
      alert('Gagal mencari lokasi. Coba lagi.')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    onLatLonChange(lat, lon)
    if (onLocationSelect) {
      onLocationSelect(lat, lon, result.display_name)
    }
    setResults([])
    setSearch(result.display_name)
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 16)
    }
  }

  return (
    <div>
      <div className="mb-2 flex gap-2 relative z-[9500]">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={(e) => { 
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleSearch(e); 
            }
          }}
          placeholder="Cari lokasi (Taman Mini...)"
          className={`border p-1 px-2 text-xs rounded w-full bg-white text-gray-900 border-gray-300`}
        />
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSearch(e);
          }} 
          className="bg-blue-500 text-white px-3 py-1 text-xs rounded transition-colors hover:bg-blue-600" 
          disabled={isSearching}
        >
          Cari
        </button>
      </div>
      {results.length > 0 && (
        <div className="absolute bg-white border rounded shadow-lg max-h-40 overflow-y-auto z-[9000] w-full left-0 mt-[32px]">
          {results.map((r, i) => (
            <div
              key={r.place_id}
              className="px-2 py-1 hover:bg-blue-100 cursor-pointer text-sm text-gray-900"
              onClick={() => handleResultClick(r)}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
      <div ref={mapEl} style={{ height: '180px', width: '100%' }} className="rounded z-0 border border-gray-300" />
    </div>
  )
}

const buildingNameToCode = {
  'Healthcare Facilities': 'FS',
  'Educational Facilities': 'FD',
  'Electricity': 'ELECTRICITY',
  'Hotel': 'HOTEL',
  'Airport': 'AIRPORT',
}

// ── Icons for Building Categories ────────────────────────────────────────────────
const CategoryIcons = {
  hotel: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#d11141]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Hotel">
      <path d="M3 21h18"></path>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path>
      <path d="M10 9h.01"></path>
      <path d="M14 9h.01"></path>
      <path d="M10 13h.01"></path>
      <path d="M14 13h.01"></path>
    </svg>
  ),
  electricity: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#ffc425]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Electricity">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  ),
  educational: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#00aedb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Educational">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  ),
  healthcare: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#f37735]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Healthcare">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
      <path d="M12 8v8"></path>
      <path d="M8 12h8"></path>
    </svg>
  ),
  airport: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#8c52ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Airport">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21.5 4c0 0-2 .5-3.5 2L14.5 9.5 6 7l-2 2 5.3 4.2L6 16.5l-2.5-1-1.5 1.5 3.5 2 2 3.5 1.5-1-2.5 3.3-3.3 4.2 5.3 2-2L11 16l8.2-1.8c1.5-1.5 2-3.5 2-3.5z"></path>
    </svg>
  ),
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Bangunan">
      <path d="M3 21h18"></path>
      <path d="M9 8h1"></path>
      <path d="M9 12h1"></path>
      <path d="M9 16h1"></path>
      <path d="M14 8h1"></path>
      <path d="M14 12h1"></path>
      <path d="M14 16h1"></path>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
    </svg>
  )
}

function getCategoryIcon(id_bangunan, taxonomy) {
  const tax = (id_bangunan || taxonomy || '').toLowerCase()
  if (tax.includes('hotel')) return CategoryIcons.hotel
  if (tax.includes('electricity') || tax.includes('listrik')) return CategoryIcons.electricity
  if (tax.includes('education') || tax.includes('sekolah') || tax.includes('kampus') || tax.startsWith('fd')) return CategoryIcons.educational
  if (tax.includes('health') || tax.includes('rs') || tax.includes('puskesmas') || tax.includes('hospital') || tax.startsWith('fs')) return CategoryIcons.healthcare
  if (tax.includes('airport') || tax.includes('bandara')) return CategoryIcons.airport
  return CategoryIcons.default
}

// ─────────────────────────────────────────────────────────────────────────────────

export default function CrudBuildings({
  provFilter,
  setProvFilter,
  kotaFilter,
  setKotaFilter,
  infraLayers = {},
  onSearchBuilding = () => { },
  onFilteredBuildings = () => { },
  recalc = recalcApi,
  externalSearch = undefined,
  setExternalSearch = undefined,
  onDataChanged = () => {}
}) {
  const { darkMode } = useTheme()

  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')
  const [uploadErrorMsg, setUploadErrorMsg] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [rows, setRows] = useState([])
  const [internalSearch, setInternalSearch] = useState('')
  const search = externalSearch !== undefined ? externalSearch : internalSearch
  const doSetSearch = setExternalSearch || setInternalSearch
  
  const [internalKotaFilter, setInternalKotaFilter] = useState('')
  const activeKotaFilter = kotaFilter !== undefined ? kotaFilter : internalKotaFilter
  const doSetKotaFilter = setKotaFilter || setInternalKotaFilter
  
  const [sortOrder, setSortOrder] = useState('asc')
  const [modalMode, setModalMode] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isSavingAdd, setIsSavingAdd] = useState(false)
  const [kotaList, setKotaList] = useState([])

  // State untuk Preview Upload
  const [previewData, setPreviewData] = useState(null)
  const [previewHeaders, setPreviewHeaders] = useState([])
  const [mapPickerContext, setMapPickerContext] = useState(null) // { rowId, field }

  // Load semua kota langsung saat mount (untuk filter bar) dari master list HSBGN
  useEffect(() => { getKotaAll().then(setKotaList) }, [])

  const apiCache = useRef({})

  function refreshTable() {
    const cacheKey = `${activeKotaFilter || ''}_${search || ''}`;
    if (apiCache.current[cacheKey]) {
      const res = apiCache.current[cacheKey];
      setRows(res);
      onFilteredBuildings(res);
      return Promise.resolve(res);
    }

    if (activeKotaFilter || search) {
      return getBuildings({ kota: activeKotaFilter, nama: search }).then(res => {
        apiCache.current[cacheKey] = res;
        setRows(res)
        onFilteredBuildings(res)
      })
    }
    return getBuildings({ limit: 50 }).then(res => {
        apiCache.current[cacheKey] = res;
        setRows(res)
        onFilteredBuildings(res)
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshTable()
    }, 400)
    return () => clearTimeout(timer)
  }, [activeKotaFilter, search])

  async function onUpload() {
    if (!file) return
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim() !== '')
      if (lines.length > 0) {
        // Normalize headers for internal consistency
        const rawHeaders = lines[0].split(',').map(h => h.trim()).filter(Boolean)
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/[\s-]+/g, '_'))
        setPreviewHeaders(headers)

        const data = []
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',')
          const rowObj = {}
          headers.forEach((h, idx) => {
            let val = vals[idx] ? vals[idx].trim() : ''
            if (h === 'kota' && val) {
              const upperVal = val.toUpperCase()
              if (kotaList.includes(upperVal)) {
                val = upperVal
              } else {
                const match = kotaList.find(k => k.includes(upperVal) || upperVal.includes(k))
                if (match) val = match
              }
            }
            rowObj[h] = val
          })
          rowObj._id = i // temporary id for editing
          data.push(rowObj)
        }
        setPreviewData(data)
        setModalMode('preview')
      }
    } catch (err) {
      console.error('Error previewing CSV', err)
      setUploadErrorMsg('Gagal membaca data CSV.')
      setTimeout(() => setUploadErrorMsg(''), 4000)
    }
  }

  const handlePreviewChange = (id, field, value) => {
    setPreviewData(prev => prev.map(row =>
      row._id === id ? { ...row, [field]: value } : row
    ))
  }

  const openMapPicker = (row) => {
    setMapPickerContext({
      rowId: row._id,
      lat: parseFloat(row.lat) || -8.4095,
      lon: parseFloat(row.lon) || 115.1889,
      kode_bangunan: row.kode_bangunan || 'FD'
    })
    setModalMode('map-picker')
  }

  const handleMapLocationSelect = (lat, lon, address) => {
    setPreviewData(prev => prev.map(row =>
      row._id === mapPickerContext.rowId
        ? { ...row, lat: lat.toString(), lon: lon.toString(), alamat: address || row.alamat }
        : row
    ))
    setModalMode('preview')
    setMapPickerContext(null)
  }

  const handleDeleteRow = (id) => {
    setPreviewData(prev => prev.filter(row => row._id !== id))
  }

  async function onConfirmUpload() {
    setIsUploading(true)
    try {
      // Re-build CSV string from previewData
      const csvLines = [previewHeaders.join(',')]
      previewData.forEach(row => {
        const line = previewHeaders.map(h => {
          let val = row[h]
          if (h === 'kota' && typeof val === 'string') {
            val = val.toUpperCase()
          }
          return val
        }).join(',')
        csvLines.push(line)
      })
      const csvStr = csvLines.join('\n')

      // Create new File object
      const newFile = new File([csvStr], file.name || 'uploaded.csv', { type: 'text/csv' })

      const uploadResult = await uploadBuildingsCSV(newFile)
      
      const affectedCities = uploadResult?.affected_cities || []
      
      if (affectedCities.length > 0) {
        // Hitung ulang hanya kota-kota yang terdampak
        for (const city of affectedCities) {
          await recalcKota(city)
        }
      } else {
        // Fallback jika karena alasan tertentu respons affected_cities kosong
        await recalc()
      }

      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      const newKotaList = await getBuildingAllKota()
      setKotaList(newKotaList)

      // Detect first city
      let firstCity = null
      if (previewData.length > 0 && previewData[0]['kota']) {
        firstCity = previewData[0]['kota']
      }

      if (firstCity && newKotaList.includes(firstCity)) {
        setKotaFilter(firstCity)
      } else if (!kotaFilter && newKotaList.length > 0) {
        setKotaFilter(newKotaList[0])
      } else {
        await refreshTable()
      }
      if (onDataChanged) onDataChanged()

      setModalMode('')
      setPreviewData(null)
      setPreviewHeaders([])

      setUploadSuccessMsg('Berhasil mengunggah data CSV dan memperbarui kota.')
      setTimeout(() => setUploadSuccessMsg(''), 4000)
    } catch (e) {
      console.error(e)
      setUploadErrorMsg('Gagal mengunggah data CSV.')
      setTimeout(() => setUploadErrorMsg(''), 4000)
    } finally {
      setIsUploading(false)
    }
  }

  async function openEdit(id) {
    const b = await getBuilding(id)
    setEditing(b)
    setModalMode('edit')
  }

  async function onSaveEdit(data) {
    setIsSavingEdit(true)
    try {
      await updateBuilding(editing.id_bangunan, data)
      await recalc(editing.id_bangunan)
      await refreshTable()
      if (onDataChanged) onDataChanged()
      setModalMode('')
      setEditing(null)
    } catch (e) { console.error(e) }
    finally { setIsSavingEdit(false) }
  }

  async function onAdd(data) {
    setIsSavingAdd(true)
    try {
      const buildingCode = buildingNameToCode[data.kode_bangunan]
      if (!buildingCode) throw new Error('Kode bangunan tidak valid')
      const { id_bangunan } = await getNewBuildingId(buildingCode)
      await addBuilding({ ...data, id_bangunan })
      await recalc(id_bangunan)
      if (setProvFilter) setProvFilter(data.provinsi)
      if (setKotaFilter) setKotaFilter(data.kota)
      await refreshTable()
      if (onDataChanged) onDataChanged()
      setModalMode('')
    } catch (e) {
      console.error(e)
      alert('Gagal menambah bangunan: ' + e.message)
    } finally { setIsSavingAdd(false) }
  }

  function onDeleteClick(row) { setDeleteTarget(row) }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteBuilding(deleteTarget.id_bangunan, deleteTarget.kota)
      await refreshTable()
      if (onDataChanged) onDataChanged()
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
      alert('Error deleting')
    } finally { setIsDeleting(false) }
  }

  // Sort client-side
  let displayableRows = rows;
  const isAnyExposureActive = infraLayers.hotel || infraLayers.electricity || infraLayers.educational || infraLayers.healthcare || infraLayers.airport;
  
  if (isAnyExposureActive) {
    // Only filter if at least one exposure category is specifically active
    displayableRows = displayableRows.filter(b => {
      const tax = (b.id_bangunan || b.taxonomy || '').toLowerCase();
      if (tax.includes('hotel') && infraLayers.hotel) return true;
      if ((tax.includes('electricity') || tax.includes('listrik')) && infraLayers.electricity) return true;
      if ((tax.includes('education') || tax.includes('sekolah') || tax.includes('kampus') || tax.startsWith('fd')) && infraLayers.educational) return true;
      if ((tax.includes('health') || tax.includes('rs') || tax.includes('puskesmas') || tax.includes('hospital') || tax.startsWith('fs')) && infraLayers.healthcare) return true;
      if ((tax.includes('airport') || tax.includes('bandara')) && infraLayers.airport) return true;
      return false;
    });
  }

  const displayedRows = [...displayableRows].sort((a, b) => {
    const valA = (a.nama_gedung || '').trim()
    const valB = (b.nama_gedung || '').trim()
    
    if (!valA && valB) return 1;
    if (valA && !valB) return -1;
    
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
  })

  // Classes berdasarkan mode
  const cardBg = 'bg-white border-0'
  const infoBg = 'bg-gray-50 text-gray-700'
  const theadBg = 'bg-gray-100 text-gray-700 font-bold uppercase tracking-wider'
  const rowText = 'text-gray-800'
  const rowHover = 'hover:bg-gray-50'
  const inputCls = 'border p-1 text-[10px] rounded text-gray-900 bg-white border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-0'

  return (
    <div className={`${cardBg} p-2 flex flex-col h-full transition-colors duration-300 relative w-full min-w-0 overflow-hidden`}>

      {/* Notifikasi Modal Upload */}
      {uploadSuccessMsg && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1.5 rounded shadow-xl z-[9999] flex items-center space-x-1 animate-in fade-in slide-in-from-top-4 duration-300 text-[8px]">
          <span className="font-medium">{uploadSuccessMsg}</span>
        </div>
      )}
      {uploadErrorMsg && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1.5 rounded shadow-xl z-[9999] flex items-center space-x-1 animate-in fade-in slide-in-from-top-4 duration-300 text-[8px]">
          <span className="font-medium">{uploadErrorMsg}</span>
        </div>
      )}

      {/* Upload & Filter Section (Ultra Compact) */}
      <div className="flex flex-col gap-1.5 w-full min-w-0 shrink-0">
        
        {/* Row 1: File Upload */}
        <div className="flex gap-1 items-center w-full min-w-0">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={e => setFile(e.target.files[0])}
            className={`${inputCls} w-2/5 text-[10px] h-[26px] !py-1 overflow-hidden`}
          />
          <Button
            onClick={onUpload}
            disabled={!file || isUploading}
            className="bg-[#22D3EE] text-black rounded text-[10px] px-1.5 font-medium flex-1 h-[26px] flex items-center justify-center whitespace-nowrap overflow-hidden min-w-0"
          >
            {isUploading && <LoadingSpinner />} Unggah
          </Button>
          <a
            href="/sample_bangunan.csv"
            download="template_data_bangunan.csv"
            className="bg-[#C6FF00] text-black rounded text-[10px] px-1.5 font-semibold flex-1 h-[26px] flex items-center justify-center whitespace-nowrap overflow-hidden min-w-0 shadow-sm"
          >
            Template CSV
          </a>
        </div>

        {/* Row 2: Filter & Search */}
        <div className="flex gap-1 items-center w-full min-w-0">
          <div className="w-[35%] min-w-0">
            <Select id="kotaFilter" value={activeKotaFilter} onChange={(val) => doSetKotaFilter(val)} options={kotaList} placeholder="Kota" className="w-full text-[10px] !p-1 h-[26px] rounded !leading-tight text-ellipsis overflow-hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => doSetSearch(e.target.value)}
              className={`${inputCls} w-full h-[26px]`}
            />
          </div>
          <Button
            onClick={() => setModalMode('add')}
            className="text-black px-2 text-[10px] font-medium bg-[#C084FC] rounded text-center h-[26px] flex items-center shrink-0"
          >
            Tambah
          </Button>
        </div>
        
      </div>

      <div className="flex-1 overflow-auto mt-2 rounded shadow-sm border border-gray-200 min-w-0 min-h-0 w-full relative custom-scrollbar pb-1 bg-white">
        <table className="w-max min-w-full text-[7px] leading-tight text-left whitespace-nowrap">
          <thead className={`${theadBg} sticky top-0 z-10 transition-colors duration-300 outline outline-1 outline-gray-200`}>
            <tr>
              <th
                className="py-0.5 px-0.5 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                Nama Gedung {sortOrder === 'asc' ? '▲' : '▼'}
              </th>
              <th className="py-0.5 px-0.5 w-[20px] text-center" title="Kategori"></th>
              <th className="py-0.5 px-0.5">Kota</th>
              <th className="py-0.5 px-0.5">Lon</th>
              <th className="py-0.5 px-0.5">Lat</th>
              <th className="py-0.5 px-0.5">Lantai</th>
              <th className="py-0.5 px-0.5">Taxonomy</th>
              <th className="py-0.5 px-0.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map(b => (
              <tr
                key={b.id_bangunan}
                className={`${rowHover} cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-0`}
                onClick={() => onSearchBuilding({
                  lat: parseFloat(b.lat),
                  lon: parseFloat(b.lon),
                  name: b.nama_gedung,
                  type: (b.id_bangunan || '').split('_')[0]
                })}
              >
                <td className={`py-0.5 px-0.5 ${rowText} truncate min-w-[140px]`} title={b.nama_gedung}>{b.nama_gedung}</td>
                <td className="py-0.5 px-1 w-[20px] text-center" title="Kategori">
                  <div className="flex justify-center items-center w-full h-full">
                    {getCategoryIcon(b.id_bangunan, b.taxonomy)}
                  </div>
                </td>
                <td className={`py-0.5 px-0.5 ${rowText}`}>{b.kota}</td>
                <td className={`py-0.5 px-0.5 ${rowText}`}>{parseFloat(b.lon).toFixed(6)}</td>
                <td className={`py-0.5 px-0.5 ${rowText}`}>{parseFloat(b.lat).toFixed(6)}</td>
                <td className={`py-0.5 px-0.5 ${rowText}`}>{b.jumlah_lantai}</td>
                <td className={`py-0.5 px-0.5 ${rowText}`}>{b.taxonomy}</td>
                  <td className={`py-0.5 px-0.5 ${rowText} text-center hidden md:table-cell`}>
                    <div className="flex justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditing(b); setModalMode('edit') }} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteClick(b) }} className="text-red-500 hover:text-red-700 transition-colors" title="Hapus">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>


      <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode('')} forceLightMode={true} maxWidth="max-w-[325px]">
        <AddForm onSave={onAdd} isSavingAdd={isSavingAdd} />
      </Modal>
      <Modal isOpen={modalMode === 'edit'} onClose={() => setModalMode('')} forceLightMode={true} maxWidth="max-w-[325px]">
        <EditForm initial={editing} onSave={onSaveEdit} isSavingEdit={isSavingEdit} />
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} forceLightMode={true} maxWidth="max-w-[400px]">
        <h3 className="text-lg font-bold mb-3 text-gray-900">Hapus Bangunan</h3>
        <p className="text-sm text-gray-700">Yakin ingin menghapus bangunan <strong className="text-gray-900">{deleteTarget?.nama_gedung || 'Tanpa Nama'}</strong>?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-gray-300">
            Batal
          </Button>
          <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center text-sm shadow-sm transition-colors">
            {isDeleting && <LoadingSpinner />}
            Hapus
          </Button>
        </div>
      </Modal>

      {/* MODAL PREVIEW CSV */}
      <Modal isOpen={modalMode === 'preview'} onClose={() => setModalMode('')} maxWidth="max-w-6xl" forceLightMode={true}>
        <h3 className="text-lg font-bold mb-4 text-gray-900">Pratinjau Data CSV</h3>
        <p className="text-sm text-gray-600 mb-4">
          Anda dapat menyunting (edit) detail bangunan di bawah ini sebelum data disimpan.
          <br />
          <span className="text-red-600 font-semibold">
            Pastikan seluruh kolom telah terisi. Data dengan kolom yang kosong tidak dapat dilanjutkan perhitungannya.
          </span>
        </p>

        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] max-w-full rounded-lg border border-gray-200 block">
          <table className="min-w-full text-sm">
            <thead className="bg-[#475569] text-white sticky top-0 z-10">
              <tr>
                {previewHeaders.map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs">
                    {h.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {previewData?.map(row => (
                <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                  {previewHeaders.map((h, i) => (
                    <td key={i} className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {h === 'kode_bangunan' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 bg-white border-gray-300 text-gray-900`}
                        >
                          <option value="FS">FS (Healthcare Facilities)</option>
                          <option value="FD">FD (Educational Facilities)</option>
                          <option value="ELECTRICITY">ELECTRICITY (Electricity)</option>
                          <option value="HOTEL">HOTEL (Hotel)</option>
                          <option value="AIRPORT">AIRPORT (Airport)</option>
                        </select>
                      ) : h === 'taxonomy' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 ${row[h]?.trim() ? 'border-gray-300' : 'border-red-500 bg-red-50 text-black'} bg-white text-gray-900`}
                        >
                          <option value="CR">CR</option>
                          <option value="MCF">MCF</option>
                        </select>
                      ) : h === 'kota' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 ${row[h]?.trim() ? 'border-gray-300' : 'border-red-500 bg-red-50 text-black'} bg-white text-gray-900`}
                        >
                          <option value="">- Pilih Kota -</option>
                          {kotaList.map((k, idx) => (
                            <option key={idx} value={k}>{k}</option>
                          ))}
                        </select>
                      ) : ['alamat', 'lon', 'lat', 'luas', 'jumlah_lantai', 'nama_gedung', 'provinsi'].includes(h) ? (
                        <div className="flex items-center gap-1">
                          <input
                            type={['lon', 'lat', 'luas', 'jumlah_lantai'].includes(h) ? 'number' : 'text'}
                            value={row[h]}
                            onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                            className={`border rounded p-1 max-w-[200px] ${row[h]?.toString().trim() ? 'border-gray-300' : 'border-red-500 bg-red-50 text-black'} bg-white text-gray-900`}
                          />
                          {h === 'lat' && (
                            <button
                              type="button"
                              onClick={() => openMapPicker(row)}
                              title="Pilih di peta"
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              📍
                            </button>
                          )}
                        </div>
                      ) : (
                        <span>{row[h]}</span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row._id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Hapus Baris"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validation Warning Messages */}
        {previewData?.some(row => previewHeaders.some(h => !row[h]?.toString().trim())) && (
          <div className="mt-3 text-red-600 font-semibold text-sm">
            ⚠️ Terdapat isian kosong. Harap lengkapi semua data bersampul merah di atas sebelum menyimpan.
          </div>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button onClick={() => setModalMode('')} disabled={isUploading} className="bg-gray-400 text-white rounded-lg px-4 py-2">
            Batal
          </Button>
          <Button
            onClick={onConfirmUpload}
            disabled={isUploading || previewData?.some(row => previewHeaders.some(h => !row[h]?.toString().trim()))}
            className="bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 flex items-center"
          >
            {isUploading && <LoadingSpinner />}
            Simpan & Hitung
          </Button>
        </div>
      </Modal>

      {/* MODAL MAP PICKER FOR CSV */}
      <Modal isOpen={modalMode === 'map-picker'} onClose={() => setModalMode('preview')} maxWidth="max-w-2xl">
        <h3 className="text-lg font-bold mb-4">Pilih Lokasi</h3>
        <p className="text-sm text-gray-500 mb-4">
          Cari lokasi atau geser penanda (marker) untuk menyesuaikan koordinat.
          Nama lokasi yang dicari akan otomatis mengisi kolom Alamat.
        </p>
        {mapPickerContext && (
          <MiniMap
            lat={mapPickerContext.lat}
            lon={mapPickerContext.lon}
            kode_bangunan={mapPickerContext.kode_bangunan}
            onLatLonChange={(lat, lon) => {
              setMapPickerContext(prev => ({ ...prev, lat, lon }))
            }}
            onLocationSelect={handleMapLocationSelect}
          />
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModalMode('preview');
            }}
            className="bg-gray-400 text-white rounded-lg px-4 py-2"
          >
            Kembali
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMapLocationSelect(mapPickerContext.lat, mapPickerContext.lon, null);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-2"
          >
            Gunakan Koordinat Ini
          </Button>
        </div>
      </Modal>
    </div >
  )
}

function AddForm({ onSave, isSavingAdd, darkMode }) {
  const [data, setData] = useState({
    nama_gedung: '', alamat: '', luas: '', jumlah_lantai: '',
    provinsi: 'BALI', kota: '', lon: '115.2', lat: '-8.4', taxonomy: '', kode_bangunan: ''
  })
  const [localKotaList, setLocalKotaList] = useState([])

  // Load daftar kota Bali saat mount dari master list HSBGN
  useEffect(() => {
    getKotaAll().then(kl => setLocalKotaList(kl))
  }, [])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  const inputCls = `border p-1 px-1.5 h-6 text-[10px] w-full rounded bg-white text-gray-900 border-gray-300`;

  const isValid = () => {
    const l = String(data.luas || '').trim();
    const jl = String(data.jumlah_lantai || '').trim();

    return (
      l !== '' && jl !== '' &&
      data.kota !== '' &&
      data.taxonomy !== '' &&
      data.kode_bangunan !== ''
    );
  };

  return (
    <>
      <h3 className="text-sm font-bold mb-2 text-gray-900">Tambah Bangunan</h3>
      {['nama_gedung', 'alamat', 'luas', 'jumlah_lantai'].map(fld => (
        <div key={fld} className="mb-1">
          <label className="block text-[9px] font-bold text-gray-900 mb-0.5">
            {fld === 'jumlah_lantai' ? 'JUMLAH LANTAI' : fld.replace('_', ' ').toUpperCase()}
          </label>
          <input
            type={['luas', 'jumlah_lantai'].includes(fld) ? 'number' : 'text'}
            step={fld === 'luas' ? 'any' : undefined}
            value={data[fld]}
            onChange={e => setData(d => ({ ...d, [fld]: e.target.value }))}
            className={inputCls}
            placeholder={fld === 'luas' ? 'Harus angka > 0' : fld === 'jumlah_lantai' ? 'Bulat positif (contoh: 2)' : ''}
          />
        </div>
      ))}
      <div className="mb-2">
        <label className="block text-[9px] font-bold text-gray-900 mb-0.5 mt-2">KOTA</label>
        <Select id="addKota" options={localKotaList} value={data.kota} onChange={(v) => setData(d => ({ ...d, kota: v }))} placeholder="- Pilih -" className="w-full text-[10px]" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-[9px] font-bold text-gray-900 mb-0.5 mt-2">LONGITUDE</label>
          <input type="number" step="any" value={data.lon} onChange={e => setData(d => ({ ...d, lon: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-gray-900 mb-0.5 mt-2">LATITUDE</label>
          <input type="number" step="any" value={data.lat} onChange={e => setData(d => ({ ...d, lat: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <MiniMap lat={parseFloat(data.lat)} lon={parseFloat(data.lon)} onLatLonChange={handleLatLonChange} kode_bangunan={data.kode_bangunan} />
      <div className="mb-1">
        <label className="block text-[9px] font-bold text-gray-900 mb-0.5 mt-2">JENIS BANGUNAN</label>
        <Select id="addKodeBangunan" options={['Healthcare Facilities', 'Educational Facilities', 'Electricity', 'Hotel', 'Airport']} value={data.kode_bangunan} onChange={(v) => setData(d => ({ ...d, kode_bangunan: v }))} className="w-full mb-2 text-[10px]" />
      </div>
      <div className="mb-2">
        <label className="block text-[10px] font-semibold mb-0.5 text-gray-900">TAKSONOMI BANGUNAN</label>
        <Select id="addTaxonomy" options={['CR', 'MCF']} value={data.taxonomy} onChange={(v) => setData(d => ({ ...d, taxonomy: v }))} className="w-full text-xs" />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave({ 
              ...data, 
              lon: parseFloat(String(data.lon).replace(',', '.')),
              lat: parseFloat(String(data.lat).replace(',', '.')),
              luas: parseFloat(String(data.luas).replace(',', '.')), 
              jumlah_lantai: parseInt(data.jumlah_lantai, 10) 
            });
          }}
          disabled={isSavingAdd || !isValid()}
          className={`px-3 py-1.5 text-xs rounded-md ${(!isValid() || isSavingAdd) ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isSavingAdd ? 'Menyimpan...' : 'Tambah'}
        </Button>
      </div>
    </>
  )
}

function EditForm({ initial, onSave, isSavingEdit, darkMode }) {
  const [data, setData] = useState(initial || {})
  useEffect(() => { setData(initial || {}) }, [initial])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  const inputCls = `border p-1 px-1.5 h-6 text-[10px] w-full rounded bg-white text-gray-900 border-gray-300`;

  const isValid = () => {
    const l = String(data.luas || '').trim();
    const jl = String(data.jumlah_lantai || '').trim();
    return (
      l !== '' && jl !== '' &&
      (data.taxonomy || '') !== ''
    );
  };

  return (
    <>
      <h3 className="text-sm font-bold mb-2 text-gray-900">Edit Bangunan</h3>
      {['nama_gedung', 'alamat', 'lon', 'lat', 'luas', 'jumlah_lantai'].map(fld => (
        <div key={fld} className="mb-1">
          <label className="block text-[9px] font-bold text-gray-900 mb-0.5">
            {fld === 'jumlah_lantai' ? 'JUMLAH LANTAI' : fld.replace('_', ' ').toUpperCase()}
          </label>
          <input
            type={['lon', 'lat', 'luas', 'jumlah_lantai'].includes(fld) ? 'number' : 'text'}
            step={['lon', 'lat', 'luas'].includes(fld) ? 'any' : undefined}
            value={data[fld] ?? ''}
            onChange={e => setData(d => ({ ...d, [fld]: e.target.value }))}
            className={inputCls}
            placeholder={fld === 'luas' ? 'Harus angka > 0' : fld === 'jumlah_lantai' ? 'Bulat genap positif (contoh: 2)' : ''}
          />
        </div>
      ))}
      <MiniMap
        lat={parseFloat(data.lat)}
        lon={parseFloat(data.lon)}
        onLatLonChange={handleLatLonChange}
        kode_bangunan={data.kode_bangunan || (data.id_bangunan ? data.id_bangunan.split('_')[0] : 'BMN')}
      />
      <div className="mb-1 mt-1">
        <label className="block text-[9px] font-bold text-gray-900 mb-0.5 mt-2">TAKSONOMI BANGUNAN</label>
        <select
          value={data.taxonomy || ''}
          onChange={e => setData(d => ({ ...d, taxonomy: e.target.value }))}
          className={`${inputCls} py-0`}
        >
          <option value="">- Pilih Taksonomi -</option>
          <option value="CR">CR</option>
          <option value="MCF">MCF</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave({
              nama_gedung: data.nama_gedung, alamat: data.alamat,
              lon: parseFloat(String(data.lon).replace(',', '.')), lat: parseFloat(String(data.lat).replace(',', '.')),
              luas: parseFloat(String(data.luas).replace(',', '.')), jumlah_lantai: parseInt(data.jumlah_lantai, 10),
              taxonomy: data.taxonomy
            });
          }}
          disabled={isSavingEdit || !isValid()}
          className={`px-3 py-1 text-[10px] rounded ${(!isValid() || isSavingEdit) ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </>
  )
}
