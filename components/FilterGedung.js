// components/FilterGedung.js
import { useTheme } from '../context/ThemeContext';

export default function FilterGedung({ provGedung, setProvGedung, kotaGedung, setKotaGedung, types, setTypes }) {
  const { darkMode } = useTheme();
  return (
    <div className={`relative flex flex-col md:flex-row items-center justify-center gap-2 border rounded-xl shadow p-2 mt-2 mx-auto w-fit transition-colors duration-300 ${
      darkMode ? 'bg-gray-900/90 border-gray-800 shadow-black/20' : 'bg-white/90 border-gray-200'
    }`}>
      <select
        className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 transition w-56 appearance-none ${
          darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-700 focus:ring-[#2F6FAF]'
        }`}
        value={provGedung}
        onChange={e => { setProvGedung(e.target.value); setKotaGedung('') }}
      >
        <option value="">— Pilih Provinsi —</option>
        {/* List provinsi via props or global fetch */}
      </select>
      <select
        className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 transition w-56 appearance-none ${
          darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-700 focus:ring-[#2F6FAF]'
        }`}
        disabled={!provGedung}
        value={kotaGedung}
        onChange={e => setKotaGedung(e.target.value)}
      >
        <option value="">— Pilih Kota —</option>
        {/* List kota via fetch */}
      </select>
      <div className="flex gap-2">
        {[
          { key: 'FS', label: 'Fasilitas Kesehatan' },
          { key: 'FD', label: 'Fasilitas Pendidikan' }
        ].map(type => (
          <label key={type.key} className={`flex items-center gap-1 text-sm font-medium transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={types[type.key]}
              onChange={() => setTypes(prev => ({ ...prev, [type.key]: !prev[type.key] }))}
              className="accent-[#1E5C9A]"
            /> {type.label}
          </label>
        ))}
      </div>
    </div>
  )
}
  