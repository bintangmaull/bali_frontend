// components/CrudHSBGN.js
import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { useTheme } from '../context/ThemeContext'
import {
  getHSBGN,
  updateHSBGN,
  recalcHSBGN
} from '../src/lib/api'

export default function CrudHSBGN() {
  const { darkMode } = useTheme()
  const [rows, setRows] = useState([])
  const [searchCity, setSearchCity] = useState('')
  const [editing, setEditing] = useState(null)
  const [hsbgnSederhana, setHsbgnSederhana] = useState('')
  const [hsbgnTidakSederhana, setHsbgnTidakSederhana] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    reloadTable()
  }, [])

  function reloadTable() {
    getHSBGN().then(setRows).catch(console.error)
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
      setEditing(null)
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan perubahan')
    } finally {
      setIsSaving(false)
    }
  }

  // Classes berdasarkan mode
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
  const inputCls = darkMode
    ? 'p-2 rounded-lg text-white border-gray-600 bg-gray-700'
    : 'p-2 rounded-lg text-gray-900 border-gray-300 bg-gray-50 border'
  const rowText = darkMode ? 'text-white' : 'text-gray-800'
  const rowHover = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  const borderCls = darkMode ? 'border-gray-700' : 'border-gray-200'

  return (
    <div className={`${cardBg} p-3 rounded-lg shadow flex flex-col gap-4 transition-colors duration-300`}>
      {/* Filters */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className={inputCls}
          placeholder="Cari Kota..."
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm mt-2">
          <thead className="bg-[#0a2c68] text-white rounded-lg">
            <tr>
              <th className="p-2 text-justify">Kota</th>
              <th className="p-2 text-center whitespace-nowrap">HSBGN Sederhana</th>
              <th className="p-2 text-center whitespace-nowrap">HSBGN Tidak Sederhana</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(r => (
              <tr key={r.id_kota} className={`border-t ${borderCls} ${rowHover} transition-colors duration-150`}>
                <td className={`p-2 ${rowText}`}>{r.kota}</td>
                <td className={`p-2 ${rowText} text-center`}>Rp {Number(r.hsbgn_sederhana).toLocaleString('id-ID')}</td>
                <td className={`p-2 ${rowText} text-center`}>Rp {Number(r.hsbgn_tidaksederhana).toLocaleString('id-ID')}</td>
                <td className={`p-2 ${rowText} text-right`}>
                  <Button
                    onClick={() => onEditClick(r)}
                    className="text-blue-600 hover:underline p-0"
                  >
                    ✏️ Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)}>
        <h3 className="text-lg font-bold mb-4">Edit HSBGN</h3>
        <form onSubmit={e => { e.preventDefault(); onSave() }} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold">Kota</label>
            <input
              type="text"
              className="border p-2 w-full rounded-lg"
              value={editing?.kota || ''}
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">HSBGN Sederhana (Rp)</label>
              <input
                type="number"
                className="border p-2 w-full rounded-lg"
                value={hsbgnSederhana}
                onChange={e => setHsbgnSederhana(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold">HSBGN Tidak Sederhana (Rp)</label>
              <input
                type="number"
                className="border p-2 w-full rounded-lg"
                value={hsbgnTidakSederhana}
                onChange={e => setHsbgnTidakSederhana(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              type="button"
              onClick={() => setEditing(null)}
              className="bg-gray-400 hover:bg-gray-500 text-white"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className={`bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)}>
        <div className="text-center p-4">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">Berhasil!</h3>
          <p className={rowText}>{successMsg}</p>
          <div className="mt-6">
            <Button
              onClick={() => setShowSuccess(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

