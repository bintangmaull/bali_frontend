// components/FilterDirectLoss.js
import React, { useMemo } from 'react'
import Select from './ui/Select';
import { useTheme } from '../context/ThemeContext';

export default function FilterDirectLoss({
  provList,
  kotaList,
  selectedProv,
  setSelectedProv,
  selectedKota,
  setSelectedKota,
  filters,
  setFilters,
  search,
  setSearch,
  geojson
}) {
  const { darkMode } = useTheme();

  // Generate suggestions based on current filters and search term
  const suggestions = useMemo(() => {
    if (!selectedKota || !search) return [];
    const lower = search.toLowerCase();
    return (
      geojson.features
        .filter((f) => {
          const p = f.properties;
          const type = (p.id_bangunan || '').split('_')[0];
          if (!filters[type]) return false;
          if (p.kota !== selectedKota) return false;
          return p.nama_gedung.toLowerCase().includes(lower);
        })
        .map((f) => f.properties.nama_gedung)
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter((v) => v.toLowerCase() !== lower)
        .slice(0, 20)
    );
  }, [geojson, selectedKota, filters, search]);

  // Classes berdasarkan mode
  const inputCls = darkMode
    ? 'bg-[#2a2d31] border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';
  const dropdownBg = darkMode ? 'bg-[#2a2d31] border-gray-600' : 'bg-white border-gray-200';
  const dropdownItem = darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100';

  return (
    <div className="flex flex-col gap-2 overflow-visible">
      {/* Row 1: Pilih Kota + Filter Tipe Bangunan */}
      <div className="flex flex-row flex-nowrap overflow-x-auto gap-2 items-center py-1 scrollbar-hide">
        <Select
          id="kotaSelect"
          value={selectedKota}
          onChange={setSelectedKota}
          options={kotaList}
          placeholder="Kota"
          className="w-32 min-w-[120px] text-xs !px-2 !py-1"
        />
        {[
          { key: 'BMN', label: 'BMN', full: 'Bangunan Milik Negara' },
          { key: 'FS', label: 'Faskes', full: 'Fasilitas Kesehatan' },
          { key: 'FD', label: 'Fasdik', full: 'Fasilitas Pendidikan' }
        ].map((type) => (
          <label
            key={type.key}
            title={type.full}
            className="flex items-center gap-1.5 text-black px-2 py-1 bg-[#C084FC] rounded-full hover:bg-cyan-700 hover:text-black cursor-pointer whitespace-nowrap"
          >
            <input
              type="checkbox"
              checked={filters[type.key]}
              onChange={() => setFilters((f) => ({ ...f, [type.key]: !f[type.key] }))}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs text-gray-800">{type.label}</span>
          </label>
        ))}
      </div>

      {/* Row 2: Cari + Unduh */}
      <div className="relative">
        <div className="flex flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Cari nama gedung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 p-1.5 text-xs border rounded focus:ring-2 transition-colors duration-300 ${inputCls}`}
            disabled={!selectedKota}
          />
          <button
            type="button"
            className="px-2.5 py-1.5 bg-[#22D3EE] text-black text-xs rounded hover:bg-[#3B82F6] hover:text-white whitespace-nowrap transition shadow-sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedProv) params.append('provinsi', selectedProv);
              if (selectedKota) params.append('kota', selectedKota);
              params.append('bmn', filters.BMN);
              params.append('fs', filters.FS);
              params.append('fd', filters.FD);
              if (search) params.append('search', search);
              window.open(`/api/gedung/download?${params.toString()}`, '_blank');
            }}
          >
            Unduh Data
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul className={`absolute top-full left-0 z-[9999] w-full max-h-48 overflow-y-auto border rounded-lg mt-1 font-[SF Pro] text-sm shadow-lg ${dropdownBg}`}>
            {suggestions.map((name) => (
              <li
                key={name}
                onClick={() => setSearch(name)}
                className={`px-4 py-2 cursor-pointer font-[SF Pro] ${dropdownItem}`}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
