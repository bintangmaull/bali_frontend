import React from 'react'

const BuildingInfoPanel = ({ data, darkMode, dlExposure, activeTab, setActiveTab }) => {
  if (!data) return null;
  const p = data;
  const id = (p.id_bangunan || '').toUpperCase()
  const luasVal = parseFloat(p.luas) || 0
  const hsbgnVal = parseFloat(p.hsbgn) || 0
  const assetValue = p.nilai_aset != null ? parseFloat(p.nilai_aset) : (luasVal * hsbgnVal)

  const formatNumberWithUnit = (value) => {
    if (value == null || isNaN(value)) return '0'
    if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T'
    if (value >= 1e9) return (value / 1e9).toFixed(2) + ' M'
    if (value >= 1e6) return (value / 1e6).toFixed(2) + ' jt'
    if (value >= 1e3) return (value / 1e3).toFixed(2) + ' rb'
    return value.toLocaleString('id-ID')
  }

  const formatPercent = (loss, totalVal) => {
    if (!totalVal || totalVal === 0 || !loss) return <span className="opacity-40 font-normal">(0%)</span>
    const pct = (loss / totalVal) * 100
    if (pct < 0.1 && pct > 0) return <span className="opacity-40 font-normal">( &lt; 0.1%)</span>
    if (pct >= 99.9) return <span className="text-rose-500 font-bold">(100%)</span>
    return <span className="opacity-60 font-bold">({pct.toFixed(1)}%)</span>
  }

  const assetStr = assetValue > 0 ? formatNumberWithUnit(assetValue) : '-'
  const isBMNRes = id.startsWith('BMN') || id.startsWith('RESIDENTIAL')

  const tabs = [
    { id: 'eq', label: 'E.Q', color: 'blue' },
    { id: 'flood', label: 'Flood', color: 'emerald' },
    { id: 'tsunami', label: 'Tsunami', color: 'amber' }
  ];

  return (
    <div className="flex flex-col gap-1.5 font-[Inter] text-left p-0">
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-white/10' : 'border-slate-200'} pb-1`}>
        <h3 className={`font-black text-[10.5px] leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.nama_gedung || 'Tanpa Nama'}</h3>
        <p className={`text-[8.5px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'} mt-0.5`}>
          {p.taxonomy || '-'} • LT: {p.jumlah_lantai || '-'} • {p.kota || ''}
        </p>
        <p className={`text-[8.5px] ${darkMode ? 'text-gray-400' : 'text-slate-400'} mt-0.5 truncate`}>{p.alamat || '-'}</p>
      </div>

      {/* Core Attrs */}
      <div className="grid grid-cols-2 gap-1">
        <div className={`p-1 px-1.5 rounded-lg border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <span className={`block text-[7.5px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Luas</span>
          <span className={`text-[9.5px] font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{p.luas || '-'} <span className="text-[7.5px] opacity-60">m²</span></span>
        </div>
        <div className={`p-1 px-1.5 rounded-lg border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <span className={`block text-[7.5px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Aset</span>
          <span className={`text-[9.5px] font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Rp {assetStr}</span>
        </div>
      </div>

      {/* Hazard Tabs */}
      <div className={`flex rounded-lg p-0.5 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[7.5px] font-black py-1 px-2 rounded-md transition-all uppercase tracking-wider ${activeTab === tab.id
              ? (darkMode ? 'bg-gray-800 text-white shadow' : 'bg-white text-slate-900 shadow')
              : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-0.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 pb-2">
        {activeTab === 'eq' && (
          <div className={`p-1.5 rounded-lg border ${darkMode ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>Gempa (PGA)</span>
              <span className="text-[7.5px] opacity-60">Loss Ratio</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {['1000', '500', '250', '200', '100'].map(rp => {
                let category = 'bmn';
                const upperId = id.toUpperCase();
                if (upperId.startsWith('FS')) category = 'fs';
                else if (upperId.startsWith('FD')) category = 'fd';
                else if (upperId.startsWith('ELECTRICITY')) category = 'electricity';
                else if (upperId.startsWith('AIRPORT')) category = 'airport';
                else if (upperId.startsWith('HOTEL')) category = 'hotel';
                else if (upperId.startsWith('RESIDENTIAL') || upperId.startsWith('RES')) category = 'residential';

                const catData = dlExposure ? (dlExposure[category] || {}) : {};
                const ratio = catData[`pga_${rp}`];
                const ratioStr = ratio != null ? (parseFloat(ratio) * 100).toFixed(4) + '%' : '-';

                return (
                  <div key={rp} className="flex justify-between items-center text-[8.5px] py-1 border-b border-blue-500/5 last:border-0">
                    <span className={`${darkMode ? 'text-gray-300' : 'text-slate-500'} font-medium`}>{rp} Yr</span>
                    <b className="text-blue-500 font-black font-mono">{ratioStr}</b>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'flood' && (
          <div className="space-y-2">
            {!isBMNRes ? (
              <>
                {/* Banjir (R) */}
                <div className={`p-1.5 rounded-lg border ${darkMode ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex justify-between items-center">
                    <span>Banjir (R) - Non-CC</span>
                    <span className="text-[7px] opacity-60">Loss / Share</span>
                  </div>
                  <div className={`grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[8px] ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    {['250', '100', '50', '25', '10', '5', '2'].map(rp => {
                      const val = p[`direct_loss_r_${rp}`] || 0;
                      return (
                        <div key={rp} className="flex justify-between items-center border-b border-emerald-500/5">
                          <span className="opacity-70">{rp}y</span>
                          <div className="flex items-center gap-1">
                            <b className={`${val > 0 ? 'text-emerald-500' : ''}`}>{formatNumberWithUnit(val)}</b>
                            {formatPercent(val, assetValue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Banjir (RC) */}
                <div className={`p-1.5 rounded-lg border ${darkMode ? 'bg-teal-500/5 border-teal-500/10' : 'bg-teal-50/50 border-teal-100'}`}>
                  <div className="text-[8px] font-black text-teal-400 uppercase tracking-widest mb-1 flex justify-between items-center">
                    <span>Banjir (RC) - CC</span>
                    <span className="text-[7px] opacity-60">Loss / Share</span>
                  </div>
                  <div className={`grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[8px] ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    {['250', '100', '50', '25', '10', '5', '2'].map(rp => {
                      const val = p[`direct_loss_rc_${rp}`] || 0;
                      return (
                        <div key={rp} className="flex justify-between items-center border-b border-teal-500/5">
                          <span className="opacity-70">{rp}y</span>
                          <div className="flex items-center gap-1">
                            <b className={`${val > 0 ? 'text-teal-400' : ''}`}>{formatNumberWithUnit(val)}</b>
                            {formatPercent(val, assetValue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[8px] p-4 text-center italic opacity-40">Tidak ada estimasi data banjir untuk residensial/BMN di level bangunan.</div>
            )}
          </div>
        )}

        {activeTab === 'tsunami' && (
          <div className={`p-2 rounded-lg border ${darkMode ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50/50 border-amber-100'}`}>
            <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>Tsunami</span>
              <span className="text-[7px] opacity-60">Inundansi</span>
            </div>
            <div className={`text-[10px] font-black ${darkMode ? 'text-white' : 'text-slate-800'} flex items-baseline gap-2`}>
              <span>Rp {formatNumberWithUnit(p.direct_loss_inundansi || 0)}</span>
              <span className="text-[8px] font-black text-amber-500">{formatPercent(p.direct_loss_inundansi, assetValue)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingInfoPanel;
