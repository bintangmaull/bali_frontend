// components/AdminProcessManager.js
import { useState } from 'react'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { useTheme } from '../context/ThemeContext'
import {
  processCurveGempa,
  processCurveTsunami,
  processCurveBanjir,
  recalcAll
} from '../src/lib/api'

export default function AdminProcessManager() {
  const { darkMode } = useTheme()
  const [loading, setLoading] = useState(null) // 'gempa', 'tsunami', 'banjir', 'global'
  const [confirmModal, setConfirmModal] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const processes = [
    { key: 'gempa', label: 'Proses Kurva Gempa', action: processCurveGempa, description: 'Menghitung ulang rasio kerusakan untuk data intensitas gempa.' },
    { key: 'tsunami', label: 'Proses Kurva Tsunami', action: processCurveTsunami, description: 'Menghitung ulang rasio kerusakan untuk data inundansi tsunami.' },
    { key: 'banjir', label: 'Proses Kurva Banjir (All)', action: processCurveBanjir, description: 'Menghitung ulang rasio kerusakan untuk data banjir (R & RC). Proses ini memakan waktu lama (~800k baris).' },
    { key: 'global', label: 'Rekalkulasi AAL Global', action: recalcAll, description: 'Memicu penghitungan ulang AAL dan Direct Loss untuk seluruh data bangunan di database.' }
  ]

  async function handleExecute(proc) {
    setLoading(proc.key)
    setConfirmModal(null)
    try {
      const res = await proc.action()
      setSuccessMsg(`Berhasil: ${res?.message || res?.status || 'Proses selesai'}`)
    } catch (err) {
      console.error(err)
      alert(`Gagal menjalankan proses ${proc.label}`)
    } finally {
      setLoading(null)
    }
  }

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
  const textCls = darkMode ? 'text-gray-300' : 'text-gray-600'
  const headCls = darkMode ? 'text-white' : 'text-gray-900'

  return (
    <div className={`${cardBg} p-6 rounded-xl shadow-sm space-y-6 transition-colors duration-300`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processes.map((proc) => (
          <div key={proc.key} className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'} flex flex-col justify-between`}>
            <div>
              <h3 className={`font-bold ${headCls}`}>{proc.label}</h3>
              <p className={`text-xs mt-1 ${textCls}`}>{proc.description}</p>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => setConfirmModal(proc)}
                disabled={!!loading}
                className={`w-full text-sm ${loading === proc.key ? 'opacity-50' : ''}`}
              >
                {loading === proc.key ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Memproses...
                  </span>
                ) : 'Jalankan Proses'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}>
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2">Konfirmasi Eksekusi</h3>
          <p className={textCls}>Apakah Anda yakin ingin menjalankan <strong>{confirmModal?.label}</strong>?</p>
          {confirmModal?.key === 'banjir' && (
            <p className="mt-2 text-[#2F6FAF] text-sm font-semibold italic">
              ⚠️ Peringatan: Proses ini dapat memakan waktu beberapa menit karena volume data yang besar.
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setConfirmModal(null)} className="bg-gray-400">Batal</Button>
            <Button onClick={() => handleExecute(confirmModal)} className="bg-[#2F6FAF] text-white">Ya, Jalankan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!successMsg} onClose={() => setSuccessMsg('')}>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">Selesai</h3>
          <p className={textCls}>{successMsg}</p>
          <Button onClick={() => setSuccessMsg('')} className="mt-6 bg-green-600 text-white px-8">Tutup</Button>
        </div>
      </Modal>
    </div>
  )
}
