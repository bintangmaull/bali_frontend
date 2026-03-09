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
  recalc as recalcApi
} from '../src/lib/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Definisi ikon untuk tiap tipe bangunan
const icons = {
  BMN: L.icon({ iconUrl: 'icons/gedungnegara.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  FS: L.icon({ iconUrl: 'icons/kesehatan.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
  FD: L.icon({ iconUrl: 'icons/sekolah.svg', iconSize: [20, 20], iconAnchor: [6, 20], popupAnchor: [0, -20], className: 'rounded-icon' }),
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
    e.preventDefault()
    if (!search.trim()) return
    setIsSearching(true)
    setResults([])
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
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
      <form onSubmit={handleSearch} className="mb-2 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari lokasi (misal: Taman Mini Indonesia Indah)"
          className="border p-2 rounded-lg w-full text-black"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 rounded-lg" disabled={isSearching}>
          Cari
        </button>
      </form>
      {results.length > 0 && (
        <div className="bg-white border rounded-lg shadow max-h-40 overflow-y-auto mb-2 z-10 relative">
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
      <div ref={mapEl} style={{ height: '200px', width: '100%', marginTop: '10px' }} />
    </div>
  )
}

const buildingNameToCode = {
  'Fasilitas Kesehatan': 'FS',
  'Fasilitas Pendidikan': 'FD',
  'Bangunan Milik Negara': 'BMN'
}

export default function CrudBuildings({
  provFilter,
  setProvFilter,
  kotaFilter,
  setKotaFilter,
  onSearchBuilding = () => { },
  recalc = recalcApi,
  externalSearch = undefined,
  setExternalSearch = undefined
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

  // Load semua kota langsung saat mount (untuk filter bar)
  useEffect(() => { getBuildingAllKota().then(setKotaList) }, [])

  function refreshTable() {
    if (kotaFilter) {
      return getBuildings({ kota: kotaFilter, nama: search }).then(res => {
        setRows(res)
      })
    }
    setRows([])
    return Promise.resolve()
  }

  useEffect(() => { refreshTable() }, [kotaFilter, search])

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

      await uploadBuildingsCSV(newFile)
      await recalc()
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
      setProvFilter(data.provinsi)
      setKotaFilter(data.kota)
      await refreshTable()
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
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
      alert('Error deleting')
    } finally { setIsDeleting(false) }
  }

  // Sort client-side
  const displayedRows = [...rows].sort((a, b) => {
    const valA = a.nama_gedung || ''
    const valB = b.nama_gedung || ''
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
  })

  // Classes berdasarkan mode
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
  const infoBg = darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
  const theadBg = darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
  const rowText = darkMode ? 'text-white' : 'text-gray-800'
  const rowHover = darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
  const inputCls = darkMode ? 'border p-2 rounded-lg flex-1 text-white bg-gray-700 border-gray-600' : 'border p-2 rounded-lg flex-1 text-gray-900 bg-white border-gray-300'

  return (
    <div className={`${cardBg} p-5 -mx-4 rounded-2xl shadow flex flex-col h-[600px] -my-4 transition-colors duration-300 relative`}>

      {/* Notifikasi Modal Upload */}
      {uploadSuccessMsg && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="text-sm font-medium">{uploadSuccessMsg}</span>
        </div>
      )}
      {uploadErrorMsg && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span className="text-sm font-medium">{uploadErrorMsg}</span>
        </div>
      )}

      <h2 className={`${infoBg} rounded-xl p-2 mb-3 transition-colors duration-300`}>
        Untuk mengunggah data bangunan, pastikan mengikuti template pengisian data dengan baik.
        Silakan unduh terlebih dahulu.
        <br />
        <a
          href="/sample_bangunan.csv"
          download="template_data_bangunan.csv"
          className="inline-block mt-4 px-4 py-2 bg-[#22D3EE] text-black rounded-4xl hover:bg-[#3B82F6] hover:text-white transition"
        >
          Unduh Template CSV
        </a>
      </h2>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={e => setFile(e.target.files[0])}
            className={inputCls}
          />
          <Button
            onClick={onUpload}
            disabled={!file || isUploading}
            className="bg-[#22D3EE] text-black rounded-4xl hover:bg-[#3B82F6] hover:text-white px-4 py-2 transition"
          >
            {isUploading && <LoadingSpinner />} Unggah Data
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          <Select id="kotaFilter" value={kotaFilter} onChange={setKotaFilter} options={['', ...kotaList]} placeholder="Pilih Kota" className="w-48" />
          <input
            type="text"
            placeholder="Cari Nama Gedung"
            disabled={!kotaFilter}
            value={search}
            onChange={e => doSetSearch(e.target.value)}
            className={inputCls}
          />
          <Button
            onClick={() => setModalMode('add')}
            className="text-black px-4 py-2 bg-[#C084FC] rounded-4xl hover:bg-cyan-700 hover:text-white"
          >
            Tambah
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto mt-4 h-[600px]">
        <table className="w-full text-sm">
          <thead className={`${theadBg} sticky top-0 transition-colors duration-300`}>
            <tr>
              <th
                className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                Nama Gedung {sortOrder === 'asc' ? '▲' : '▼'}
              </th>
              {['Alamat', 'Kota', 'Lon', 'Lat', 'Lantai', 'Taxonomy', 'Aksi'].map(h => (
                <th key={h} className="p-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map(b => (
              <tr
                key={b.id_bangunan}
                className={`${rowHover} cursor-pointer transition-colors duration-150`}
                onClick={() => onSearchBuilding({
                  lat: parseFloat(b.lat),
                  lon: parseFloat(b.lon),
                  name: b.nama_gedung,
                  type: (b.id_bangunan || '').split('_')[0]
                })}
              >
                <td className={`p-2 ${rowText}`}>{b.nama_gedung}</td>
                <td className={`p-2 ${rowText}`}>{b.alamat}</td>
                <td className={`p-2 ${rowText}`}>{b.kota}</td>
                <td className={`p-2 ${rowText}`}>{b.lon}</td>
                <td className={`p-2 ${rowText}`}>{b.lat}</td>
                <td className={`p-2 ${rowText}`}>{b.jumlah_lantai}</td>
                <td className={`p-2 ${rowText}`}>{b.taxonomy}</td>
                <td className="p-2 space-x-2">
                  <button onClick={e => { e.stopPropagation(); openEdit(b.id_bangunan) }} className="text-blue-400 hover:text-blue-300">✏️</button>
                  <button onClick={e => { e.stopPropagation(); onDeleteClick(b) }} className="text-red-400 hover:text-red-300">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <Modal isOpen={modalMode === 'add'} onClose={() => setModalMode('')}>
        <AddForm onSave={onAdd} isSavingAdd={isSavingAdd} />
      </Modal>
      <Modal isOpen={modalMode === 'edit'} onClose={() => setModalMode('')}>
        <EditForm initial={editing} onSave={onSaveEdit} isSavingEdit={isSavingEdit} />
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <h3 className="text-lg font-bold mb-4">Hapus Bangunan</h3>
        <p>Yakin ingin menghapus bangunan <strong>{deleteTarget?.nama_gedung}</strong>?</p>
        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg">
            Batal
          </Button>
          <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center">
            {isDeleting && <LoadingSpinner />}
            Hapus
          </Button>
        </div>
      </Modal>

      {/* MODAL PREVIEW CSV */}
      <Modal isOpen={modalMode === 'preview'} onClose={() => setModalMode('')} maxWidth="max-w-6xl">
        <h3 className="text-lg font-bold mb-4">Pratinjau Data CSV</h3>
        <p className="text-sm text-gray-500 mb-4">
          Anda dapat menyunting (edit) detail bangunan di bawah ini sebelum data disimpan.
          <br />
          <span className="text-red-500 font-semibold">
            Pastikan seluruh kolom telah terisi. Data dengan kolom yang kosong tidak dapat dilanjutkan perhitungannya.
          </span>
        </p>

        <div className="overflow-x-auto max-h-[60vh] rounded-lg border border-gray-200">
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
            <tbody className={`divide-y divide-gray-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {previewData?.map(row => (
                <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                  {previewHeaders.map((h, i) => (
                    <td key={i} className={`whitespace-nowrap px-4 py-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      {h === 'kode_bangunan' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="BMN">BMN (Bangunan Milik Negara)</option>
                          <option value="FS">FS (Fasilitas Kesehatan)</option>
                          <option value="FD">FD (Fasilitas Pendidikan)</option>
                        </select>
                      ) : h === 'taxonomy' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 ${row[h]?.trim() ? (darkMode ? 'border-gray-600' : 'border-gray-300') : 'border-red-500 bg-red-50 text-black'} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                        >
                          <option value="CR">CR</option>
                          <option value="MCF">MCF</option>
                          <option value="MUR">MUR</option>
                          <option value="LightWood">LightWood</option>
                        </select>
                      ) : h === 'kota' ? (
                        <select
                          value={row[h]}
                          onChange={(e) => handlePreviewChange(row._id, h, e.target.value)}
                          className={`border rounded p-1 ${row[h]?.trim() ? (darkMode ? 'border-gray-600' : 'border-gray-300') : 'border-red-500 bg-red-50 text-black'} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
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
                            className={`border rounded p-1 max-w-[200px] ${row[h]?.toString().trim() ? (darkMode ? 'border-gray-600' : 'border-gray-300') : 'border-red-500 bg-red-50 text-black'} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
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
            onClick={() => setModalMode('preview')}
            className="bg-gray-400 text-white rounded-lg px-4 py-2"
          >
            Kembali
          </Button>
          <Button
            onClick={() => handleMapLocationSelect(mapPickerContext.lat, mapPickerContext.lon, null)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2"
          >
            Gunakan Koordinat Ini
          </Button>
        </div>
      </Modal>
    </div >
  )
}

function AddForm({ onSave, isSavingAdd }) {
  const [data, setData] = useState({
    nama_gedung: '', alamat: '', luas: '', jumlah_lantai: '',
    provinsi: 'BALI', kota: '', lon: '115.2', lat: '-8.4', taxonomy: '', kode_bangunan: ''
  })
  const [localKotaList, setLocalKotaList] = useState([])

  // Load daftar kota Bali saat mount
  useEffect(() => {
    getBuildingKota('BALI').then(kl => setLocalKotaList(kl))
  }, [])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  return (
    <>
      <h3 className="text-lg font-bold mb-4">Tambah Bangunan</h3>
      {['nama_gedung', 'alamat', 'luas', 'jumlah_lantai'].map(fld => (
        <div key={fld} className="mb-2">
          <label className="block text-sm font-semibold">
            {fld === 'jumlah_lantai' ? 'JUMLAH LANTAI' : fld.replace('_', ' ').toUpperCase()}
          </label>
          <input
            type={['luas', 'jumlah_lantai'].includes(fld) ? 'number' : 'text'}
            step={fld === 'luas' ? 'any' : undefined}
            value={data[fld]}
            onChange={e => setData(d => ({ ...d, [fld]: e.target.value }))}
            className="border p-2 w-full rounded-lg"
          />
        </div>
      ))}
      <div className="mb-2">
        <label className="block text-sm font-semibold mb-1">KOTA</label>
        <Select id="addKota" options={['', ...localKotaList]} value={data.kota} onChange={v => setData(d => ({ ...d, kota: v }))} placeholder="- Pilih -" className="w-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-sm font-semibold">Longitude</label>
          <input type="number" step="any" value={data.lon} onChange={e => setData(d => ({ ...d, lon: e.target.value }))} className="border p-2 w-full rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-semibold">Latitude</label>
          <input type="number" step="any" value={data.lat} onChange={e => setData(d => ({ ...d, lat: e.target.value }))} className="border p-2 w-full rounded-lg" />
        </div>
      </div>
      <MiniMap lat={parseFloat(data.lat)} lon={parseFloat(data.lon)} onLatLonChange={handleLatLonChange} kode_bangunan={data.kode_bangunan} />
      <div className="mb-1">
        <label className="block text-sm font-semibold mb-1">JENIS BANGUNAN</label>
        <Select id="addKodeBangunan" options={['Bangunan Milik Negara', 'Fasilitas Kesehatan', 'Fasilitas Pendidikan']} value={data.kode_bangunan} onChange={v => setData(d => ({ ...d, kode_bangunan: v }))} className="w-full mb-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">TAKSONOMI BANGUNAN</label>
        <Select id="addTaxonomy" options={['CR', 'MCF', 'MUR', 'LightWood']} value={data.taxonomy} onChange={v => setData(d => ({ ...d, taxonomy: v }))} className="w-full" />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => onSave({ ...data, luas: parseFloat(data.luas), jumlah_lantai: parseInt(data.jumlah_lantai, 10) })}
          disabled={isSavingAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {isSavingAdd ? 'Menyimpan...' : 'Tambah'}
        </Button>
      </div>
    </>
  )
}

function EditForm({ initial, onSave, isSavingEdit }) {
  const [data, setData] = useState(initial || {})
  useEffect(() => { setData(initial || {}) }, [initial])

  const handleLatLonChange = (lat, lon) => {
    setData(d => ({ ...d, lat: lat.toString(), lon: lon.toString() }))
  }

  return (
    <>
      <h3 className="text-lg font-bold mb-4">Edit Bangunan</h3>
      {['nama_gedung', 'alamat', 'lon', 'lat', 'luas', 'jumlah_lantai'].map(fld => (
        <div key={fld} className="mb-2">
          <label className="block text-sm font-semibold">
            {fld === 'jumlah_lantai' ? 'JUMLAH LANTAI' : fld.replace('_', ' ').toUpperCase()}
          </label>
          <input
            type={['lon', 'lat', 'luas', 'jumlah_lantai'].includes(fld) ? 'number' : 'text'}
            step={['lon', 'lat', 'luas'].includes(fld) ? 'any' : undefined}
            value={data[fld] ?? ''}
            onChange={e => setData(d => ({ ...d, [fld]: e.target.value }))}
            className="border p-2 w-full rounded-lg"
          />
        </div>
      ))}
      <MiniMap
        lat={parseFloat(data.lat)}
        lon={parseFloat(data.lon)}
        onLatLonChange={handleLatLonChange}
        kode_bangunan={data.kode_bangunan || (data.id_bangunan ? data.id_bangunan.split('_')[0] : 'BMN')}
      />
      <div className="mb-4">
        <label className="block text-sm font-semibold">Taxonomy</label>
        <select
          value={data.taxonomy || ''}
          onChange={e => setData(d => ({ ...d, taxonomy: e.target.value }))}
          className="border p-2 w-full rounded-lg"
        >
          <option value="CR">CR</option>
          <option value="MCF">MCF</option>
          <option value="MUR">MUR</option>
          <option value="LightWood">LightWood</option>
        </select>
      </div>
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => onSave({
            nama_gedung: data.nama_gedung, alamat: data.alamat,
            lon: parseFloat(data.lon), lat: parseFloat(data.lat),
            luas: parseFloat(data.luas), jumlah_lantai: parseInt(data.jumlah_lantai, 10),
            taxonomy: data.taxonomy
          })}
          disabled={isSavingEdit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </>
  )
}
