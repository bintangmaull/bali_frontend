// pages/register.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTheme } from '../context/ThemeContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function Register() {
  const router = useRouter()
  const { darkMode } = useTheme()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password }),
      })
      const data = await res.json()

      if (res.ok || res.status === 201) {
        setSuccessMsg(data.msg || 'Pendaftaran berhasil. Akun Anda sedang menunggu persetujuan admin.')
        setNama('')
        setEmail('')
        setPassword('')
      } else {
        setErrorMsg(data.msg || 'Terjadi kesalahan saat mendaftar.')
      }
    } catch {
      setErrorMsg('Gagal menghubungi server. Pastikan backend berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const bg = darkMode ? 'bg-[#0D0F12]' : 'bg-gray-100'
  const card = darkMode ? 'bg-[#1E2023] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
  const inputCls = darkMode
    ? 'bg-[#2a2d31] border-gray-600 text-white placeholder-gray-400 focus:border-[#1E5C9A]'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#1E5C9A]'
  const labelCls = darkMode ? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={`min-h-screen flex items-center justify-center ${bg} transition-colors duration-300`}>
      <div className={`w-full max-w-md mx-4 rounded-2xl border shadow-xl p-8 ${card}`}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1E5C9A] tracking-tight uppercase">CATALYST</h1>
          <p className={`text-[10px] font-semibold text-blue-500 uppercase tracking-[0.2em] mb-2`}>Catastrophic Average Annual Loss Analyst</p>
          <p className={`mt-1 text-sm ${labelCls}`}>Buat akun untuk mengajukan akses Manajemen Data</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
              <p className="font-semibold text-base mb-1">✅ Pendaftaran Berhasil!</p>
              <p>{successMsg}</p>
            </div>
            <p className={`text-center text-sm mt-2 ${labelCls}`}>
              Admin akan meninjau dan menyetujui akun Anda. Setelah disetujui, Anda bisa{' '}
              <Link href="/login" className="text-[#1E5C9A] hover:underline font-medium">
                masuk di sini
              </Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Nama Lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1E5C9A] text-white font-semibold text-sm hover:bg-[#2F6FAF] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
            </button>
          </form>
        )}

        <p className={`mt-6 text-center text-sm ${labelCls}`}>
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#1E5C9A] hover:underline font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
