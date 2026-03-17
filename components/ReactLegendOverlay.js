import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const colorsAAL = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027', '#7f0000'];

function jenks(data, n_classes) {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.length <= n_classes) return [...new Set(data)].sort((a,b)=>a-b);
  data = data.slice().sort((a, b) => a - b);
  const matrices = Array(data.length + 1).fill(0).map(() => Array(n_classes + 1).fill(0));
  const variances = Array(data.length + 1).fill(0).map(() => Array(n_classes + 1).fill(0));
  for (let i = 1; i <= n_classes; i++) {
    matrices[0][i] = 1;
    variances[0][i] = 0;
    for (let j = 1; j <= data.length; j++) {
      variances[j][i] = Infinity;
    }
  }
  for (let l = 1; l <= data.length; l++) {
    let sum = 0, sumSquares = 0, w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = data[i3 - 1];
      w++;
      sum += val;
      sumSquares += val * val;
      const variance = sumSquares - (sum * sum) / w;
      if (i3 !== 1) {
        for (let j = 2; j <= n_classes; j++) {
          if (variances[l][j] >= (variance + variances[i3 - 1][j - 1])) {
            matrices[l][j] = i3;
            variances[l][j] = variance + variances[i3 - 1][j - 1];
          }
        }
      }
    }
    matrices[l][1] = 1;
    variances[l][1] = sumSquares - (sum * sum) / w;
  }
  const k = data.length;
  const kclass = Array(n_classes + 1).fill(0);
  kclass[n_classes] = data[data.length - 1];
  kclass[0] = data[0];
  let countNum = n_classes;
  let kTmp = k;
  while (countNum > 1) {
    if (matrices[kTmp] && matrices[kTmp][countNum] !== undefined) {
      kclass[countNum - 1] = data[matrices[kTmp][countNum] - 2];
      kTmp = matrices[kTmp][countNum] - 1;
    }
    countNum--;
  }
  return kclass;
}

// ── AAL Chart Sub-Component ──────────────────────────────────────────────────
const HAZARD_KEYS = [
  { key: 'pga',       label: 'Gempa\nBumi',  color: '#ef4444' },
  { key: 'inundansi', label: 'Tsunami',      color: '#8b5cf6' },
  { key: 'r',         label: 'Banjir\n(R)',  color: '#3b82f6' },
  { key: 'rc',        label: 'Banjir\n(RC)', color: '#0ea5e9' },
];
const EXPOSURE_GROUPS = [
  { exp: 'total',       label: 'All Buildings'           },
  { exp: 'fs',          label: 'Healthcare Facilities',  layerKey: 'healthcare'  },
  { exp: 'fd',          label: 'Educational Facilities', layerKey: 'educational' },
  { exp: 'electricity', label: 'Electricity',            layerKey: 'electricity' },
  { exp: 'hotel',       label: 'Hotel',                  layerKey: 'hotel'       },
  { exp: 'airport',     label: 'Airport',                layerKey: 'airport'     },
];

function MiniBarChart({ data, maxVal, expAsset = 0 }) {
  const W = 230, H = 84, PAD = { l: 26, r: 8, t: 10, b: 24 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const barW = Math.floor(chartW / data.length) - 8;
  const fmtM = v => {
    if (v >= 1e9) return (v/1e9).toFixed(1) + 'T';
    if (v >= 1e6) return (v/1e6).toFixed(0) + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(0) + 'K';
    if (v > 0) return v % 1 === 0 ? v.toString() : v.toFixed(1);
    return '0';
  };
  const [hoverData, setHoverData] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  const fmtFull = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  return (
    <div className="relative inline-block" ref={containerRef} onMouseLeave={() => setHoverData(null)}>
      <svg width={W} height={H} style={{overflow:'visible'}}>
        {[0, 0.5, 1].map(t => {
          const y = PAD.t + chartH * (1 - t);
          return (
            <g key={t}>
              <line x1={PAD.l} x2={PAD.l + chartW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{fmtM(maxVal * t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = PAD.l + i * (chartW / data.length) + 4;
          const barH = maxVal > 0 ? Math.max(1, (d.value / maxVal) * chartH) : 0;
          const y = PAD.t + chartH - barH;
          return (
            <g key={i} className="group cursor-pointer">
              <rect 
                x={x} y={y} width={barW} height={barH} rx="2" 
                fill={d.color} opacity="0.85" className="hover:opacity-100 transition-opacity"
                onMouseEnter={(e) => {
                  setHoverData(d);
                }}
                onMouseMove={(e) => {
                  if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                  }
                }}
                onMouseLeave={() => setHoverData(null)}
              />
              {d.label.split('\n').map((line, li) => {
                if (line.trim() === '') return null;
                return (
                  <text key={li} x={x + barW / 2} y={PAD.t + chartH + 11 + li * 9} textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="600">{line}</text>
                );
              })}
            </g>
          );
        })}
      </svg>
      {hoverData && (
        <div 
          className="absolute z-50 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="font-bold mb-1 border-b border-slate-700 pb-1">{hoverData.label.replace('\n', ' ')}</div>
          <div>Direct Loss: <span className="font-semibold text-orange-300">{fmtFull(hoverData.value)}</span></div>
          {expAsset > 0 && (
            <div>Loss Ratio: <span className="font-semibold text-blue-300">{((hoverData.value / expAsset) * 100).toFixed(4)}%</span></div>
          )}
        </div>
      )}
    </div>
  );
}

function DirectLossChartPanel({ boundaryData, selectedCityFeature, selectedGroup }) {
  if (!boundaryData?.features?.length || !selectedGroup) return null;

  let totalCount = 0;
  let totalAsset = 0;

  if (selectedCityFeature) {
    totalCount = selectedCityFeature.properties.count_total || 0;
    totalAsset = selectedCityFeature.properties.total_asset_total || 0;
  } else {
    totalCount = boundaryData.features.reduce((sum, f) => sum + (f.properties.count_total || 0), 0);
    totalAsset = boundaryData.features.reduce((sum, f) => sum + (f.properties.total_asset_total || 0), 0);
  }

  const formatRupiah = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  // Retrieve values across all RPs for a specific exposure group (or 'total')
  const getValuesForHazard = (exposureKey) => {
    const getValue = (rpSuffix) => {
      const metric = `dl_sum_${rpSuffix}`;
      
      const getLoss = (feature) => {
        if (exposureKey === 'total') return feature.properties[metric] || 0;
        let dlExp = feature.properties.dl_exposure || {};
        if (typeof dlExp === 'string') {
          try { dlExp = JSON.parse(dlExp); } catch { dlExp = {}; }
        }
        let expData = dlExp[exposureKey] || {};
        if (typeof expData === 'string') {
          try { expData = JSON.parse(expData); } catch { expData = {}; }
        }
        if (process.env.NODE_ENV !== 'production' && feature.properties.id_kota === 'BADUNG') {
            console.log('[DL DATA]', exposureKey, rpSuffix, expData[rpSuffix], typeof expData[rpSuffix]);
        }
        return expData[rpSuffix] || 0;
      };

      if (selectedCityFeature) {
        return getLoss(selectedCityFeature);
      } else {
        return boundaryData.features.reduce((sum, f) => sum + getLoss(f), 0);
      }
    };

    if (selectedGroup === 'earthquake') {
      const rps = ['100', '200', '250', '500', '1000'];
      return rps.map(rp => ({ label: `${rp} TH`, color: '#ef4444', value: getValue(`pga_${rp}`) }));
    } else if (selectedGroup === 'tsunami') {
      return [{ label: `Inundansi`, color: '#8b5cf6', value: getValue('inundansi') }];
    } else if (selectedGroup === 'banjir') {
      const rps = ['2', '5', '10', '25', '50', '100', '250'];
      let result = [];
      rps.forEach(rp => {
        result.push({ label: `${rp}\nTH`, color: '#3b82f6', value: getValue(`r_${rp}`) }); // R
        result.push({ label: ` \n `, color: '#f97316', value: getValue(`rc_${rp}`) }); // RC
      });
      return result;
    }
    return [];
  };

  const renderCharts = (groups) => {
    // Collect all data first to find the global max for scaling
    const groupData = groups.map(group => {
      const data = getValuesForHazard(group.exp);
      const max = Math.max(...data.map(d => d.value), 0);
      return { ...group, data, max };
    });

    const globalMax = Math.max(...groupData.map(g => g.max), 1);

    return groupData.map(group => {
      if (group.data.length === 0) return null;

      let expCount = 0;
      let expAsset = 0;
      if (selectedCityFeature) {
        expCount = selectedCityFeature.properties[`count_${group.exp}`] || 0;
        expAsset = selectedCityFeature.properties[`total_asset_${group.exp}`] || 0;
      } else {
        expCount = boundaryData.features.reduce((sum, f) => sum + (f.properties[`count_${group.exp}`] || 0), 0);
        expAsset = boundaryData.features.reduce((sum, f) => sum + (f.properties[`total_asset_${group.exp}`] || 0), 0);
      }

      return (
        <div key={group.exp} className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100/50">
          <div className="text-[10px] font-bold text-slate-700 tracking-wide mb-2 text-center">{group.label}</div>
          {group.exp !== 'total' && expCount > 0 && (
            <div className="flex justify-between items-center text-[9px] mb-3 px-2 border-b border-slate-200 pb-2">
              <div className="flex flex-col">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Bangunan</span>
                <span className="font-bold text-slate-700">{expCount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Nilai Aset</span>
                <span className="font-bold text-slate-700">{formatRupiah(expAsset)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-center flex-wrap gap-4 overflow-visible">
            <MiniBarChart data={group.data} maxVal={Math.max(group.max, 1)} expAsset={expAsset} />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="px-4 pb-4 border-t border-slate-100 flex flex-col items-center">
      <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 mb-1 shadow-sm flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Total Bangunan</span>
          <span className="text-[12px] font-extrabold text-slate-800">{totalCount.toLocaleString('id-ID')}</span>
        </div>
        <div className="w-[1px] h-6 bg-slate-200"></div>
        <div className="flex flex-col text-right">
          <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Total Nilai Aset</span>
          <span className="text-[12px] font-extrabold text-slate-800">{formatRupiah(totalAsset)}</span>
        </div>
      </div>

      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase my-3 w-full flex justify-between items-center">
        <span>Distribusi Direct Loss per Eksposur</span>
        {selectedGroup === 'banjir' && (
          <div className="flex gap-2 text-[8px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-[#3b82f6]"></span> R</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-[#f97316]"></span> RC</span>
          </div>
        )}
      </div>
      <div className="flex flex-col w-full px-1 pt-1 pb-2">
        {renderCharts(EXPOSURE_GROUPS)}
      </div>
    </div>
  );
}

function AALChartPanel({ boundaryData, selectedCityFeature, rekapData }) {
  if (!boundaryData?.features?.length) return null;

  let totalCount = 0;
  let totalAsset = 0;

  if (rekapData?.features?.length) {
    if (selectedCityFeature) {
      const rekapFeature = rekapData.features.find(f => f.properties.id_kota === selectedCityFeature.properties.id_kota);
      if (rekapFeature) {
        totalCount = rekapFeature.properties.count_total || 0;
        totalAsset = rekapFeature.properties.total_asset_total || 0;
      }
    } else {
      totalCount = rekapData.features.reduce((sum, f) => sum + (f.properties.count_total || 0), 0);
      totalAsset = rekapData.features.reduce((sum, f) => sum + (f.properties.total_asset_total || 0), 0);
    }
  }

  const formatRupiah = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const getVal = (exp, hazKey) => {
    const metric = `aal_${hazKey}_${exp}`;
    if (selectedCityFeature) return selectedCityFeature.properties[metric] || 0;
    return boundaryData.features.reduce((sum, f) => sum + (f.properties[metric] || 0), 0);
  };

  const renderCharts = (groups) => groups.map(group => {
    const data = HAZARD_KEYS.map(hk => ({ label: hk.label, color: hk.color, value: getVal(group.exp, hk.key) }));
    const groupMax = Math.max(...data.map(d => d.value), 1);

    let expCount = 0;
    let expAsset = 0;
    if (rekapData?.features?.length) {
      if (selectedCityFeature) {
        const rekapFeature = rekapData.features.find(f => f.properties.id_kota === selectedCityFeature.properties.id_kota);
        if (rekapFeature) {
          expCount = rekapFeature.properties[`count_${group.exp}`] || 0;
          expAsset = rekapFeature.properties[`total_asset_${group.exp}`] || 0;
        }
      } else {
        expCount = rekapData.features.reduce((sum, f) => sum + (f.properties[`count_${group.exp}`] || 0), 0);
        expAsset = rekapData.features.reduce((sum, f) => sum + (f.properties[`total_asset_${group.exp}`] || 0), 0);
      }
    }

    return (
      <div key={group.exp} className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100/50">
        <div className="text-[10px] font-bold text-slate-700 tracking-wide mb-2 text-center">{group.label}</div>
        {group.exp !== 'total' && expCount > 0 && (
          <div className="flex justify-between items-center text-[9px] mb-3 px-2 border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Bangunan</span>
              <span className="font-bold text-slate-700">{expCount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Nilai Aset</span>
              <span className="font-bold text-slate-700">{formatRupiah(expAsset)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-center flex-wrap gap-4 overflow-visible">
          <MiniBarChart data={data} maxVal={groupMax} expAsset={expAsset} />
        </div>
      </div>
    );
  });

  return (
    <div className="px-4 pb-4 border-t border-slate-100 flex flex-col items-center">
      {rekapData?.features?.length > 0 && (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 mb-1 shadow-sm flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Total Bangunan</span>
            <span className="text-[12px] font-extrabold text-slate-800">{totalCount.toLocaleString('id-ID')}</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-200"></div>
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Total Nilai Aset</span>
            <span className="text-[12px] font-extrabold text-slate-800">{formatRupiah(totalAsset)}</span>
          </div>
        </div>
      )}

      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase my-3 w-full text-left">Distribusi AAL per Eksposur</div>
      <div className="flex flex-col w-full px-1 pt-1 pb-2">
        {renderCharts(EXPOSURE_GROUPS)}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
const ReactLegendOverlay = ({
  rasterStats,
  infraLayers,
  selectedData,
  curveData,
  calculateDamage,
  HAZARD_INFO,
  EXPOSURE_COLORS,
  activeAalExposure,
  onInputModeChange,
  boundaryDataAAL,
  boundaryDataDL,
  selectedGroup,
  selectedRpId,
  selectedCityFeature,
  onSelectCity,
  onClearCity
}) => {
  const [inputMode, setInputMode] = useState('pick'); // 'pick' or 'manual'
  const [manualIntensity, setManualIntensity] = useState('');
  const [isAalSidebarOpen, setIsAalSidebarOpen] = useState(true);

  const handleModeChange = (mode) => {
    setInputMode(mode);
    if (onInputModeChange) {
      onInputModeChange(mode);
    }
  };

  const hazardKey = rasterStats?.hazardKey;
  const hazardInfo = hazardKey ? HAZARD_INFO[hazardKey] : null;
  const hasHazard = !!hazardInfo;
  const activeExposures = Object.keys(infraLayers).filter(k => k !== 'boundaries' && k !== 'aal' && infraLayers[k]);
  const hasExposure = activeExposures.length > 0;
  const hasAAL = infraLayers.aal && selectedGroup && boundaryDataAAL;
  const hasDirectLoss = infraLayers.directLoss && selectedGroup && boundaryDataDL;
  const showBoundaryPanel = hasAAL || hasDirectLoss;
  const activeBoundaryData = hasAAL ? boundaryDataAAL : boundaryDataDL;

  if (!hasHazard && !hasExposure && !showBoundaryPanel) return null;

  const format = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 });

  // Determine intensity to use
  let displayIntensity = null;
  let displayDamageRatio = null;

  if (inputMode === 'manual') {
    displayIntensity = manualIntensity !== '' ? parseFloat(manualIntensity) : null;
    if (displayIntensity != null && !isNaN(displayIntensity)) {
      const curveMap = { flood: 'banjir', flood_comp: 'banjir', earthquake: 'gempa', tsunami: 'tsunami' };
      const curveKey = curveMap[hazardKey];
      displayDamageRatio = calculateDamage(curveKey, displayIntensity);
    }
  } else {
    displayIntensity = selectedData.intensity;
    displayDamageRatio = selectedData.damageRatio;
  }

  const renderInteractionPanel = () => {
    if (!hasHazard) return null;
    const curveMap = { flood: 'banjir', flood_comp: 'banjir', earthquake: 'gempa', tsunami: 'tsunami' };
    const curveKey = curveMap[hazardKey];
    const hasCurve = !!(curveKey && curveData && curveData[curveKey]);

    let config = null;
    let hazardCurves = null;
    let availableTaxos = [];
    let legendItems = [];
    let polylines = [];
    let svgW = 0, svgH = 0, padding = {}, chartW = 0, chartH = 0, getX = null, getY = null, maxX = 1, maxY = 1;

    if (hasCurve) {
      hazardCurves = curveData[curveKey];
      config = {
        'banjir': {
          taxos: ['1.0', '1', '2.0', '2'],
          colors: { '1.0': '#fbbf24', '1': '#fbbf24', '2.0': '#ef4444', '2': '#ef4444' },
          labels: { '1.0': 'Lantai 1', '1': 'Lantai 1', '2.0': 'Lantai 2+', '2': 'Lantai 2+' },
          title: 'Banjir', xTitle: 'Kedalaman (m)'
        },
        'tsunami': {
          taxos: ['cr', 'mcf'],
          colors: { 'cr': '#8b5cf6', 'mcf': '#ec4899' },
          labels: { 'cr': 'CR', 'mcf': 'MCF' },
          title: 'Tsunami', xTitle: 'Inundansi (m)'
        },
        'gempa': {
          taxos: ['cr', 'mcf'],
          colors: { 'cr': '#8b5cf6', 'mcf': '#ec4899' },
          labels: { 'cr': 'CR', 'mcf': 'MCF' },
          title: hazardInfo.label, xTitle: 'Intensitas'
        }
      }[curveKey];

      availableTaxos = config.taxos.filter(t => {
        return Object.keys(hazardCurves).some(k => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === (t + '.0'));
      });

      let allPtsX = [];
      availableTaxos.forEach(t => {
        const cKey = Object.keys(hazardCurves).find(k => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === (t + '.0'));
        if (hazardCurves[cKey]) allPtsX.push(...hazardCurves[cKey].x);
      });

      if (allPtsX.length > 0) {
        maxX = Math.max(...allPtsX, 1);
        chartW = 110; chartH = 50;
        padding = { top: 10, right: 8, bottom: 15, left: 20 };
        svgW = chartW + padding.left + padding.right;
        svgH = chartH + padding.top + padding.bottom;
        getX = (val) => (val / maxX) * chartW + padding.left;
        getY = (val) => chartH - (val / maxY) * chartH + padding.top;

        let seenLabels = new Set();
        availableTaxos.forEach(t => {
          const cKey = Object.keys(hazardCurves).find(k => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === (t + '.0'));
          const curve = hazardCurves[cKey], label = config.labels[t];
          if (curve && curve.x.length > 1) {
            const points = curve.x.map((x, i) => `${getX(x)},${getY(curve.y[i])}`).join(' ');
            polylines.push(
              <polyline key={t} points={points} fill="none" stroke={config.colors[t]} strokeWidth="1.5" strokeLinejoin="round" />
            );
            if (!seenLabels.has(label)) {
              legendItems.push(
                <div key={label} className="flex items-center gap-1.5 text-[8px] text-slate-500 font-medium whitespace-nowrap">
                  <div style={{ backgroundColor: config.colors[t] }} className="w-2.5 h-[2px] rounded-full"></div>
                  <span>{label}</span>
                </div>
              );
              seenLabels.add(label);
            }
          }
        });
      }
    }

    return (
      <div className="flex flex-row items-center gap-5">
        {/* Vulnerability Curve Section */}
        {hasCurve && polylines.length > 0 && (
          <div className="flex flex-col items-center">
            <h4 className="text-[13px] font-bold text-slate-800 mb-2">Vulnerability Curve</h4>
            <div className="flex flex-row items-center gap-6">
              {/* Chart SVG */}
              <div className="flex flex-col items-center pl-2">
                <svg width={svgW} height={svgH} style={{ fontFamily: 'inherit', overflow: 'visible' }}>
                  <line x1={padding.left} y1={getY(0)} x2={padding.left + chartW} y2={getY(0)} stroke="#e2e8f0" strokeWidth="1" />
                  <line x1={padding.left} y1={getY(0.5)} x2={padding.left + chartW} y2={getY(0.5)} stroke="#f1f5f9" strokeDasharray="2,2" />
                  <line x1={padding.left} y1={getY(1)} x2={padding.left + chartW} y2={getY(1)} stroke="#f1f5f9" strokeDasharray="2,2" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="#cbd5e1" strokeWidth="1" />
                  <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#cbd5e1" strokeWidth="1" />
                  {polylines}
                  <text x={padding.left - 3} y={getY(0) + 2} textAnchor="end" fontSize="6px" fill="#64748b" fontWeight="600">0</text>
                  <text x={padding.left - 3} y={getY(1) + 2} textAnchor="end" fontSize="6px" fill="#64748b" fontWeight="600">1.0</text>
                  <text x={padding.left} y={padding.top + chartH + 8} textAnchor="middle" fontSize="6px" fill="#64748b" fontWeight="600">0</text>
                  <text x={padding.left + chartW} y={padding.top + chartH + 8} textAnchor="middle" fontSize="6px" fill="#64748b" fontWeight="600">{maxX.toFixed(1)}</text>
                  <text x={padding.left + chartW / 2} y={padding.top + chartH + 16} textAnchor="middle" fontSize="6.5px" fill="#94a3b8" fontWeight="700">{config?.xTitle}</text>
                  <text x={6} y={padding.top + chartH / 2} textAnchor="middle" fontSize="6.5px" fill="#94a3b8" fontWeight="700" transform={`rotate(-90, 6, ${padding.top + chartH / 2})`}>Damage</text>
                </svg>
              </div>
              
              {/* Legend Items */}
              <div className="flex flex-col gap-2 justify-center h-full">
                {legendItems}
              </div>
            </div>
          </div>
        )}

        {/* Divider SVG -> Controls */}
        <div className="w-[1px] h-12 bg-slate-200 self-center mx-1 rounded-full"></div>

        {/* Column 3: Controls & Results */}
        <div className="flex flex-row items-center gap-4">
          {/* Controls sub-column */}
          <div className="flex flex-col w-[100px]">
            <div className="flex bg-slate-200 rounded p-0.5 mb-2.5">
              <button 
                className={`flex-1 text-[7px] font-bold py-1 rounded transition-colors ${inputMode === 'pick' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => handleModeChange('pick')}
              >
                PICK POINT
              </button>
              <button 
                className={`flex-1 text-[7px] font-bold py-1 rounded transition-colors ${inputMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => handleModeChange('manual')}
              >
                MANUAL
              </button>
            </div>

            {inputMode === 'manual' ? (
              <input 
                type="number" 
                placeholder="Ketik angka..." 
                value={manualIntensity}
                onChange={(e) => setManualIntensity(e.target.value)}
                className="w-full text-[10px] p-1.5 font-bold border border-orange-500 rounded outline-none shadow-sm text-slate-800"
              />
            ) : (
              <div className="w-full text-[9px] p-1.5 font-semibold text-slate-400 border border-transparent text-center">
                Klik peta...
              </div>
            )}
          </div>

          {/* Results sub-column */}
          <div className="flex flex-col gap-1.5 w-[110px]">
            <div className="flex justify-between items-center">
              <span className="text-[7.5px] text-slate-500 font-semibold">
                Intensity: {displayIntensity != null ? (inputMode === 'manual' ? '(Manual)' : '') : ''}
              </span>
              <span className="text-[9px] text-slate-800 font-bold">
                {displayIntensity != null ? displayIntensity.toFixed(3) + ' ' + (hazardInfo.unit || '') : '-'}
              </span>
            </div>
            
            {hasCurve && availableTaxos.length > 0 ? (
              availableTaxos.map(tax => {
                let val = 0;
                if (displayIntensity != null && displayDamageRatio) {
                  if (displayDamageRatio[tax] !== undefined) {
                    val = displayDamageRatio[tax];
                  } else if (displayDamageRatio[tax.toLowerCase()] !== undefined) {
                    val = displayDamageRatio[tax.toLowerCase()];
                  }
                }
                return (
                  <div key={tax} className="flex justify-between items-center mt-0.5">
                    <span className="text-[7.5px] text-slate-500">Loss {config?.labels[tax] || tax.toUpperCase()}:</span>
                    <span className="text-[9px] font-bold" style={{ color: config?.colors[tax] || '#1e293b' }}>
                      {(val * 100).toFixed(2)}%
                    </span>
                  </div>
                );
              })
            ) : (
              !hasCurve && <div className="text-[7px] text-slate-400 italic mt-1">Tidak ada kalkulasi damage</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {(hasHazard || hasExposure) && (
        <div className="absolute bottom-6 left-[260px] right-0 lg:right-[320px] pointer-events-none z-[2002] flex justify-center">
          <div className="bg-white/95 backdrop-blur-sm px-4 lg:px-5 py-3 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 pointer-events-auto transition-all duration-300 max-w-(full) min-w-max flex flex-row items-center gap-4 lg:gap-6 overflow-x-auto custom-scrollbar">
        {/* 1. Hazard Base Info */}
        {hasHazard && (
          <div className="flex flex-col justify-center min-w-[140px]">
            <div className="font-extrabold mb-1.5 text-[8px] text-slate-700 tracking-widest uppercase truncate">
              Hazard: {hazardInfo.label} ({hazardInfo.unit || 'Index'})
            </div>
            <div
              className="h-1.5 w-full rounded-full mb-1 shadow-sm border border-slate-200/50"
              style={{
                background: `linear-gradient(to right, ${hazardInfo.colorStops.map(s => s[1]).join(',')})`
              }}
            ></div>
            <div className="flex justify-between text-[9px] text-slate-900 font-bold">
              <span>{format(rasterStats.min)} {hazardInfo.unit}</span>
              <span>{format(rasterStats.max)} {hazardInfo.unit}</span>
            </div>
          </div>
        )}

        {/* Divider 1 to 2 */}
        {hasHazard && (
          <div className="w-[1px] bg-slate-200 self-stretch my-1 rounded-full"></div>
        )}

        {/* 2. Curve / Interaction Panel */}
        {hasHazard && (
          <div className="flex shrink-0 min-w-min">
             {renderInteractionPanel()}
          </div>
        )}

        {/* Divider 2 to 3 */}
        {hasHazard && hasExposure && (
          <div className="w-[1px] bg-slate-200 self-stretch my-1 rounded-full"></div>
        )}

        {/* 3. Eksposur */}
        {hasExposure && Object.keys(EXPOSURE_COLORS).some(key => infraLayers[key]) && (
          <div className="flex flex-col justify-center min-w-[100px]">
            <div className="font-bold mb-1.5 text-[8px] text-slate-400 tracking-widest uppercase">
              Eksposur
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {['healthcare', 'educational', 'electricity', 'airport', 'hotel'].map(type => (
                <div key={type} className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full border border-white ring-[0.5px] ring-slate-200"
                    style={{ backgroundColor: EXPOSURE_COLORS[type] }}
                  ></div>
                  <span className="text-[8px] text-slate-600 font-semibold capitalize whitespace-nowrap">{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider 3 to 4 */}
        {hasExposure && showBoundaryPanel && (
          <div className="hidden"></div>
        )}
          </div>
        </div>
      )}

    {showBoundaryPanel && (
      <>
        {/* Toggle Sidebar Button */}
        {!isAalSidebarOpen && (
          <button
            onClick={() => setIsAalSidebarOpen(true)}
            className="absolute right-0 top-4 z-[2002] bg-orange-500 text-white p-2 rounded-l-lg shadow-xl hover:bg-orange-600 transition-all animate-in slide-in-from-right duration-300"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Sidebar Panel */}
        <div 
          className={`absolute top-0 right-0 z-[2002] h-full bg-white/95 backdrop-blur-sm shadow-[-4px_0_24px_rgb(0,0,0,0.08)] border-l border-slate-200 pointer-events-auto transition-all duration-300 flex flex-col
          ${isAalSidebarOpen ? 'w-[280px] lg:w-[320px] translate-x-0' : 'w-[280px] lg:w-[320px] translate-x-full'}`}
        >
          {/* ─── Header ─── */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2">
            <div className="flex-1 pr-1">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAalSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1 rounded-sm transition-colors"
                  title="Sembunyikan Panel AAL"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
                <div className="font-extrabold text-[10px] text-slate-700 tracking-widest uppercase truncate leading-tight mt-0.5">{hasAAL ? 'Kalkulasi AAL' : 'Direct Loss'}</div>
              </div>
              {selectedCityFeature ? (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 leading-tight mr-1 truncate max-w-[100px]">{selectedCityFeature.properties.id_kota || 'Kota'}</span>
                  <button onClick={onClearCity} className="text-[8px] text-slate-400 hover:text-red-500 bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 px-1.5 py-0.5 rounded transition-colors flex-shrink-0">✕ Reset</button>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 mt-1 truncate">Total Semua Kota/Kabupaten</div>
              )}
            </div>
            <div className="flex-shrink-0">
            <select
              className="bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold py-1 pl-2.5 pr-6 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer max-w-[110px] shadow-sm transition-all"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '10px' }}
              value={selectedCityFeature ? selectedCityFeature.properties.id_kota : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSelectCity(null);
                } else {
                  const feature = activeBoundaryData.features.find(f => f.properties.id_kota === val);
                  onSelectCity(feature);
                }
              }}
            >
              <option value="">Pilih Kota...</option>
              {activeBoundaryData.features
                .map(f => f.properties.id_kota)
                .filter(Boolean)
                .sort()
                .map(city => (
                  <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Color Legend ─── */}
        <div className="px-4 pt-3 pb-2">
          {(() => {
            let hazPrefix = '';
            let rp = '';

            if (selectedRpId) {
              const parts = selectedRpId.split('_');
              rp = parts[parts.length - 1];
              if (rp === 'default') rp = '';
            }

            let metric = '';
            let vals = [];

            if (hasDirectLoss) {
              if (selectedGroup === 'banjir') {
                let hz = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
                if (rp) metric = `dl_sum_${hz}_${rp}`;
              }
              else if (selectedGroup === 'earthquake') {
                if (rp) metric = `dl_sum_pga_${rp}`;
              }
              else if (selectedGroup === 'tsunami') {
                metric = `dl_sum_inundansi`;
              }
              vals = metric ? activeBoundaryData.features.map(f => f.properties[metric] || 0).filter(v => typeof v === 'number' && !isNaN(v)) : [];
            } else if (hasAAL) {
              let hazPrefix = '';
              if (selectedGroup === 'banjir') hazPrefix = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
              else if (selectedGroup === 'earthquake') hazPrefix = 'pga';
              else if (selectedGroup === 'tsunami') hazPrefix = 'inundansi';

              metric = `aal_${hazPrefix}_${activeAalExposure || 'total'}`;
              vals = activeBoundaryData.features.map(f => f.properties[metric] || 0).filter(v => typeof v === 'number' && !isNaN(v));
            }

            if (vals.length === 0) return (
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-2 rounded-[2px]" style={{ background: '#1a9850' }} />
                <span className="text-[8px] font-semibold tracking-wider text-slate-500">Rp 0 - Rp 0</span>
              </div>
            );

            const colorsAAL = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027', '#7f0000'];

            const nClass = vals.length > 30 ? 6 : 5;
            let grades = jenks(vals, nClass).sort((a, b) => a - b);
            const halfCount = Math.ceil(nClass / 2);
            const col1 = [], col2 = [];
            Array.from({ length: nClass }).forEach((_, i) => {
              const low = Math.ceil(grades[i] / 1e6);
              const high = Math.ceil(grades[i + 1] / 1e6);
              const item = (
                <div key={i} className="flex items-center gap-2">
                  <span className="inline-block w-5 h-2.5 rounded-[2px] shadow-sm" style={{ background: colorsAAL[i] }} />
                  <span className="text-[8px] font-semibold tracking-wider text-slate-600 whitespace-nowrap">{`Rp ${low.toLocaleString('id-ID')}M`} - {`Rp ${high.toLocaleString('id-ID')}M`}</span>
                </div>
              );
              if (i < halfCount) col1.push(item); else col2.push(item);
            });
            return (
              <div className="flex gap-x-6">
                <div className="flex flex-col gap-1.5">{col1}</div>
                <div className="flex flex-col gap-1.5">{col2}</div>
              </div>
            );
          })()}
        </div>

        {/* ─── Bar Charts ─── */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {hasDirectLoss && (
            <DirectLossChartPanel
              boundaryData={boundaryDataDL}
              selectedCityFeature={selectedCityFeature}
              selectedGroup={selectedGroup}
            />
          )}
          {hasAAL && (
            <AALChartPanel
              boundaryData={boundaryDataAAL}
              selectedCityFeature={selectedCityFeature}
              rekapData={boundaryDataDL}
            />
          )}
        </div>
      </div>
      </>
    )}
  </>
  );
};

export default ReactLegendOverlay;
