// pages/admin.js
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { CheckCircle, XCircle, Trash2, RefreshCw, Users, Activity, LogOut } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'cardinaladmin2024'

const adminHeaders = {
  'Content-Type': 'application/json',
  'X-Admin-Secret': ADMIN_SECRET,
}

// Narasi aksi dalam Bahasa Indonesia
function generateNarasi(log) {
  const user = log.user_nama
  const action = log.action
  const target = log.target
  const id = log.target_id || '-'
  const detail = log.detail || ''

  if (action === 'tambah') return `User ${user} menambahkan data ${target} id ${id}. ${detail}`
  if (action === 'edit') return `User ${user} mengedit data ${target} id ${id}. ${detail}`
  if (action === 'hapus') return `User ${user} menghapus data ${target} id ${id}. ${detail}`
  if (action === 'upload_csv') return `User ${user} melakukan upload CSV ${target}. ${detail}`
  return `User ${user} melakukan ${action} pada ${target} id ${id}.`
}

const STATUS_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  approved: 'bg-green-500/20 text-green-300 border border-green-500/40',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/40',
}

export default function AdminPage() {
  const router = useRouter()
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [logFilter, setLogFilter] = useState('')

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (username === 'adminAAL' && password === '@ItB1920aal') {
      setIsLoggedIn(true)
      setLoginError('')
    } else {
      setLoginError('Username atau password salah.')
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = useCallback(async () => {
    if (!isLoggedIn) return
    setLoadingUsers(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: adminHeaders })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      showToast('Gagal memuat data pengguna.', 'error')
    } finally {
      setLoadingUsers(false)
    }
  }, [isLoggedIn])

  const fetchLogs = useCallback(async () => {
    if (!isLoggedIn) return
    setLoadingLogs(true)
    try {
      const url = logFilter
        ? `${API_BASE}/api/admin/logs?target=${logFilter}`
        : `${API_BASE}/api/admin/logs`
      const res = await fetch(url, { headers: adminHeaders })
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      showToast('Gagal memuat activity log.', 'error')
    } finally {
      setLoadingLogs(false)
    }
  }, [logFilter, isLoggedIn])

  useEffect(() => { if (isLoggedIn) fetchUsers() }, [fetchUsers, isLoggedIn])
  useEffect(() => { if (isLoggedIn) fetchLogs() }, [fetchLogs, isLoggedIn])

  const handleApprove = async (userId) => {
    setActionLoading(userId + '-approve')
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, {
        method: 'POST', headers: adminHeaders,
      })
      const data = await res.json()
      if (res.ok) { showToast(data.msg); fetchUsers() }
      else showToast(data.msg || 'Gagal', 'error')
    } catch { showToast('Gagal.', 'error') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (userId) => {
    setActionLoading(userId + '-reject')
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reject`, {
        method: 'POST', headers: adminHeaders,
      })
      const data = await res.json()
      if (res.ok) { showToast(data.msg); fetchUsers() }
      else showToast(data.msg || 'Gagal', 'error')
    } catch { showToast('Gagal.', 'error') }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (userId, email) => {
    if (!confirm(`Hapus akun ${email}?`)) return
    setActionLoading(userId + '-delete')
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE', headers: adminHeaders,
      })
      const data = await res.json()
      if (res.ok) { showToast(data.msg); fetchUsers() }
      else showToast(data.msg || 'Gagal', 'error')
    } catch { showToast('Gagal.', 'error') }
    finally { setActionLoading(null) }
  }

  const tabCls = (t) =>
    `px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t
      ? 'bg-[#1E5C9A] text-white'
      : 'text-gray-400 hover:text-white hover:bg-white/10'}`

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0F12]">
        <div className="w-full max-w-sm p-8 bg-[#1E2023] border border-gray-700 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1E5C9A]">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Masukkan kredensial khusus developer.</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#2a2d31] border border-gray-600 text-white rounded-xl focus:border-[#1E5C9A] outline-none transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#2a2d31] border border-gray-600 text-white rounded-xl focus:border-[#1E5C9A] outline-none transition text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1E5C9A] text-white font-semibold text-sm hover:bg-[#2F6FAF] active:scale-95 transition-all mt-6"
            >
              Masuk
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-white transition">
              Kembali ke Aplikasi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white">
      {/* Header */}
      <div className="bg-[#1E2023] border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1E5C9A]">Bali Multi-Hazard Risk Dashboard — Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-0.5">Developer-only area</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:bg-white/10 transition"
        >
          <LogOut size={16} /> Kembali ke Aplikasi
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === 'error' ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-green-500/20 border border-green-500/40 text-green-300'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
          <button onClick={() => setTab('users')} className={tabCls('users')}>
            <span className="flex items-center gap-2"><Users size={15} /> Manajemen User</span>
          </button>
          <button onClick={() => setTab('logs')} className={tabCls('logs')}>
            <span className="flex items-center gap-2"><Activity size={15} /> Activity Log</span>
          </button>
        </div>

        {/* ─── Tab: Manajemen User ─── */}
        {tab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
              <button onClick={fetchUsers} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition">
                <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-gray-500">Memuat data...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Belum ada pengguna terdaftar.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-gray-400">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Nama</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Tanggal Daftar</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-center px-4 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-700/50 hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-medium">{u.nama}</td>
                        <td className="px-4 py-3 text-gray-300">{u.email}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[u.status] || ''}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(u.id)}
                                disabled={!!actionLoading}
                                title="Setujui"
                                className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/20 transition disabled:opacity-40"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => handleReject(u.id)}
                                disabled={!!actionLoading}
                                title="Tolak"
                                className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition disabled:opacity-40"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(u.id, u.email)}
                              disabled={!!actionLoading}
                              title="Hapus"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Activity Log ─── */}
        {tab === 'logs' && (
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-semibold">Activity Log</h2>
              <div className="flex items-center gap-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-[#1E2023] border border-gray-600 text-gray-300 text-sm px-3 py-1.5 rounded-lg outline-none"
                >
                  <option value="">Semua</option>
                  <option value="bangunan">Bangunan</option>
                  <option value="hsbgn">HSBGN</option>
                </select>
                <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition">
                  <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {loadingLogs ? (
              <div className="text-center py-12 text-gray-500">Memuat log...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Belum ada activity log.</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="bg-[#1E2023] rounded-xl border border-gray-700/50 px-5 py-3.5 hover:border-gray-600 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 leading-relaxed">{generateNarasi(log)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${log.action === 'tambah' ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : log.action === 'hapus' ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : log.action === 'upload_csv' ? 'bg-[#2F6FAF]/20 text-[#1E5C9A] border-[#2F6FAF]/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
