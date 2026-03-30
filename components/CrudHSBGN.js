// components/CrudHSBGN.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from '../context/ThemeContext'
import Modal from './ui/Modal'
import { 
  Database, Search, Edit2, Save, X, 
  ChevronRight, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react'
import {
  getHSBGN,
  updateHSBGN,
  recalcHSBGN
} from '../src/lib/api'

const ModernSectionTitle = ({ children, icon: Icon }) => {
  const { darkMode } = useTheme();
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
        {Icon && <Icon size={18} strokeWidth={2.5} />}
      </div>
      <h3 className={`text-sm font-black tracking-tight uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        {children}
      </h3>
    </div>
  );
};

export default function CrudHSBGN({ onDataChanged }) {
  const router = useRouter()
  const { darkMode } = useTheme()
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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className={`p-4 rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
          <AlertCircle size={32} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
        </div>
        <div>
          <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Fitur ini memerlukan login</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Silakan masuk ke akun Anda untuk mengelola data HSBGN.</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          Masuk Sekarang
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

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Redundant header removed */}

      {/* Filters */}
      <div className="relative group px-1">
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={11} />
        <input
          type="text"
          className={`w-full h-8 pl-9 pr-4 rounded-xl border transition-all duration-300 text-[9px] font-medium outline-none ${
            darkMode 
              ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50' 
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 shadow-sm'
          }`}
          placeholder="Cari Kota..."
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
        />
      </div>

      {/* Table Container */}
      <div className={`flex-1 overflow-hidden rounded-2xl border ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm'} flex flex-col min-h-0`}>
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 z-20 backdrop-blur-md ${darkMode ? 'bg-[#0D0F12]/80 border-b border-white/5' : 'bg-slate-50/90 border-b border-slate-200'}`}>
              <tr className={`${darkMode ? 'bg-white/[0.03]' : 'bg-slate-50'} border-b ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <th className="py-1.5 px-4 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Kota</th>
                <th className="py-1.5 px-4 text-center text-[9px] font-black text-gray-500 uppercase tracking-widest">Sederhana <span className="lowercase font-medium opacity-60">(Rp)</span></th>
                <th className="py-1.5 px-4 text-center text-[9px] font-black text-gray-500 uppercase tracking-widest">Non-Sederhana <span className="lowercase font-medium opacity-60">(Rp)</span></th>
                <th className="py-1.5 px-4 text-center text-[9px] font-black text-gray-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredRows.map(r => (
                <tr key={r.id_kota} className={`border-b ${darkMode ? 'border-white/5 hover:bg-white/[0.04]' : 'border-slate-50 hover:bg-slate-50/80'} transition-all duration-300 group`}>
                  <td className="py-1.5 px-4">
                    <div className={`text-[10px] font-black uppercase tracking-tight ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-slate-700'}`}>{r.kota}</div>
                  </td>
                  <td className="py-1.5 px-4 text-right">
                    <div className={`text-[10px] font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      {Number(r.hsbgn_sederhana).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="py-1.5 px-4 text-right">
                    <div className={`text-[10px] font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {Number(r.hsbgn_tidaksederhana).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="py-1.5 px-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => onEditClick(r)}
                        className={`p-1 rounded-lg transition-all duration-200 ${
                          darkMode 
                            ? 'text-gray-500 hover:text-white hover:bg-white/10' 
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Edit HSBGN"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} maxWidth="max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Edit2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Edit Data HSBGN
            </h3>
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Kota: <span className="text-blue-500">{editing?.kota}</span>
            </p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave() }} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                HSBGN Sederhana (Rp)
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Rp</div>
                <input
                  type="number"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border transition-all duration-300 text-sm font-mono outline-none ${
                    darkMode 
                      ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                  }`}
                  value={hsbgnSederhana}
                  onChange={e => setHsbgnSederhana(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                HSBGN Tidak Sederhana (Rp)
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Rp</div>
                <input
                  type="number"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border transition-all duration-300 text-sm font-mono outline-none ${
                    darkMode 
                      ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-blue-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                  }`}
                  value={hsbgnTidakSederhana}
                  onChange={e => setHsbgnTidakSederhana(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={`flex-1 h-11 rounded-xl text-xs font-bold transition-all ${
                darkMode 
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-[2] h-11 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 transition-transform animate-in zoom-in-50 duration-500">
            <CheckCircle2 size={32} strokeWidth={2.5} />
          </div>
          <h3 className={`text-xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Berhasil Diperbarui
          </h3>
          <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {successMsg}
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full h-12 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            Selesai
            <ChevronRight size={18} />
          </button>
        </div>
      </Modal>
    </div>
  )
}

