// components/CrudBuildings.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { 
  Building2, Upload, Search, Plus, Table, MapPin, 
  Trash2, Edit2, Download, FileText, ChevronRight,
  Stethoscope, GraduationCap, Zap, Plane, Bed, Home,
  Database, AlertCircle, X, Loader2, Filter, Save, CheckCircle2, Info
} from 'lucide-react'
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

// Definisi ikon untuk tiap tipe bangunan (Leaflet)
const icons = {
  FS: L.icon({ iconUrl: 'icons/healthcare.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  FD: L.icon({ iconUrl: 'icons/education.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  ELECTRICITY: L.icon({ iconUrl: 'icons/electricity.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  HOTEL: L.icon({ iconUrl: 'icons/hotel.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  AIRPORT: L.icon({ iconUrl: 'icons/airport.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
}

function LoadingSpinner() {
  return <Loader2 className="animate-spin h-4 w-4 inline-block mr-2" />
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
    const map = L.map(mapEl.current).setView([lat || -8.4095, lon || 115.1889], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    mapRef.current = map
    markerRef.current = L.marker([lat || -8.4095, lon || 115.1889], {
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
      mapRef.current.setView([lat || -8.4095, lon || 115.1889], 13)
      markerRef.current.setLatLng([lat || -8.4095, lon || 115.1889])
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
    <div className="space-y-3">
      <div className="flex gap-2 relative z-[9500]">
        <div className="relative flex-1 group">
          <MapPin size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
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
            className={`w-full h-9 pl-8 pr-3 text-xs rounded-xl border outline-none transition-all ${
              darkMode 
                ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 shadow-sm'
            }`}
          />
        </div>
        <button 
          type="button" 
          onClick={handleSearch} 
          className="h-9 px-4 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50" 
          disabled={isSearching}
        >
          {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Cari'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className={`absolute border rounded-xl shadow-2xl max-h-40 overflow-y-auto z-[9000] w-full left-0 mt-[40px] backdrop-blur-xl ${
          darkMode ? 'bg-[#1E2023]/90 border-white/10' : 'bg-white border-slate-200'
        }`}>
          {results.map((r, i) => (
            <div
              key={r.place_id}
              className={`px-3 py-2 cursor-pointer text-[11px] font-medium transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-blue-50 text-slate-700'
              }`}
              onClick={() => handleResultClick(r)}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
      <div ref={mapEl} style={{ height: '200px', width: '100%' }} className={`rounded-xl z-0 border overflow-hidden ${darkMode ? 'border-white/10 shadow-inner' : 'border-slate-200 shadow-sm'}`} />
    </div>
  )
}

function getCategoryIcon(id_bangunan, taxonomy) {
  const tax = (id_bangunan || taxonomy || '').toLowerCase()
  const iconProps = { size: 14, strokeWidth: 2.5 };
  
  if (tax.includes('hotel')) return <Bed {...iconProps} className="text-pink-500" />;
  if (tax.includes('electricity') || tax.includes('listrik')) return <Zap {...iconProps} className="text-yellow-500" />;
  if (tax.includes('education') || tax.includes('sekolah') || tax.includes('kampus') || tax.startsWith('fd')) return <GraduationCap {...iconProps} className="text-blue-500" />;
  if (tax.includes('health') || tax.includes('rs') || tax.includes('puskesmas') || tax.includes('hospital') || tax.startsWith('fs')) return <Stethoscope {...iconProps} className="text-rose-500" />;
  if (tax.includes('airport') || tax.includes('bandara')) return <Plane {...iconProps} className="text-purple-500" />;
  
  return <Building2 {...iconProps} className="text-slate-400" />;
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
  const router = useRouter()
  const { darkMode } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  const [file, setFile] = useState(null)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
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

  function refreshTable(force = false) {
    const cacheKey = `${activeKotaFilter || ''}_${search || ''}`;
    if (!force && apiCache.current[cacheKey]) {
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
        return res;
      })
    }
    return getBuildings({ limit: 50 }).then(res => {
        apiCache.current[cacheKey] = res;
        setRows(res)
        onFilteredBuildings(res)
        return res;
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshTable().catch(err => console.warn('Silently catching table refresh error:', err))
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
      if (onDataChanged) {
        if (affectedCities.length > 0) {
          onDataChanged(affectedCities)
        } else {
          onDataChanged()
        }
      }

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
      await refreshTable(true)
      if (onDataChanged) onDataChanged(editing.kota)
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
      await refreshTable(true)
      if (onDataChanged) onDataChanged(data.kota)
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
      await refreshTable(true)
      if (onDataChanged) onDataChanged(deleteTarget.kota)
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
  const cardBg = darkMode ? 'bg-[#1E2023] border-0' : 'bg-white border-0'
  const infoBg = darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
  const theadBg = darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
  const rowText = darkMode ? 'text-gray-300' : 'text-gray-800'
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
  const inputCls = darkMode
    ? 'border p-1 text-[10px] rounded text-white bg-gray-800 border-gray-700 shadow-sm focus:ring-1 focus:ring-[#1E5C9A] focus:border-[#1E5C9A] min-w-0 transition-colors'
    : 'border p-1 text-[10px] rounded text-gray-900 bg-white border-gray-300 shadow-sm focus:ring-1 focus:ring-[#1E5C9A] focus:border-[#1E5C9A] min-w-0 transition-colors'

  // Tampilkan login prompt jika belum login
  if (!isAuthenticated) {
    return (
      <div className={`flex flex-col items-center justify-center h-full py-10 gap-3 text-center transition-colors ${darkMode ? 'bg-[#1E2023] text-white' : 'bg-white text-gray-700'}`}>
        <div className="text-4xl">🔒</div>
        <p className="text-sm font-semibold">Fitur ini memerlukan login</p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Silakan masuk ke akun Anda untuk mengelola data bangunan.</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-5 py-2 bg-[#1E5C9A] text-white text-sm font-semibold rounded-full hover:bg-[#2F6FAF] transition shadow-md"
        >
          Masuk
        </button>
      </div>
    )
  }

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

      {/* Upload & Filter Section (Premium Toolbar) */}
      <div className={`p-2 md:p-4 rounded-3xl mb-2 md:mb-4 border transition-all duration-300 ${
        darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col gap-1.5 md:gap-2">
          {/* Row 1: Upload & Templates */}
          <div className={`p-1.5 md:p-2.5 rounded-xl flex flex-col md:flex-row gap-1.5 md:gap-2 items-center border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            {/* Custom File Input */}
            <div className={`relative w-full md:w-auto md:flex-1 group ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              <input
                type="file"
                accept=".csv"
                id="file-upload"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`flex items-center gap-1.5 md:gap-2.5 px-2 md:px-3 h-7 md:h-8 rounded-lg border-2 border-dashed transition-all ${
                file 
                  ? (darkMode ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700')
                  : (darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300')
              }`}>
                <FileText size={12} className={file ? 'text-blue-500' : 'text-gray-400'} />
                <span className="text-[8px] md:text-[9px] font-bold truncate max-w-[200px] md:max-w-[350px]">
                  {file ? file.name : 'Pilih File .CSV'}
                </span>
                {!file && (
                  <span className={`ml-auto text-[6px] md:text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-blue-500 text-white animate-pulse`}>
                    Browse
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full md:w-auto gap-1.5 md:gap-2">
              <button
                onClick={onUpload}
                disabled={!file || isUploading}
                className={`flex-1 md:flex-none justify-center h-7 md:h-8 px-3 md:px-4 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 md:gap-2 transition-all shadow-lg active:scale-95 ${
                  file && !isUploading
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                    : (darkMode ? 'bg-white/5 text-gray-500' : 'bg-slate-200 text-slate-400')
                }`}
              >
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Unggah Data
              </button>

              <a
                href="/sample_bangunan.csv"
                download="template_data_bangunan.csv"
                className={`flex-1 md:flex-none justify-center h-7 md:h-8 px-3 md:px-4 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-wider flex items-center gap-1 md:gap-1.5 transition-all ${
                  darkMode 
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Download size={12} />
                Template
              </a>
            </div>
          </div>

          {/* Row 2: Search & Actions */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <div className="w-[70px] md:w-[85px]">
              <Select 
                id="kotaFilter" 
                value={activeKotaFilter} 
                onChange={(val) => doSetKotaFilter(val)} 
                options={kotaList} 
                placeholder="KOTA" 
                className="w-full text-[8px] md:text-[9px] font-black h-7 md:h-8 rounded-xl !bg-transparent border-0" 
              />
            </div>
            <div className="relative group flex-1 min-w-[80px] md:min-w-[100px]">
              <Search className={`absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={11} />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={e => doSetSearch(e.target.value)}
                className={`w-full h-7 md:h-8 pl-7 md:pl-8 pr-2 md:pr-3 rounded-xl border transition-all duration-300 text-[8px] md:text-[9px] font-medium outline-none ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50' 
                    : 'bg-white border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 shadow-inner'
                }`}
              />
            </div>
            <button
              onClick={() => setModalMode('add')}
              className="h-7 md:h-8 px-3 md:px-4 bg-blue-600 text-white rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={12} strokeWidth={3} />
              Data
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className={`flex-1 overflow-hidden rounded-[32px] border ${
        darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-xl'
      } flex flex-col min-h-0`}>
        <div className="overflow-auto custom-scrollbar flex-1 relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className={`sticky top-0 z-20 backdrop-blur-xl ${
              darkMode ? 'bg-[#0D0F12]/80 border-b border-white/5 shadow-lg' : 'bg-slate-50/90 border-b border-slate-200 shadow-sm'
            }`}>
              <tr>
                <th
                  className={`py-1.5 px-4 text-[8.5px] font-black uppercase tracking-wider cursor-pointer group whitespace-nowrap ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-2">
                    Nama Gedung {sortOrder === 'asc' ? '▲' : '▼'}
                  </div>
                </th>
                <th className={`py-1.5 px-2 w-[40px] text-center text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Tipe</th>
                <th className={`py-1.5 px-4 text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kota</th>
                <th className={`py-1.5 px-4 text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kordinat</th>
                <th className={`py-1.5 px-4 text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Lantai</th>
                <th className={`py-1.5 px-4 text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taxonomy</th>
                <th className={`py-1.5 px-5 text-[8.5px] font-black uppercase tracking-wider text-center ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kelola</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {displayedRows.length > 0 ? displayedRows.map(b => (
                <tr
                  key={b.id_bangunan}
                  className={`group transition-all duration-300 cursor-pointer ${
                    darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-blue-50/50'
                  }`}
                  onClick={() => onSearchBuilding({
                    lat: parseFloat(b.lat),
                    lon: parseFloat(b.lon),
                    name: b.nama_gedung,
                    type: (b.id_bangunan || '').split('_')[0]
                  })}
                >
                  <td className="py-1.5 px-4">
                    <div className={`text-[9.5px] font-bold leading-tight ${darkMode ? 'text-gray-200 group-hover:text-white' : 'text-slate-800'}`}>
                      {b.nama_gedung || 'Tanpa Nama'}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex justify-center transition-transform duration-300 group-hover:scale-110">
                      {getCategoryIcon(b.id_bangunan, b.taxonomy)}
                    </div>
                  </td>
                  <td className={`py-2.5 px-4 text-[10px] font-semibold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{b.kota}</td>
                  <td className={`py-2.5 px-4 text-[10px] font-mono font-medium ${darkMode ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                    {parseFloat(b.lon).toFixed(5)}, {parseFloat(b.lat).toFixed(5)}
                  </td>
                  <td className={`py-3.5 px-4 text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{b.jumlah_lantai}</td>
                  <td className={`py-3.5 px-4 text-xs uppercase font-black tracking-tighter ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{b.taxonomy}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditing(b); setModalMode('edit') }} 
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`} 
                        title="Sunting Data"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteClick(b) }} 
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          darkMode ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`} 
                        title="Hapus Data"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Table size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">Data Tidak Ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode('')} maxWidth="max-w-md">
        <AddForm onSave={onAdd} isSavingAdd={isSavingAdd} darkMode={darkMode} />
      </Modal>

      <Modal isOpen={modalMode === 'edit'} onClose={() => setModalMode('')} maxWidth="max-w-md">
        <EditForm initial={editing} onSave={onSaveEdit} isSavingEdit={isSavingEdit} darkMode={darkMode} />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)} maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <Trash2 size={32} strokeWidth={2.5} />
          </div>
          <h3 className={`text-xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Hapus Bangunan
          </h3>
          <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            Yakin ingin menghapus <span className="font-bold text-rose-500">{deleteTarget?.nama_gedung || 'Tanpa Nama'}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
                darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 h-12 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL PREVIEW CSV */}
      <Modal isOpen={modalMode === 'preview'} onClose={() => setModalMode('')} maxWidth="max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Table size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Pratinjau Data CSV
            </h3>
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Selesaikan penyuntingan sebelum menyimpan data ke database. <span className="text-rose-500">Kolom merah wajib diisi.</span>
            </p>
          </div>
        </div>

        <div className={`overflow-auto max-h-[60vh] rounded-2xl border ${
          darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white'
        } relative custom-scrollbar`}>
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className={`sticky top-0 z-20 backdrop-blur-md ${
              darkMode ? 'bg-[#0D0F12]/90 border-b border-white/5' : 'bg-slate-100/90 border-b border-slate-200'
            }`}>
              <tr>
                {previewHeaders.map((h, i) => (
                  <th key={i} className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    {h.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest text-center ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {previewData?.map(row => (
                <tr key={row._id} className={`transition-colors ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-blue-50/30'}`}>
                  {previewHeaders.map((h, i) => (
                    <td key={i} className="py-2 px-3">
                      {h === 'kode_bangunan' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`w-full h-8 px-2 rounded-lg border text-[11px] font-bold outline-none transition-all ${
                            darkMode ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="FS">Healthcare</option>
                          <option value="FD">Education</option>
                          <option value="ELECTRICITY">Electricity</option>
                          <option value="HOTEL">Hotel</option>
                          <option value="AIRPORT">Airport</option>
                        </select>
                      ) : h === 'taxonomy' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`w-full h-8 px-2 rounded-lg border text-[11px] font-bold outline-none transition-all ${
                            row[h]?.trim() 
                              ? (darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200') 
                              : 'border-rose-500 bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <option value="CR">CR</option>
                          <option value="MCF">MCF</option>
                        </select>
                      ) : h === 'kota' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`w-full h-8 px-2 rounded-lg border text-[11px] font-bold outline-none transition-all ${
                            row[h]?.trim() 
                              ? (darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200') 
                              : 'border-rose-500 bg-rose-500/10 text-rose-500'
                          }`}
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
                            className={`flex-1 h-8 px-2 rounded-lg border text-[11px] font-bold outline-none transition-all ${
                              row[h]?.toString().trim() 
                                ? (darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200') 
                                : 'border-rose-500 bg-rose-500/10 text-rose-500'
                            }`}
                          />
                          {h === 'lat' && (
                            <button
                              type="button"
                              onClick={() => openMapPicker(row)}
                              className={`p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-white/10 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                            >
                              <MapPin size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium opacity-60 px-2">{row[h]}</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-3">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row._id)}
                        className={`p-2 rounded-lg transition-all ${darkMode ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validation Warning */}
        {previewData?.some(row => previewHeaders.some(h => !row[h]?.toString().trim())) && (
          <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 animate-pulse ${
            darkMode ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            <AlertCircle size={18} />
            <p className="text-xs font-bold uppercase tracking-wider">
              Terdapat isian kosong. Harap lengkapi semua data bersampul merah di atas sebelum menyimpan.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-6">
          <button
            onClick={() => setModalMode('')}
            className={`px-8 h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Batal
          </button>
          <button
            onClick={onConfirmUpload}
            disabled={isUploading || previewData?.some(row => previewHeaders.some(h => !row[h]?.toString().trim()))}
            className={`px-10 h-12 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan & Hitung AAL
          </button>
        </div>
      </Modal>

      {/* MODAL MAP PICKER FOR CSV */}
      <Modal isOpen={modalMode === 'map-picker'} onClose={() => setModalMode('preview')} maxWidth="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <MapPin size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Pilih Lokasi Di Peta
            </h3>
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Cari lokasi atau geser marker untuk akurasi presisi.
            </p>
          </div>
        </div>

        {mapPickerContext && (
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <MiniMap
              lat={mapPickerContext.lat}
              lon={mapPickerContext.lon}
              kode_bangunan={mapPickerContext.kode_bangunan}
              onLatLonChange={(lat, lon) => {
                setMapPickerContext(prev => ({ ...prev, lat, lon }))
              }}
              onLocationSelect={handleMapLocationSelect}
            />
          </div>
        )}
        <div className="mt-8 flex justify-end gap-3 border-t border-white/5 pt-6">
          <button
            onClick={() => setModalMode('preview')}
            className={`px-6 h-11 rounded-xl text-xs font-bold transition-all ${
              darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kembali
          </button>
          <button
            onClick={() => handleMapLocationSelect(mapPickerContext.lat, mapPickerContext.lon, null)}
            className="px-8 h-11 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg"
          >
            Gunakan Koordinat
          </button>
        </div>
      </Modal>
    </div >
  )
}

function AddForm({ onSave, isSavingAdd, darkMode }) {
  const [data, setData] = useState({
    nama_gedung: '', alamat: '', luas: '', jumlah_lantai: '',
    provinsi: 'BALI', kota: '', lon: '115.1889', lat: '-8.4095', taxonomy: '', kode_bangunan: ''
  })
  const [localKotaList, setLocalKotaList] = useState([])

  useEffect(() => {
    getKotaAll().then(kl => setLocalKotaList(kl))
  }, [])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  const isValid = () => {
    return data.nama_gedung && data.luas && data.jumlah_lantai && data.kota && data.taxonomy && data.kode_bangunan;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
          <Plus size={20} strokeWidth={2.5} />
        </div>
        <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Tambah Bangunan Baru
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Nama Gedung</label>
          <input
            type="text"
            value={data.nama_gedung}
            onChange={e => setData(d => ({ ...d, nama_gedung: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-medium outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
            placeholder="Contoh: RSUD Bali Mandara"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Alamat</label>
          <input
            type="text"
            value={data.alamat}
            onChange={e => setData(d => ({ ...d, alamat: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-medium outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Luas Lantai (m²)</label>
          <input
            type="number"
            value={data.luas}
            onChange={e => setData(d => ({ ...d, luas: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-mono outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Jumlah Lantai</label>
          <input
            type="number"
            value={data.jumlah_lantai}
            onChange={e => setData(d => ({ ...d, jumlah_lantai: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-mono outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Lokasi & Koordinat</label>
          <div className="flex gap-2 mb-2">
            <input type="number" step="any" value={data.lon} onChange={e => setData(d => ({ ...d, lon: e.target.value }))} className={`flex-1 h-9 px-3 rounded-xl border text-[11px] font-mono ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Lon" />
            <input type="number" step="any" value={data.lat} onChange={e => setData(d => ({ ...d, lat: e.target.value }))} className={`flex-1 h-9 px-3 rounded-xl border text-[11px] font-mono ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Lat" />
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/5 h-[180px]">
            <MiniMap lat={parseFloat(data.lat)} lon={parseFloat(data.lon)} onLatLonChange={handleLatLonChange} kode_bangunan={data.kode_bangunan} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kota</label>
            <Select id="addKota" options={localKotaList} value={data.kota} onChange={(v) => setData(d => ({ ...d, kota: v }))} placeholder="- Pilih -" className="w-full text-xs font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taksonomi</label>
            <Select id="addTaxonomy" options={['CR', 'MCF']} value={data.taxonomy} onChange={(v) => setData(d => ({ ...d, taxonomy: v }))} placeholder="Pilih..." className="w-full text-xs font-bold" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Kategori Bangunan</label>
          <Select id="addKodeBangunan" options={['Healthcare Facilities', 'Educational Facilities', 'Electricity', 'Hotel', 'Airport']} value={data.kode_bangunan} onChange={(v) => setData(d => ({ ...d, kode_bangunan: v }))} className="w-full text-xs font-bold" />
        </div>
      </div>

      <div className="mt-8 flex justify-end border-t border-white/5 pt-6">
        <button
          onClick={() => {
            onSave({ 
              ...data, 
              lon: parseFloat(String(data.lon).replace(',', '.')),
              lat: parseFloat(String(data.lat).replace(',', '.')),
              luas: parseFloat(String(data.luas).replace(',', '.')), 
              jumlah_lantai: parseInt(data.jumlah_lantai, 10) 
            });
          }}
          disabled={isSavingAdd || !isValid()}
          className={`px-10 h-12 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50`}
        >
          {isSavingAdd ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Tambah Bangunan
        </button>
      </div>
    </div>
  )
}

function EditForm({ initial, onSave, isSavingEdit, darkMode }) {
  const [data, setData] = useState(initial || {})
  useEffect(() => { setData(initial || {}) }, [initial])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  const isValid = () => {
    return data.nama_gedung && data.luas && data.jumlah_lantai && data.taxonomy;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
          <Edit2 size={20} strokeWidth={2.5} />
        </div>
        <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Sunting Bangunan
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Nama Gedung</label>
          <input
            type="text"
            value={data.nama_gedung ?? ''}
            onChange={e => setData(d => ({ ...d, nama_gedung: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-medium outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Alamat</label>
          <input
            type="text"
            value={data.alamat ?? ''}
            onChange={e => setData(d => ({ ...d, alamat: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-medium outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Luas Lantai (m²)</label>
          <input
            type="number"
            value={data.luas ?? ''}
            onChange={e => setData(d => ({ ...d, luas: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-mono outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Jumlah Lantai</label>
          <input
            type="number"
            value={data.jumlah_lantai ?? ''}
            onChange={e => setData(d => ({ ...d, jumlah_lantai: e.target.value }))}
            className={`w-full h-10 px-3 rounded-xl border text-sm font-mono outline-none transition-all ${
              darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Lokasi & Koordinat</label>
          <div className="flex gap-2 mb-2">
            <input type="number" step="any" value={data.lon ?? ''} onChange={e => setData(d => ({ ...d, lon: e.target.value }))} className={`flex-1 h-9 px-3 rounded-xl border text-[11px] font-mono ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Lon" />
            <input type="number" step="any" value={data.lat ?? ''} onChange={e => setData(d => ({ ...d, lat: e.target.value }))} className={`flex-1 h-9 px-3 rounded-xl border text-[11px] font-mono ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Lat" />
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/5 h-[180px]">
             <MiniMap
              lat={parseFloat(data.lat)}
              lon={parseFloat(data.lon)}
              onLatLonChange={handleLatLonChange}
              kode_bangunan={data.kode_bangunan || (data.id_bangunan ? data.id_bangunan.split('_')[0] : 'BMN')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taksonomi Bangunan</label>
          <Select id="editTaxonomy" options={['CR', 'MCF']} value={data.taxonomy} onChange={(v) => setData(d => ({ ...d, taxonomy: v }))} placeholder="Pilih..." className="w-full text-xs font-bold" />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-white/5 pt-6">
        <button
          onClick={(e) => {
            onSave({
              nama_gedung: data.nama_gedung, alamat: data.alamat,
              lon: parseFloat(String(data.lon).replace(',', '.')), lat: parseFloat(String(data.lat).replace(',', '.')),
              luas: parseFloat(String(data.luas).replace(',', '.')), jumlah_lantai: parseInt(data.jumlah_lantai, 10),
              taxonomy: data.taxonomy
            });
          }}
          disabled={isSavingEdit || !isValid()}
          className={`px-10 h-12 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg active:scale-95 disabled:opacity-50`}
        >
          {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Perubahan
        </button>
      </div>
    </div>
  )
}
