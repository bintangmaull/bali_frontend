import React, { useState, useMemo } from 'react';
import { X, Search, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const formatRupiah = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

// Pagination helper
const itemsPerPage = 50;

export default function ExposureTableContent({
  exposureData,
  selectedGroup,
  selectedCityFeature,
  cityGeojson,
  initialTab = 'healthcare',
  onRowClick,
  onTabChange
}) {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Reset pagination when tab or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const tabs = [
    { id: 'healthcare', label: 'Healthcare Facilities' },
    { id: 'educational', label: 'Educational Facilities' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'airport', label: 'Airport' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'bmn', label: 'BMN' },
    { id: 'residential', label: 'Residential' }
  ];

  // Derived columns based on selectedGroup
  const columns = useMemo(() => {
    if (selectedGroup === 'banjir') {
      return [
        { key: 'direct_loss_r_2', label: 'R 2' },
        { key: 'direct_loss_r_5', label: 'R 5' },
        { key: 'direct_loss_r_10', label: 'R 10' },
        { key: 'direct_loss_r_25', label: 'R 25' },
        { key: 'direct_loss_r_50', label: 'R 50' },
        { key: 'direct_loss_r_100', label: 'R 100' },
        { key: 'direct_loss_r_250', label: 'R 250' },
        { key: 'direct_loss_rc_2', label: 'RC 2' },
        { key: 'direct_loss_rc_5', label: 'RC 5' },
        { key: 'direct_loss_rc_10', label: 'RC 10' },
        { key: 'direct_loss_rc_25', label: 'RC 25' },
        { key: 'direct_loss_rc_50', label: 'RC 50' },
        { key: 'direct_loss_rc_100', label: 'RC 100' },
        { key: 'direct_loss_rc_250', label: 'RC 250' }
      ];
    } else if (selectedGroup === 'earthquake') {
      return [
        { key: 'pga_100', label: 'Ratio 100th' },
        { key: 'pga_200', label: 'Ratio 200th' },
        { key: 'pga_250', label: 'Ratio 250th' },
        { key: 'pga_500', label: 'Ratio 500th' },
        { key: 'pga_1000', label: 'Ratio 1000th' }
      ];
    }
 else if (selectedGroup === 'tsunami') {
      return [
        { key: 'direct_loss_inundansi', label: 'Inundansi' }
      ];
    }
    return [];
  }, [selectedGroup]);

  // Filter and format data
  const filteredData = useMemo(() => {
    if (!exposureData?.features) return [];

    return exposureData.features
      .map(f => f.properties)
      .filter(p => {
        // 1. Filter by City map selection
        if (selectedCityFeature && p.kota !== selectedCityFeature.properties.id_kota) {
          return false;
        }

        // 2. Filter by Active Tab
        const id = (p.id_bangunan || '').toUpperCase();
        let matchesTab = false;
        if (activeTab === 'healthcare' && id.startsWith('FS')) matchesTab = true;
        if (activeTab === 'educational' && id.startsWith('FD')) matchesTab = true;
        if (activeTab === 'electricity' && id.startsWith('ELECTRICITY')) matchesTab = true;
        if (activeTab === 'airport' && id.startsWith('AIRPORT')) matchesTab = true;
        if (activeTab === 'hotel' && id.startsWith('HOTEL')) matchesTab = true;
        if (activeTab === 'bmn' && id.startsWith('BMN')) matchesTab = true;
        if (activeTab === 'residential' && (id.startsWith('RESIDENTIAL') || id.startsWith('RES'))) matchesTab = true;
        if (!matchesTab) return false;

        // 3. Filter by Search Term
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const name = (p.nama_gedung || '').toLowerCase();
          const bId = (p.id_bangunan || '').toLowerCase();
          if (!name.includes(s) && !bId.includes(s)) return false;
        }

        return true;
      });
  }, [exposureData, selectedCityFeature, activeTab, searchTerm]);  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!selectedGroup) return <div className="p-4 text-center text-gray-500 text-xs font-medium">Pilih hazard terlebih dahulu</div>;

  return (
    <div className={`flex flex-col h-full w-full relative transition-colors duration-300 ${darkMode ? 'bg-[#1E2023] text-gray-200' : 'bg-white text-gray-800'}`}>
      {/* Toolbar */}
      <div className={`px-2 md:px-3 py-1.5 md:py-2 border-b flex flex-col gap-1.5 md:gap-2 sticky top-0 z-[20] transition-colors duration-300 ${
        darkMode ? 'bg-[#1E2023] border-gray-800' : 'bg-white border-gray-100'
      }`}>
        
        {/* Redundant header removed, replaced with smaller context sub-indicator if needed */}
        <div className={`text-[8px] md:text-[9px] font-bold tracking-wider uppercase mb-0.5 flex items-center gap-1 opacity-60 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
          <span>{selectedCityFeature?.properties?.id_kota || selectedCityFeature?.properties?.kota || 'Semua Kota'}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 md:gap-1.5 overflow-x-auto w-full pb-1 custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onTabChange) onTabChange(tab.id);
              }}
              className={`px-1.5 md:px-2 py-0.5 text-[7px] md:text-[8px] font-bold rounded-md transition-all whitespace-nowrap border ${
                activeTab === tab.id 
                  ? darkMode 
                    ? 'bg-blue-900/40 text-blue-300 border-blue-800 shadow-sm' 
                    : 'bg-blue-50 text-[#1E5C9A] border-blue-200 shadow-sm'
                  : darkMode
                    ? 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search size={12} className="text-gray-400" />
          </div>
          <input
            type="text"
            className={`block w-full pl-8 pr-3 py-1 border rounded-md text-[8px] placeholder-gray-400 focus:outline-none transition-all ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2F6FAF] focus:ring-1 focus:ring-[#2F6FAF]'
            }`}
            placeholder="Search ID/Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className={`flex-1 overflow-auto p-2 custom-scrollbar relative transition-colors duration-300 ${darkMode ? 'bg-gray-950/20' : 'bg-gray-50/30'}`}>
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <Search size={24} className="mb-2 opacity-20" />
            <p className="text-[10px] font-medium">Data tidak ditemukan.</p>
          </div>
        ) : (
          <div className={`rounded-lg shadow-sm border overflow-hidden relative z-[10] w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className={`border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <th className={`px-1.5 py-1.5 font-bold whitespace-nowrap sticky left-0 z-20 min-w-[50px] md:min-w-[70px] border-r transition-colors duration-300 ${
                      darkMode ? 'bg-[#1E2023] text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`} style={{ fontSize: '8px' }}>ID Bgn</th>
                    <th className={`px-1.5 py-1.5 font-bold sticky left-[50px] md:left-[70px] z-20 min-w-[90px] md:min-w-[120px] border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate text-left transition-colors duration-300 ${
                      darkMode ? 'bg-[#1E2023] text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`} style={{ fontSize: '8px' }}>Nama Gedung</th>
                    <th className={`px-2 py-1.5 font-bold whitespace-nowrap pl-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: '8px' }}>Kota</th>
                    <th className={`px-2 py-1.5 font-bold text-right whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: '8px' }}>Nilai Aset</th>
                    {columns.map(col => (
                      <th key={col.key} className={`px-2 py-1.5 font-black text-right whitespace-nowrap border-l transition-colors duration-300 ${
                        darkMode ? 'text-blue-400 border-blue-900/30 bg-blue-950/20' : 'text-blue-800 border-blue-50 bg-blue-50/50'
                      }`} style={{ fontSize: '8px' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentData.map((row, idx) => {
                      const assetValue = (parseFloat(row.luas) || 0) * (parseFloat(row.hsbgn) || 0);
                      
                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors group cursor-pointer border-b ${
                            darkMode ? 'hover:bg-white/5 border-gray-800/50' : 'hover:bg-slate-50 border-gray-100'
                          }`}
                          onClick={() => onRowClick && onRowClick(row)}
                        >
                          <td className={`px-1.5 py-1.5 font-mono text-[7px] md:text-[8px] sticky left-0 z-10 min-w-[50px] md:min-w-[70px] border-r truncate transition-colors duration-300 ${
                            darkMode ? 'bg-[#1E2023] text-gray-500 group-hover:bg-gray-800 border-gray-800' : 'bg-white text-gray-500 group-hover:bg-slate-50 border-gray-100'
                          }`}>{row.id_bangunan || '-'}</td>
                          <td className={`px-1.5 py-1.5 font-bold sticky left-[50px] md:left-[70px] z-10 min-w-[90px] md:min-w-[120px] truncate border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-left transition-colors duration-300 ${
                            darkMode ? 'bg-[#1E2023] text-gray-200 group-hover:bg-gray-800 border-gray-800' : 'bg-white text-gray-800 group-hover:bg-slate-50 border-gray-100'
                          }`} title={row.nama_gedung} style={{ fontSize: '9px' }}>{row.nama_gedung || '-'}</td>
                          <td className={`px-2 py-1.5 text-[8px] md:text-[9px] pl-3 whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.kota || '-'}</td>
                          <td className={`px-2 py-1.5 text-right font-black whitespace-nowrap ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} style={{ fontSize: '8px' }}>{assetValue > 0 ? formatRupiah(assetValue) : '-'}</td>
                          {columns.map(col => {
                            let displayVal = '-';
                            
                            if (selectedGroup === 'earthquake') {
                              // Identify which city ratios to use: 
                              // Use selectedCityFeature if provided, else lookup by row.kota
                              let dlExp = selectedCityFeature?.properties?.dl_exposure;
                              
                              if (!dlExp && row.kota && cityGeojson?.features) {
                                const cityRow = cityGeojson.features.find(f => 
                                  (f.properties.nama_kota || f.properties.id_kota || '').toUpperCase() === row.kota.toUpperCase()
                                );
                                dlExp = cityRow?.properties?.dl_exposure;
                              }
                              
                              // Fallback to provincial aggregate if still no city match
                              if (!dlExp && cityGeojson?.provincial_gempa_loss_ratios) {
                                dlExp = cityGeojson.provincial_gempa_loss_ratios;
                              }

                              if (dlExp) {
                                const tabToKey = {
                                  healthcare: 'fs',
                                  educational: 'fd',
                                  electricity: 'electricity',
                                  airport: 'airport',
                                  hotel: 'hotel',
                                  residential: 'residential',
                                  bmn: 'bmn'
                                };
                                const catKey = tabToKey[activeTab] || activeTab;
                                const catData = dlExp[catKey] || {};
                                const rpSuffix = col.key; // e.g. "pga_100"
                                const ratio = catData[rpSuffix];
                                
                                if (ratio != null && ratio !== '') {
                                  displayVal = (parseFloat(ratio) * 100).toFixed(6) + '%';
                                }
                              }
                            } else {
                              const val = row[col.key];
                              displayVal = val && val > 0 ? formatRupiah(val) : '-';
                            }

                            return (
                              <td key={col.key} className={`px-2 py-2 text-right border-l font-medium whitespace-nowrap transition-colors duration-300 ${
                                darkMode ? 'text-gray-300 border-blue-900/30' : 'text-gray-700 border-blue-50'
                              }`}>
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {filteredData.length > 0 && (
          <div className={`px-2.5 py-1.5 md:px-3 md:py-2 border-t flex justify-between items-center text-[9px] md:text-[10px] sticky bottom-0 z-[20] transition-colors duration-300 ${
            darkMode ? 'bg-[#1E2023] border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`px-2 py-1 rounded border transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Prev
              </button>
              <div className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentPage} / {totalPages}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`px-2 py-1 rounded border transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
            <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} font-medium`}>
              Tot: <span className={darkMode ? 'text-blue-400' : 'text-gray-700'}>{filteredData.length}</span>
            </div>
          </div>
        )}
      </div>
  );
}
