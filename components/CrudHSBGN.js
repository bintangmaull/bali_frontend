// components/CrudHSBGN.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Modal from './ui/Modal'
import {
  getHSBGN,
  updateHSBGN,
  recalcHSBGN
} from '../src/lib/api'

export default function CrudHSBGN({ onDataChanged }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [rows, setRows] = useState([])
  const [searchCity, setSearchCity] = useState('')
  const [editing, setEditing] = useState(null)
  const [hsbgnSederhana, setHsbgnSederhana] = useState('')
  const [hsbgnTidakSederhana, setHsbgnTidakSederhana] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  function reloadTable() {
    getHSBGN().then(setRows).catch(console.error)
  }

  useEffect(() => {
    if (isAuthenticated) reloadTable()
  }, [isAuthenticated])

  // Tampilkan login prompt jika belum login
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <div className="text-3xl">🔒</div>
        <p className="text-sm font-semibold text-gray-700">Fitur ini memerlukan login</p>
        <p className="text-xs text-gray-500">Silakan masuk ke akun Anda untuk mengelola data HSBGN.</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-5 py-2 bg-[#C6FF00] text-black text-sm font-semibold rounded-full hover:bg-[#d4ff33] transition"
        >
          Masuk
        </button>
      </div>
    )
  }



  const filteredRows = rows.filter(r => {
    const matchCity = !searchCity || r.kota.toLowerCase().includes(searchCity.toLowerCase())
    return matchCity
  })

  function onEditClick(row) {
    setEditing(row)
    setHsbgnSederhana(row.hsbgn_sederhana)
    setHsbgnTidakSederhana(row.hsbgn_tidaksederhana)
  }

  async function onSave() {
    setIsSaving(true)
    try {
      await updateHSBGN(editing.id_kota, {
        hsbgn_sederhana: parseFloat(hsbgnSederhana),
        hsbgn_tidaksederhana: parseFloat(hsbgnTidakSederhana)
      })
      await recalcHSBGN(editing.id_kota)

      setSuccessMsg('Pembaruan data dan perhitungan nilai AAL kota telah berhasil diselesaikan.')
      setShowSuccess(true)

      reloadTable()
      if (onDataChanged) onDataChanged(editing.kota)
      setEditing(null)
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan perubahan')
    } finally {
      setIsSaving(false)
    }
  }

  // Force light mode aesthetically to match map panel overlays
  const inputCls = 'border p-1 text-[10px] rounded text-gray-900 bg-white border-gray-300 shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-0'
  const rowText = 'text-gray-800'
  const rowHover = 'hover:bg-gray-50'
  const theadBg = 'bg-gray-100 text-gray-700 font-bold uppercase tracking-wider'

  return (
    <div className={`flex flex-col gap-2 transition-colors duration-300 w-full h-full`}>
      {/* Filters */}
      <div className="flex flex-col gap-1.5 w-full min-w-0 shrink-0">
        <input
          type="text"
          className={`${inputCls} w-full h-[26px]`}
          placeholder="Cari Kota..."
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto mt-2 rounded shadow-sm border border-gray-200 min-w-0 min-h-0 w-full relative custom-scrollbar pb-1 bg-white">
        <table className="w-full text-[7px] leading-tight text-left whitespace-nowrap">
          <thead className={`${theadBg} sticky top-0 z-10 transition-colors duration-300 outline outline-1 outline-gray-200`}>
            <tr>
              <th className="py-0.5 px-0.5 whitespace-nowrap">Kota</th>
              <th className="py-0.5 px-0.5 text-right whitespace-nowrap leading-tight">Sederhana<br/><span className="text-[6px] normal-case font-normal">(Rp)</span></th>
              <th className="py-0.5 px-0.5 text-right whitespace-nowrap leading-tight">Non-Sederhana<br/><span className="text-[6px] normal-case font-normal">(Rp)</span></th>
              <th className="py-0.5 px-0.5 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(r => (
              <tr key={r.id_kota} className={`${rowHover} cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-0`}>
                <td className={`py-0.5 px-0.5 ${rowText} truncate max-w-[80px]`} title={r.kota}>{r.kota}</td>
                <td className={`py-0.5 px-0.5 ${rowText} text-right tabular-nums`}>{Number(r.hsbgn_sederhana).toLocaleString('id-ID')}</td>
                <td className={`py-0.5 px-0.5 ${rowText} text-right tabular-nums`}>{Number(r.hsbgn_tidaksederhana).toLocaleString('id-ID')}</td>
                <td className={`py-0.5 px-0.5 ${rowText} text-center`}>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEditClick(r)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Edit HSBGN"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} forceLightMode>
        <h3 className="text-sm font-bold mb-3 text-gray-800 border-b pb-2">Edit HSBGN</h3>
        <form onSubmit={e => { e.preventDefault(); onSave() }} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 mb-1 block">Kota</label>
            <input
              type="text"
              className="border p-2 w-full rounded-md text-xs bg-gray-50 text-gray-500 cursor-not-allowed"
              value={editing?.kota || ''}
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 mb-1 block">HSBGN Sederhana (Rp)</label>
              <input
                type="number"
                className="border p-2 w-full rounded-md text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                value={hsbgnSederhana}
                onChange={e => setHsbgnSederhana(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 mb-1 block">HSBGN Tidak Sederhana (Rp)</label>
              <input
                type="number"
                className="border p-2 w-full rounded-md text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                value={hsbgnTidakSederhana}
                onChange={e => setHsbgnTidakSederhana(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving && (
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {isSaving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} forceLightMode>
        <div className="text-center p-2">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-base font-bold mb-1">Berhasil!</h3>
          <p className={`text-xs ${rowText}`}>{successMsg}</p>
          <div className="mt-4">
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-1.5 rounded-md text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

