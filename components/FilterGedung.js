// components/FilterGedung.js
export default function FilterGedung({ provGedung, setProvGedung, kotaGedung, setKotaGedung, types, setTypes }) {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center gap-2 bg-white/90 border border-gray-200 rounded-xl shadow p-2 mt-2 mx-auto w-fit">
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F6FAF] transition w-56"
        value={provGedung}
        onChange={e => { setProvGedung(e.target.value); setKotaGedung('') }}
      >
        <option value="">— Pilih Provinsi —</option>
        {/* List provinsi via props or global fetch */}
      </select>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F6FAF] transition w-56"
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
          <label key={type.key} className="flex items-center gap-1 text-sm font-medium text-gray-700">
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
  