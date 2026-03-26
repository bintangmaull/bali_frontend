import React, { useState, useMemo } from 'react';
import { X, Search, Layers } from 'lucide-react';

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
    { id: 'healthcare', label: 'Healthcare FS' },
    { id: 'educational', label: 'Educational FD' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'airport', label: 'Airport' },
    { id: 'hotel', label: 'Hotel' }
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
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-gray-100 flex flex-col gap-2 bg-white sticky top-0 z-[20]">
        
        {/* Context Title */}
        <div className="text-[10px] font-extrabold text-slate-700 tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Layers size={12} className="text-blue-500" />
          <span>DATA DIRECT LOSS - {tabs.find(t => t.id === activeTab)?.label} - {selectedCityFeature?.properties?.id_kota || selectedCityFeature?.properties?.kota || 'Semua Kota'}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto w-full pb-1 custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onTabChange) onTabChange(tab.id);
              }}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
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
            className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-[10px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-gray-50 focus:bg-white"
            placeholder="Cari ID / Nama Gedung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-gray-50/30 p-2 custom-scrollbar relative">
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <Search size={24} className="mb-2 opacity-20" />
            <p className="text-[10px] font-medium">Data tidak ditemukan.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative z-[10] w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-2 font-semibold text-gray-600 whitespace-nowrap sticky left-0 bg-gray-50 z-20 min-w-[90px] border-r border-gray-200">ID Bgn</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 sticky left-[90px] bg-gray-50 z-20 min-w-[140px] border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate text-left">Nama Gedung</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 whitespace-nowrap pl-4">Kota</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 text-right whitespace-nowrap">Nilai Aset</th>
                    {columns.map(col => (
                      <th key={col.key} className="px-2 py-2 font-bold text-blue-800 text-right whitespace-nowrap border-l border-blue-50 bg-blue-50/50">
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
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          onClick={() => onRowClick && onRowClick(row)}
                        >
                          <td className="px-2 py-2 font-mono text-[9px] text-gray-500 sticky left-0 group-hover:bg-slate-50 bg-white z-10 min-w-[90px] border-r border-gray-100 truncate">{row.id_bangunan || '-'}</td>
                          <td className="px-2 py-2 font-medium text-gray-800 sticky left-[90px] group-hover:bg-slate-50 bg-white z-10 min-w-[140px] truncate border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-left" title={row.nama_gedung}>{row.nama_gedung || '-'}</td>
                          <td className="px-2 py-2 text-gray-600 text-[9px] pl-4 whitespace-nowrap">{row.kota || '-'}</td>
                          <td className="px-2 py-2 text-right font-semibold text-emerald-700 whitespace-nowrap">{assetValue > 0 ? formatRupiah(assetValue) : '-'}</td>
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
                                const catData = dlExp[activeTab] || {};
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
                              <td key={col.key} className="px-2 py-2 text-right text-gray-700 border-l border-blue-50 font-medium whitespace-nowrap">
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
          <div className="px-3 py-2 border-t border-gray-100 bg-white flex justify-between items-center text-[10px] sticky bottom-0 z-[20]">
            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors font-medium"
              >
                Prev
              </button>
              <div className="font-semibold text-gray-700">
                {currentPage} / {totalPages}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors font-medium"
              >
                Next
              </button>
            </div>
            <div className="text-gray-400 font-medium">
              Tot: <span className="text-gray-700">{filteredData.length}</span>
            </div>
          </div>
        )}
      </div>
  );
}
