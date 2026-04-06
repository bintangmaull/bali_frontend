// components/CogHazardMap.js
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import Script from 'next/script'
import L from 'leaflet'
import { ChevronRight, Layers, Database, Building2, Activity, Info, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
// Note: markercluster CSS and JS will be handled via CDN for simplicity or if normally installed
import LayerServices from './LayerServices'
import ReactLegendOverlay from './ReactLegendOverlay'
import { DROUGHT_CURVE } from '../src/lib/drought_curve'
import Modal from './ui/Modal'
import DownloadModal from './DownloadModal'
import CrudHSBGN from './CrudHSBGN'
import CrudBuildings from './CrudBuildings'
import ExposureTableContent from './ExposureTableContent'
import { MANUAL_GEMPA_DATA } from '../src/lib/manual_gempa_data'

const BuildingInfoPanel = ({ data, darkMode, boundaryLookup, activeTab, setActiveTab }) => {
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
                const cityKey = (p.kota || '').toUpperCase()
                const cityFeature = boundaryLookup.get(cityKey);
                const dlExp = cityFeature?.properties?.dl_exposure || {};

                let category = 'bmn';
                if (id.startsWith('FS')) category = 'fs';
                else if (id.startsWith('FD')) category = 'fd';
                else if (id.startsWith('ELECTRICITY')) category = 'electricity';
                else if (id.startsWith('AIRPORT')) category = 'airport';
                else if (id.startsWith('HOTEL')) category = 'hotel';
                else if (id.startsWith('RESIDENTIAL') || id.startsWith('RES')) category = 'residential';

                const catData = dlExp[category] || {};
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

function jenks(data, n_classes) {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.length <= n_classes) return [...new Set(data)].sort((a, b) => a - b);
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
    kclass[countNum - 1] = data[matrices[kTmp][countNum] - 2];
    kTmp = matrices[kTmp][countNum] - 1;
    countNum--;
  }
  return kclass;
}

// ─── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://upcxonhddesvrvttvjjt.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── Constants ──────────────────────────────────────────────────────────────────
const BASE_LAYERS = {
  road: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
}

const EXPOSURE_COLORS = {
  healthcare: '#EF4444',  // Red
  educational: '#3B82F6', // Blue
  electricity: '#F59E0B', // Amber
  airport: '#10B981',     // Emerald
  hotel: '#8B5CF6',        // Violet
  bmn: '#EC4899',          // Pink
  residential: '#06B6D4'   // Cyan
}

const AAL_COLORS = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027', '#7f0000'];

const getFillColor = (val, grades, activeMetric, isSawahDL) => {
  if ((!activeMetric && !isSawahDL) || !grades || grades.length === 0) return '#f97316';
  if (val === 0) return AAL_COLORS[0];
  for (let i = 0; i < grades.length - 1; i++) {
    if (val >= grades[i] && val < grades[i + 1]) return AAL_COLORS[i];
  }
  return AAL_COLORS[AAL_COLORS.length - 1] || AAL_COLORS[AAL_COLORS.length - 2];
};

const DEFAULT_CURVES = {
  'banjir': {
    '1.0': { x: [0, 0.5, 1, 2, 3, 5], y: [0, 0.1, 0.35, 0.6, 0.8, 0.95] },
    '2.0': { x: [0, 1, 2, 3, 5], y: [0, 0, 0.1, 0.3, 0.6] },
    'sawah': { x: [0.15, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.2], y: [0, 0.1, 0.3, 0.42, 0.51, 0.58, 0.63, 0.71, 0.78, 0.83, 0.88, 0.91, 0.95, 0.99, 1] }
  },
  'gempa': {
    'cr': { x: [0, 0.1, 0.3, 0.5, 0.7, 1.0, 1.2], y: [0, 0, 0.1, 0.45, 0.75, 0.95, 1.0] },
    'mcf': { x: [0, 0.1, 0.3, 0.5, 0.7, 1.0, 1.2], y: [0, 0, 0.05, 0.25, 0.55, 0.85, 1.0] }
  },
  'tsunami': {
    'cr': { x: [0, 0.5, 1, 3, 5, 10], y: [0, 0.2, 0.5, 0.85, 0.95, 1.0] },
    'mcf': { x: [0, 1, 2, 4, 6, 10], y: [0, 0, 0.15, 0.5, 0.75, 0.9] }
  }
}

const HAZARD_INFO = {
  earthquake: {
    label: 'Gempa Bumi (PGA)',
    icon: '🌍',
    colorStops: [
      [0.0, '#3B0764'], [0.15, '#1D4ED8'], [0.35, '#06B6D4'],
      [0.55, '#22C55E'], [0.75, '#EAB308'], [0.90, '#DC2626'], [1.0, '#FFFFFF'],
    ],
    unit: 'g',
  },
  flood: {
    label: 'Banjir (Rainfall)',
    icon: '🌊',
    colorStops: [
      [0.0, '#EFF6FF'], [0.2, '#93C5FD'], [0.45, '#3B82F6'],
      [0.7, '#1E40AF'], [1.0, '#1E3A5F'],
    ],
    unit: 'm',
  },
  flood_comp: {
    label: 'Banjir (Rainfall-Change)',
    icon: '💧',
    colorStops: [
      [0.0, '#ECFDF5'], [0.2, '#6EE7B7'], [0.5, '#10B981'],
      [0.8, '#065F46'], [1.0, '#022C22'],
    ],
    unit: 'm',
  },
  tsunami: {
    label: 'Tsunami',
    icon: '🌏',
    colorStops: [
      [0.0, '#FFF7ED'], [0.25, '#FCA5A5'], [0.55, '#EF4444'],
      [0.80, '#991B1B'], [1.0, '#450A0A'],
    ],
    unit: 'm',
  },
  drought_gpm: {
    label: 'Kekeringan (non climate change)',
    icon: '☀️',
    colorStops: [
      [0.0, '#14532D'], [0.25, '#86EFAC'], [0.5, '#FDE68A'],
      [0.75, '#F97316'], [1.0, '#7F1D1D'],
    ],
    unit: 'Index',
  },
  drought_mme: {
    label: 'Kekeringan (climate change)',
    icon: '🏜️',
    colorStops: [
      [0.0, '#14532D'], [0.25, '#86EFAC'], [0.5, '#FDE68A'],
      [0.75, '#F97316'], [1.0, '#7F1D1D'],
    ],
    unit: 'Index',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function detectHazard(filename) {
  const f = filename.toLowerCase().replace('cog_', '')
  if (f.startsWith('earthquake')) return 'earthquake'
  if (f.startsWith('flood_depth') && f.includes('_rc')) return 'flood_comp'
  if (f.startsWith('flood_depth')) return 'flood'
  if (f.startsWith('tsunami')) return 'tsunami'
  if (f.startsWith('drought') && f.includes('gpm')) return 'drought_gpm'
  if (f.startsWith('drought') && f.includes('mme')) return 'drought_mme'
  return null
}

function extractRP(filename) {
  // Matches ..._r<num>, ..._rc<num>, ..._rp<num>, ..._PGA_<num>, or just ..._<num> preceding .tif
  const m = filename.match(/_?(?:r|rc|rp|PGA_)?(\d+)(?:\.tif)?$/i) || filename.match(/(\d+)(?:\.tif)?$/i)
  return m ? parseInt(m[1]) : null
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// ── SVG Icon Helper for Map ───────────────────────────────────────────────────
function createExposureIcon(type, activeColor) {
  const size = 10;
  const iconSize = 6;
  
  const svgPaths = {
    healthcare: 'M11 2a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h4a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-3a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2h-2z M18 9h1 M14 9h.01 M10 9h.01 M5 9h1 M18 15h1 M14 15h.01 M10 15h.01 M5 15h1',
    educational: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 2 2 3 6 3s6-1 6-3v-5',
    electricity: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
    airport: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
    hotel: 'M2 4v16M2 11h20M2 17h20M22 4v16M11 4v7M15 4v7',
    bmn: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M3 11c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v0H3v0zM12 2l10 6H2l10-6z',
    sawah: 'm12 10 1 1h3l1 1M12 22V10M12 10c0-2.8-2.2-5-5-5M17 2l-3 3M2 2l3 3M7 2 4 5M12 2v3',
    residential: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22 9 12 15 12 15 22'
  };

  const path = svgPaths[type] || '';
  
  const html = `
    <div style="
      width: ${size}px; 
      height: ${size}px; 
      background: ${activeColor}; 
      border: 1px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      transform: translate(-50%, -50%);
    ">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-svg-marker',
    html: html,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}

function interpolateColor(colorStops, t) {
  for (let i = 0; i < colorStops.length - 1; i++) {
    const [t0, c0] = colorStops[i]
    const [t1, c1] = colorStops[i + 1]
    if (t >= t0 && t <= t1) {
      const ratio = (t - t0) / (t1 - t0)
      const [r0, g0, b0] = hexToRgb(c0)
      const [r1, g1, b1] = hexToRgb(c1)
      const r = Math.round(r0 + ratio * (r1 - r0))
      const g = Math.round(g0 + ratio * (g1 - g0))
      const b = Math.round(b0 + ratio * (b1 - b0))
      return `rgba(${r},${g},${b},0.85)`
    }
  }
  return null
}

// ─── Main component ──────────────────────────────────────────────────────────────
export default function CogHazardMap() {
  const { darkMode } = useTheme()
  // Track map zoom for performance optimization
  const [currentZoom, setCurrentZoom] = useState(9.5);
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const [selectedBuildingData, setSelectedBuildingData] = useState(null)
  const [activeBuildingTab, setActiveBuildingTab] = useState('eq')
  const layerRef = useRef(null)
  const sawahLayerRef = useRef(null)   // Separate ref for sawah raster layer
  const baseTiledLayer = useRef(null)
  const exposureCluster = useRef(null)
  const boundaryLayer = useRef(null)
  const proportionalLayer = useRef(null)
  const pickMarkerRef = useRef(null)

  // track which CDN scripts are loaded
  const [georasterReady, setGeoRasterReady] = useState(false)
  const [geoLayerReady, setGeoLayerReady] = useState(false)
  const [geoblazeReady, setGeoblazeReady] = useState(false)
  const [turfReady, setTurfReady] = useState(false)
  const scriptsReady = georasterReady && geoLayerReady && geoblazeReady && turfReady
  const geoCache = useRef(new Map()) // Memory cache for parsed georasters

  // ── Sawah Raster States ───────────────────────────────────────────────────────
  const [sawahMetadata, setSawahMetadata] = useState([])  // [{ year, public_url }]
  const [selectedSawahYear, setSelectedSawahYear] = useState('')  // '' = unloaded
  const [loadingSawah, setLoadingSawah] = useState(false)
  const [opacitySawah, setOpacitySawah] = useState(0.8)
  const [curveData, setCurveData] = useState(DEFAULT_CURVES)

  // ── Drought Direct Loss States ────────────────────────────────────────────────
  const [droughtSawahData, setDroughtSawahData] = useState(null) // from /api/drought-sawah-loss
  const [droughtLossYear, setDroughtLossYear] = useState('loss_2022') // 'loss_2022' | 'loss_2025' | 'loss_2028'

  // ── Flood Sawah Direct Loss States ───────────────────────────────────────────
  const [floodSawahData, setFloodSawahData] = useState(null)  // from /api/flood-sawah-loss
  const [floodView, setFloodView] = useState('building')      // 'building' | 'sawah'
  const [floodSawahYear, setFloodSawahYear] = useState('loss_2022')

  // Click/Selection State for Legend
  const [selectedData, setSelectedData] = useState({ intensity: null, damageRatio: null })
  const [legendInputMode, setLegendInputMode] = useState('pick') // 'pick' or 'manual'

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeBaseLayer, setActiveBaseLayer] = useState('road')
  const [opacityBasemap, setOpacityBasemap] = useState(1.0)
  const [infraLayers, setInfraLayers] = useState({
    healthcare: false, educational: false, electricity: false, airport: false, hotel: false,
    bmn: false, residential: false,
    boundaries: false, aal: false, directLoss: false, modelHazard: false
  })

  // Data States
  const [metadata, setMetadata] = useState({})
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedRpId, setSelectedRpId] = useState('')
  const [exposureData, setExposureData] = useState(null)
  const [boundaryDataAAL, setBoundaryDataAAL] = useState(null)
  const [boundaryDataDL, setBoundaryDataDL] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [error, setError] = useState('')
  const [rasterStats, setRasterStats] = useState(null)
  const [fetchingExposure, setFetchingExposure] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState(null)
  const [user, setUser] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse user from localStorage')
      }
    }
  }, [])

  // Memoized lookups for O(1) access
  const exposureLookup = useMemo(() => {
    if (!exposureData?.features) return new Map()
    const map = new Map()
    exposureData.features.forEach(f => {
      if (f.properties?.id_bangunan) {
        map.set(f.properties.id_bangunan.toUpperCase(), f)
      }
    })
    return map
  }, [exposureData])

  const boundaryLookup = useMemo(() => {
    if (!boundaryDataDL?.features) return new Map()
    const map = new Map()
    boundaryDataDL.features.forEach(f => {
      const cityKey = (f.properties.nama_kota || f.properties.id_kota || '').toUpperCase()
      if (cityKey) map.set(cityKey, f)
    })
    return map
  }, [boundaryDataDL])




  useEffect(() => {
    if (!selectedBuildingId || exposureLookup.size === 0) return
    const feat = exposureLookup.get(selectedBuildingId.toUpperCase())
    if (feat) {
      setSelectedBuildingData(feat.properties)
    }
  }, [selectedBuildingId, exposureLookup])

  // Drag state for Building Detail Panel
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const [panelBuildings, setPanelBuildings] = useState([])

  const [kotaFilter, setKotaFilter] = useState('')

  const handlePointerDown = (e) => {
    // Only drag on the header area or panel itself, not on close button
    if (e.target.closest('.close-btn')) return;
    setIsDragging(true)
    dragStartPos.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPanelPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      })
    }
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Opacity States
  const [opacityHazard, setOpacityHazard] = useState(0.8)
  const [opacityAAL, setOpacityAAL] = useState(0.8)

  // Selected City State (boundary click)
  const [selectedCityFeature, setSelectedCityFeature] = useState(null)

  // Dedicated AAL Exposure State (decoupled from the point layer checkboxes)
  const [activeAalExposure, setActiveAalExposure] = useState('total')
  
  // Track which cities have been targetedly refreshed to ensure we trust their live point counts
  const [refreshedCities, setRefreshedCities] = useState(new Set());

  // ── Helper for City Aggregation ─────────────────────────────────────────────
  const calculateCityEnrichment = useCallback((feature, buildings) => {
    if (!feature || !buildings) return feature;

    const props = feature.properties;
    const cityId = (props.id_kota || props.nama_kota || '').toUpperCase();
    
    // Check if we should trust the live point counts for this city
    const isCityFresh = refreshedCities.has(cityId);
    
    // START: Global manual supplement application and property unpacking
    const baseTotals = { ...props };
    
    // Parse existing dl_exposure from backend
    let existingDlExp = {};
    if (props.dl_exposure) {
      try {
        existingDlExp = typeof props.dl_exposure === 'string' ? JSON.parse(props.dl_exposure) : props.dl_exposure;
      } catch (e) { }
    }

    // 1. Unpack ALL metrics from dl_exposure.total into flat properties
    if (existingDlExp.total) {
       Object.entries(existingDlExp.total).forEach(([key, val]) => {
          baseTotals[key] = val;
          baseTotals[`direct_loss_${key}`] = val;
          
          // Bridge ratio_ prefix gap
          if (key.startsWith('pga_') || key.startsWith('r_') || key.startsWith('rc_') || key.startsWith('inundansi') || key.startsWith('drought')) {
             baseTotals[`ratio_${key}`] = val;
          }
          
          if (!key.startsWith('dl_sum_')) baseTotals[`dl_sum_${key}`] = val;
       });
    }

    // 2. Bridge DB column names back to frontend expected names
    Object.keys(props).forEach(key => {
       if (key.startsWith('ratio_') && baseTotals[key.replace('ratio_', '')] === undefined) {
          baseTotals[key.replace('ratio_', '')] = props[key];
       }
       if (key.startsWith('dl_sum_') && baseTotals[key.replace('dl_sum_', '')] === undefined) {
          baseTotals[key.replace('dl_sum_', '')] = props[key];
       }
    });
    
    // 3. Apply Manual Gempa Supplements
    if (selectedGroup === 'earthquake') {
      const manualCity = MANUAL_GEMPA_DATA[cityId];
      if (manualCity) {
        const cityWideRatios = existingDlExp.total || {};
        ['residential', 'bmn'].forEach(cat => {
          if (manualCity[cat]) {
            baseTotals[`count_${cat}`] = (parseFloat(props[`count_${cat}`]) || 0) + manualCity[cat].count;
            baseTotals[`total_asset_${cat}`] = (parseFloat(props[`total_asset_${cat}`]) || 0) + manualCity[cat].asset;
            baseTotals.count_total = (parseFloat(baseTotals.count_total) || 123) + manualCity[cat].count; // Placeholder count_total fix
            baseTotals.total_asset_total = (parseFloat(baseTotals.total_asset_total) || 0) + manualCity[cat].asset;
            
            if (!existingDlExp[cat] || Object.keys(existingDlExp[cat]).length === 0) {
              existingDlExp[cat] = { ...cityWideRatios };
            }
          }
        });
      }
    }

    // If NOT fresh OR no buildings are available yet, return with unpacked properties
    if (!isCityFresh || !buildings || buildings.length === 0) {
       return {
         ...feature,
         properties: {
           ...baseTotals,
           dl_exposure: JSON.stringify(existingDlExp)
         }
       };
    }

    // ── LIVE POINT-BASED ENRICHMENT (For modified cities) ─────────────────────
    const cityHsbgnSed = parseFloat(props.hsbgn_sederhana) || 0;
    const cityHsbgnNSed = parseFloat(props.hsbgn_tidaksederhana) || 0;

    const cityFeatures = buildings.filter(f => {
      const pCity = (f.properties.kota || '').toUpperCase();
      return pCity.includes(cityId) || cityId.includes(pCity);
    });

    if (cityFeatures.length === 0) {
      return {
        ...feature,
        properties: {
          ...baseTotals,
          dl_exposure: JSON.stringify(existingDlExp)
        }
      };
    }

    const totals = {
      ...baseTotals, // Preserve all backend and manual keys
      count_total: 0,
      total_asset_total: 0,
      dl_exposure: { ...existingDlExp } 
    };

    const categories = ['fs', 'fd', 'electricity', 'airport', 'hotel', 'bmn', 'residential'];
    categories.forEach(cat => {
      totals[`count_${cat}`] = 0;
      totals[`total_asset_${cat}`] = 0;
      if (!totals.dl_exposure[cat]) totals.dl_exposure[cat] = {};
    });

    cityFeatures.forEach(f => {
      const p = f.properties;
      const id = (p.id_bangunan || '').toUpperCase();
      let cat = null;
      if (id.startsWith('FS')) cat = 'fs';
      else if (id.startsWith('FD')) cat = 'fd';
      else if (id.startsWith('ELECTRICITY')) cat = 'electricity';
      else if (id.startsWith('AIRPORT')) cat = 'airport';
      else if (id.startsWith('HOTEL')) cat = 'hotel';
      else if (id.startsWith('BMN')) cat = 'bmn';
      else if (id.startsWith('RESIDENTIAL')) cat = 'residential';

      const luas = parseFloat(p.luas) || 0;
      const hsbgn = parseFloat(p.hsbgn) || (cat === 'residential' || cat === 'bmn' ? cityHsbgnSed : cityHsbgnNSed);
      const asset = (p.nilai_aset != null && parseFloat(p.nilai_aset) > 0) 
        ? parseFloat(p.nilai_aset) 
        : (luas * hsbgn);

      totals.count_total++;
      totals.total_asset_total += asset;
      
      if (cat) {
        totals[`count_${cat}`]++;
        totals[`total_asset_${cat}`] += asset;
        Object.keys(p).forEach(key => {
          if (key.startsWith('direct_loss_')) {
            const hazardKey = key.replace('direct_loss_', '');
            const lossVal = parseFloat(p[key]) || 0;
            totals.dl_exposure[cat][hazardKey] = (totals.dl_exposure[cat][hazardKey] || 0) + lossVal;
            const globalKey = `dl_sum_${hazardKey}`;
            totals[globalKey] = (totals[globalKey] || 0) + lossVal;
            totals[hazardKey] = (totals[hazardKey] || 0) + lossVal;
            totals[`ratio_${hazardKey}`] = (totals[hazardKey] / totals.total_asset_total) * 100;
          }
        });
      }
    });

    // Final merge of manual data for point-based enrichment
    if (selectedGroup === 'earthquake') {
      const manualCity = MANUAL_GEMPA_DATA[cityId];
      if (manualCity) {
        const liveCityWideRatios = {};
        const rps = ['100', '200', '250', '500', '1000'];
        rps.forEach(rp => {
          const lKey = `pga_${rp}`;
          if (totals.total_asset_total > 0) liveCityWideRatios[lKey] = (totals[lKey] || 0) / totals.total_asset_total;
        });

        ['residential', 'bmn'].forEach(cat => {
          if (manualCity[cat]) {
            totals[`count_${cat}`] += manualCity[cat].count;
            totals[`total_asset_${cat}`] += manualCity[cat].asset;
            totals.count_total += manualCity[cat].count;
            totals.total_asset_total += manualCity[cat].asset;

            if (Object.keys(totals.dl_exposure[cat]).length === 0) {
              totals.dl_exposure[cat] = { ...liveCityWideRatios };
            }
          }
        });
      }
    }

    const processedTotals = { ...totals };
    processedTotals.dl_exposure = JSON.stringify(totals.dl_exposure);

    return {
      ...feature,
      properties: { ...feature.properties, ...processedTotals }
    };
  }, [selectedGroup, refreshedCities]);

  // Enriched version of boundaryDataDL and boundaryDataAAL
  const enrichedBoundaryDataDL = useMemo(() => {
    if (!boundaryDataDL?.features || !exposureData?.features) return boundaryDataDL;
    return {
      ...boundaryDataDL,
      features: boundaryDataDL.features.map(f => calculateCityEnrichment(f, exposureData.features))
    };
  }, [boundaryDataDL, exposureData, calculateCityEnrichment]);

  const enrichedBoundaryDataAAL = useMemo(() => {
    if (!boundaryDataAAL?.features || !exposureData?.features) return boundaryDataAAL;
    return {
      ...boundaryDataAAL,
      features: boundaryDataAAL.features.map(f => calculateCityEnrichment(f, exposureData.features))
    };
  }, [boundaryDataAAL, exposureData, calculateCityEnrichment]);

  const enrichedCityFeature = useMemo(() => {
    if (!selectedCityFeature) return null;
    return calculateCityEnrichment(selectedCityFeature, exposureData?.features);
  }, [selectedCityFeature, exposureData, calculateCityEnrichment]);

  const [dataVersion, setDataVersion] = useState(0)
  const [updatedKotaFilter, setUpdatedKotaFilter] = useState(null)
  const refreshAALData = useCallback((kotaOrKotas) => {
    setDataVersion(v => v + 1)
    if (kotaOrKotas) {
      const kotas = Array.isArray(kotaOrKotas) ? kotaOrKotas : [kotaOrKotas];
      setRefreshedCities(prev => {
        const next = new Set(prev);
        kotas.forEach(k => next.add(k.toUpperCase()));
        return next;
      });
      setUpdatedKotaFilter(kotaOrKotas)
    }
  }, [])

  // ── Targeted City Exposure Refresh (Avoid 20 min full reload) ─────────────────
  useEffect(() => {
    if (!updatedKotaFilter || !exposureData) return;

    const fetchSpecificCities = async () => {
      try {
        const kotas = Array.isArray(updatedKotaFilter) ? updatedKotaFilter : [updatedKotaFilter];
        
        for (const targetCity of kotas) {
          const url = `${BACKEND_URL}/api/gedung?kota=${encodeURIComponent(targetCity)}&_v=${Date.now()}`
          const res = await fetch(url)
          if (!res.ok) continue;
          const updatedFeatureCollection = await res.json()
          
          setExposureData(prev => {
            if (!prev || !prev.features) return prev;
            const newFeatures = updatedFeatureCollection.features || [];
            const filteredOld = prev.features.filter(f => 
               f.properties.kota?.toLowerCase() !== targetCity.toLowerCase()
            );
            return { ...prev, features: [...filteredOld, ...newFeatures] }
          })
        }
        
        setDataVersion(v => v + 1)
      } catch (err) {
        console.error('Failed to targeted refresh city:', updatedKotaFilter, err)
      } finally {
        setUpdatedKotaFilter(null)
      }
    }
    
    fetchSpecificCities()
  }, [updatedKotaFilter, exposureData])

  // HSBGN Floating Panel State
  const [isHSBGNPanelOpen, setIsHSBGNPanelOpen] = useState(false)
  const [hsbgnPanelPos, setHsbgnPanelPos] = useState({ x: 0, y: 0 })
  const [isHsbgnDragging, setIsHsbgnDragging] = useState(false)
  const hsbgnDragStartPos = useRef({ x: 0, y: 0 })

  const handleHsbgnPointerDown = (e) => {
    // Only drag on the header area or panel itself, not on interactive elements
    if (e.target.closest('.no-drag')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
    setIsHsbgnDragging(true)
    hsbgnDragStartPos.current = { x: e.clientX - hsbgnPanelPos.x, y: e.clientY - hsbgnPanelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleHsbgnPointerMove = (e) => {
    if (isHsbgnDragging) {
      setHsbgnPanelPos({
        x: e.clientX - hsbgnDragStartPos.current.x,
        y: e.clientY - hsbgnDragStartPos.current.y
      })
    }
  }

  const handleHsbgnPointerUp = (e) => {
    setIsHsbgnDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Bangunan Floating Panel State
  const [isBangunanPanelOpen, setIsBangunanPanelOpen] = useState(false)
  const [bangunanPanelPos, setBangunanPanelPos] = useState({ x: 0, y: 0 })
  const [isBangunanDragging, setIsBangunanDragging] = useState(false)
  const bangunanDragStartPos = useRef({ x: 0, y: 0 })

  const handleBangunanPointerDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
    setIsBangunanDragging(true)
    bangunanDragStartPos.current = { x: e.clientX - bangunanPanelPos.x, y: e.clientY - bangunanPanelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleBangunanPointerMove = (e) => {
    if (isBangunanDragging) {
      setBangunanPanelPos({
        x: e.clientX - bangunanDragStartPos.current.x,
        y: e.clientY - bangunanDragStartPos.current.y
      })
    }
  }

  const handleBangunanPointerUp = (e) => {
    setIsBangunanDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Exposure Table Floating Panel State
  const [isExposurePanelOpen, setIsExposurePanelOpen] = useState(false)
  const [exposurePanelPos, setExposurePanelPos] = useState({ x: 0, y: 0 })
  const [isExposureDragging, setIsExposureDragging] = useState(false)
  const [initialExposureTab, setInitialExposureTab] = useState('healthcare')
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [downloadInitialType, setDownloadInitialType] = useState('building')
  const exposureDragStartPos = useRef({ x: 0, y: 0 })

  const handleExposurePointerDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
    setIsExposureDragging(true)
    exposureDragStartPos.current = { x: e.clientX - exposurePanelPos.x, y: e.clientY - exposurePanelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleExposurePointerMove = (e) => {
    if (isExposureDragging) {
      setExposurePanelPos({
        x: e.clientX - exposureDragStartPos.current.x,
        y: e.clientY - exposureDragStartPos.current.y
      })
    }
  }

  const handleExposurePointerUp = (e) => {
    setIsExposureDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Handle clicking a row in the Exposure Table Panel
  const handleTableRowClick = useCallback((building) => {
    if (!mapRef.current) return;
    const lat = parseFloat(building.lat);
    const lon = parseFloat(building.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    mapRef.current.setView([lat, lon], 18, { animate: true });

    setTimeout(() => {
      L.popup({ autoClose: true, closeOnClick: true })
        .setLatLng([lat, lon])
        .setContent(`
            <div style="font-family: inherit; min-width: 200px;">
              <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">${building.nama_gedung || 'Tanpa Nama'}</div>
              <div style="font-size: 11px; color: #6b7280; font-style: italic; margin-bottom: 8px;">ID: ${building.id_bangunan || '-'}</div>
            </div>
          `)
        .openOn(mapRef.current)
    }, 500);
  }, []);

  const isExposureActive = useMemo(() => {
    // Check if any of the specific exposure layers are active
    const exposureKeys = ['healthcare', 'educational', 'electricity', 'airport', 'hotel', 'bmn', 'residential']
    return exposureKeys.some(k => infraLayers[k])
  }, [infraLayers])

  // ── Handle Base Layer Change ───────────────────────────────────────────────
  const updateBaseLayer = useCallback((layerKey) => {
    if (!mapRef.current) return
    if (baseTiledLayer.current) {
      mapRef.current.removeLayer(baseTiledLayer.current)
    }
    const url = BASE_LAYERS[layerKey]
    baseTiledLayer.current = L.tileLayer(url, {
      attribution: '© OpenStreetMap researchers',
      maxZoom: 19,
    }).addTo(mapRef.current)
    setActiveBaseLayer(layerKey)
  }, [])

  // ── Init Leaflet map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    const map = L.map(mapEl.current, {
      center: [-8.45, 115.05], // Geser sedikit ke barat daya agar pas di tengah karena ada sidebar
      zoom: 9.5,
      zoomSnap: 0.5,
      zoomControl: false,
      preferCanvas: true,
    })

    // Create specific panes for Z-Index ordering
    map.createPane('boundaryPane') // Above rasters
    map.getPane('boundaryPane').style.zIndex = 450

    map.createPane('rasterPane')   // Below boundary but below UI/Markers
    map.getPane('rasterPane').style.zIndex = 400

    map.createPane('markerPane')   // Above everything
    map.getPane('markerPane').style.zIndex = 500

    // Init with road layer
    baseTiledLayer.current = L.tileLayer(BASE_LAYERS.road, {
      attribution: '© OpenStreetMap developers',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── Apply Transparency to Base Layer ──────────────────────────────────────────
  useEffect(() => {
    if (baseTiledLayer.current && typeof baseTiledLayer.current.setOpacity === 'function') {
      baseTiledLayer.current.setOpacity(opacityBasemap)
    }
  }, [opacityBasemap, activeBaseLayer])


  // ── Fetch metadata from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_KEY) return
    setFetchingMeta(true)
    fetch(
      `${SUPABASE_URL}/rest/v1/raster_metadata?select=filename,public_url&order=filename`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json',
        },
      }
    )
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(rows => {
        const grouped = {}
        const sawahEntries = []

        rows.forEach(({ filename, public_url }) => {
          if (filename.toLowerCase().includes('drought')) {
            console.log('DROUGHT FILE FOUND:', filename);
          }

          // ── Extract sawah entries (exposure raster) ──────────────────────────
          if (filename.toLowerCase().includes('sawah')) {
            // Extract year from filename: sawah_2022.tif → 2022
            const yearMatch = filename.match(/(\d{4})/)
            if (yearMatch) {
              sawahEntries.push({ year: yearMatch[1], filename, public_url })
            }
            return  // Don't treat as hazard
          }

          const hazard = detectHazard(filename)
          if (!hazard) return
          if (!grouped[hazard]) grouped[hazard] = []
          grouped[hazard].push({ filename, public_url, rp: extractRP(filename), type: hazard })
        })
        Object.values(grouped).forEach(arr =>
          arr.sort((a, b) => (a.rp || 0) - (b.rp || 0))
        )
        setMetadata(grouped)

        // Sort sawah entries by year ascending
        sawahEntries.sort((a, b) => parseInt(a.year) - parseInt(b.year))
        setSawahMetadata(sawahEntries)
      })
      .catch(e => setError('Gagal memuat metadata: ' + e.message))
      .finally(() => setFetchingMeta(false))
  }, [])

  // ── Fetch Drought Sawah Loss Data ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/drought-sawah-loss`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => setDroughtSawahData(data))
      .catch(e => console.warn('Drought sawah loss fetch failed:', e.message))
  }, [dataVersion])

  // ── Fetch Flood Sawah Loss Data ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/flood-sawah-loss`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => setFloodSawahData(data))
      .catch(e => console.warn('Flood sawah loss fetch failed:', e.message))
  }, [dataVersion])

  // ── Fetch Disaster Curves ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCurves = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/disaster-curves`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCurveData(prev => {
          const merged = { ...prev }
          Object.keys(data).forEach(haz => {
            merged[haz] = { ...(prev[haz] || {}), ...data[haz] }
          })
          return merged
        })
      } catch (err) {
        console.warn('Disaster curves unavailable:', err.message)
      }
    }
    fetchCurves()
  }, [])

  // ── Fetch Exposure Data (Background on Mount) ────────────────────────────────
  useEffect(() => {
    const prefetch = async () => {
      const url = `${BACKEND_URL}/api/gedung?provinsi=Bali${dataVersion > 0 ? `&_v=${dataVersion}` : ''}`
      const cacheName = 'exposure-cache-v2'

      try {
        if (typeof caches === 'undefined') {
          // If CacheStorage API is unavailable (e.g. over HTTP without localhost),
          // fallback to standard fetch without caching.
          setFetchingExposure(true);
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setExposureData(data);
          }
          return;
        }

        const cache = await caches.open(cacheName)
        const cachedResponse = await cache.match(url)

        if (cachedResponse) {
          // Serve from cache immediately
          const data = await cachedResponse.json()
          setExposureData(data)
        } else if (!exposureData) {
          // Only show loading state if we have no data at all
          setFetchingExposure(true)
        }

        // Freshness check in background
        const head = await fetch(url, { method: 'HEAD' }).catch(() => null)
        const serverModified = head ? head.headers.get('last-modified') : null
        const cacheModified = cachedResponse?.headers.get('last-modified')

        // If the backend doesn't support last-modified, or it's different, or it's not cached yet, fetch it.
        if (!cachedResponse || !serverModified || (serverModified !== cacheModified)) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              await cache.put(url, response.clone())
              const data = await response.json()
              setExposureData(data)
            }
          } catch (fetchErr) {
            console.warn('Background fetch for exposure data failed, keeping cached version:', fetchErr)
          }
        }
      } catch (e) {
        console.error('Exposure fetch failed:', e)
      } finally {
        setFetchingExposure(false)
      }
    }
    // Only run the heavy provincial prefetch if we have no data at all yet.
    // This prevents the 20-minute background fetch from firing on every small HSBGN update.
    if (!exposureData) {
      prefetch()
    }
  }, [dataVersion]) // Keep dataVersion to refresh if user manually triggers something, but the guard above stops the loop.

  // ── Fetch Boundary Data (Background on Mount) ────────────────────────────────
  useEffect(() => {
    const fetchBoundaries = async () => {
      const urlAal = `${BACKEND_URL}/api/aal-kota${dataVersion > 0 ? `?_v=${dataVersion}` : ''}`
      const urlDl = `${BACKEND_URL}/api/rekap-aset-kota${dataVersion > 0 ? `?_v=${dataVersion}` : ''}`
      const cacheName = 'boundary-cache-v4'

      try {
        if (typeof caches === 'undefined') {
          // Fallback to standard fetch when CacheStorage is unavailable
          const respAal = await fetch(urlAal).catch(() => null)
          if (respAal && respAal.ok) {
            const dataAal = await respAal.json()
            setBoundaryDataAAL(dataAal)
            if (selectedCityFeature && !boundaryDataDL) {
               const newFeat = dataAal.features.find(f => 
                (f.properties.id_kota || f.properties.nama_kota) === (selectedCityFeature.properties.id_kota || selectedCityFeature.properties.nama_kota)
              );
              if (newFeat) setSelectedCityFeature(newFeat);
            }
          }
          const urlDlFresh = urlDl.includes('?') ? `${urlDl}&t=${Date.now()}` : `${urlDl}?t=${Date.now()}`
          const respDl = await fetch(urlDlFresh).catch(() => null)
          if (respDl && respDl.ok) {
            const dataDl = await respDl.json()
            setBoundaryDataDL(dataDl)
            if (selectedCityFeature) {
              const newFeat = dataDl.features.find(f =>
                (f.properties.id_kota || f.properties.nama_kota) === (selectedCityFeature.properties.id_kota || selectedCityFeature.properties.nama_kota)
              );
              if (newFeat) setSelectedCityFeature(newFeat);
            }
          }
          return;
        }

        const cache = await caches.open(cacheName)

        // --- 1. Fetch AAL ---
        let resAal = await cache.match(urlAal)
        if (resAal) {
          const dataAal = await resAal.json()
          setBoundaryDataAAL(dataAal)
        }

        let headAal = await fetch(urlAal, { method: 'HEAD' }).catch(() => null)
        let serverModAal = headAal ? headAal.headers.get('last-modified') : null
        let cacheModAal = resAal ? resAal.headers.get('last-modified') : null

        if (!resAal || (serverModAal && cacheModAal && serverModAal !== cacheModAal)) {
          const respAal = await fetch(urlAal).catch(() => null)
          if (respAal && respAal.ok) {
            await cache.put(urlAal, respAal.clone())
            const dataAal = await respAal.json()
            setBoundaryDataAAL(dataAal)
            
            // Refresh selected city feature reference from AAL data if DL doesn't exist
            if (selectedCityFeature && !boundaryDataDL) {
               const newFeat = dataAal.features.find(f => 
                (f.properties.id_kota || f.properties.nama_kota) === (selectedCityFeature.properties.id_kota || selectedCityFeature.properties.nama_kota)
              );
              if (newFeat) setSelectedCityFeature(newFeat);
            }
          }
        }

        // --- 2. Fetch Direct Loss ---
        const urlDlFresh = urlDl.includes('?') ? `${urlDl}&t=${Date.now()}` : `${urlDl}?t=${Date.now()}`
        try {
          const respDl = await fetch(urlDlFresh)
          if (respDl.ok) {
            await cache.put(urlDl, respDl.clone())
            const dataDl = await respDl.json()
            setBoundaryDataDL(dataDl)

            // Refresh selected city feature reference to use new data
            if (selectedCityFeature) {
              const newFeat = dataDl.features.find(f =>
                (f.properties.id_kota || f.properties.nama_kota) === (selectedCityFeature.properties.id_kota || selectedCityFeature.properties.nama_kota)
              );
              if (newFeat) setSelectedCityFeature(newFeat);
            }
          }
        } catch (e) {
          // Fallback to cache
          let resDl = await cache.match(urlDl)
          if (resDl) {
            setBoundaryDataDL(await resDl.json())
          }
        }

      } catch (e) {
        console.error('Boundary fetch failed:', e)
      }
    }
    fetchBoundaries()
  }, [dataVersion]) // Only re-fetch manually on dataVersion update to prevent loop

  // ── Effect to update Exposure Markers ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !exposureData) return

    if (!exposureCluster.current) {
      exposureCluster.current = L.layerGroup().addTo(mapRef.current)
    }

    const activeTypes = Object.keys(infraLayers).filter(k => infraLayers[k])
    exposureCluster.current.clearLayers()

    if (activeTypes.length === 0) return

    const markers = []
    exposureData.features.forEach(f => {
      // Filter by city if Building Management panel is open and a city is selected
      if (isBangunanPanelOpen && kotaFilter) {
        const pCity = (f.properties.kota || '').toUpperCase()
        if (!pCity.includes(kotaFilter.toUpperCase())) return
      }

      // Filter by City Selection (both from Dropdown or Map click)
      if (selectedCityFeature && f.properties.kota !== selectedCityFeature.properties.id_kota) {
        return;
      }

      const id = (f.properties.id_bangunan || '').toUpperCase()
      let type = null
      if (id.startsWith('FS') && infraLayers.healthcare) type = 'healthcare'
      else if (id.startsWith('FD') && infraLayers.educational) type = 'educational'
      else if (id.startsWith('ELECTRICITY') && infraLayers.electricity) type = 'electricity'
      else if (id.startsWith('AIRPORT') && infraLayers.airport) type = 'airport'
      else if (id.startsWith('HOTEL') && infraLayers.hotel) type = 'hotel'
      else if (id.startsWith('BMN') && infraLayers.bmn) type = 'bmn'
      else if (id.startsWith('RESIDENTIAL') && infraLayers.residential) type = 'residential'

      if (type) {
        const [lon, lat] = f.geometry.coordinates
        let marker;

        if (currentZoom < 14) {
          // Performance mode: fast Canvas circleMarkers for broad views
          marker = L.circleMarker([lat, lon], {
            radius: 3,
            fillColor: EXPOSURE_COLORS[type],
            color: 'white',
            weight: 0.5,
            opacity: 0.8,
            fillOpacity: 1,
            pane: 'markerPane'
          });
        } else {
          // Beauty mode: hi-res SVG divIcons for detailed views
          marker = L.marker([lat, lon], {
            icon: createExposureIcon(type, EXPOSURE_COLORS[type]),
            pane: 'markerPane'
          });
        }

        marker.bindTooltip(`<strong>${f.properties.nama_gedung || 'Tanpa Nama'}</strong>`, {
          direction: 'top',
          offset: [0, -5],
          opacity: 0.9,
          className: 'exposure-tooltip'
        })
        const p = f.properties

        const luasVal = parseFloat(p.luas) || 0;
        const hsbgnVal = parseFloat(p.hsbgn) || 0;
        // Prioritize stored nilai_aset if available, otherwise use calculation
        const assetValue = p.nilai_aset != null ? parseFloat(p.nilai_aset) : (luasVal * hsbgnVal);

        marker.on('click', () => {
          // Reset panel position when selecting a new building
          setPanelPos({ x: 0, y: 0 })
          setSelectedBuildingId(p.id_bangunan)
          setIsSidebarOpen(true)
        })

        markers.push(marker)
      }
    })
    markers.forEach(m => exposureCluster.current.addLayer(m))
  }, [infraLayers, scriptsReady, exposureData, kotaFilter, isBangunanPanelOpen, selectedCityFeature, currentZoom])

  // ── Effect to update Panel Buildings Zoom Bounds ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    if (!isBangunanPanelOpen || panelBuildings.length === 0) return

    const lats = []
    const lons = []

    panelBuildings.forEach(b => {
      const lat = parseFloat(b.lat)
      const lon = parseFloat(b.lon)
      if (isNaN(lat) || isNaN(lon)) return

      lats.push(lat)
      lons.push(lon)
    })

    if (lats.length > 0 && lons.length > 0) {
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)]
      )
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      }
    }

  }, [panelBuildings, isBangunanPanelOpen])

  // ── Update Boundary Layer ────────────────────────────────────────────────────
  const highlightedBoundaryRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return

    // Choose which boundary data to use based on toggles
    let activeBoundaryData = null;
    if (infraLayers.aal) activeBoundaryData = boundaryDataAAL;
    else if (infraLayers.directLoss) activeBoundaryData = boundaryDataDL;
    else if (infraLayers.boundaries) activeBoundaryData = boundaryDataAAL || boundaryDataDL; // Fallback to either if just boundary is toggled

    if (!activeBoundaryData) {
      if (boundaryLayer.current) {
        mapRef.current.removeLayer(boundaryLayer.current)
        boundaryLayer.current = null
      }
      if (proportionalLayer.current) {
        mapRef.current.removeLayer(proportionalLayer.current)
        proportionalLayer.current = null
      }
      return;
    }

    if (boundaryLayer.current) {
      mapRef.current.removeLayer(boundaryLayer.current)
      boundaryLayer.current = null
    }
    if (proportionalLayer.current) {
      mapRef.current.removeLayer(proportionalLayer.current)
      proportionalLayer.current = null
    }

    if (infraLayers.boundaries || infraLayers.aal || infraLayers.directLoss) {
      let activeMetric = null;
      let grades = [];
      let hazPrefix = '';
      let rp = '';

      if (selectedRpId) {
        const parts = selectedRpId.split('_');
        rp = parts[parts.length - 1];
        if (rp === 'default') rp = '';
      }

      if (infraLayers.directLoss) {
        if (selectedGroup === 'banjir') {
          hazPrefix = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
          if (rp) activeMetric = `dl_sum_${hazPrefix}_${rp}`;
        } else if (selectedGroup === 'earthquake') {
          if (rp) activeMetric = `pga_${rp}`; 
        } else if (selectedGroup === 'tsunami') {
          activeMetric = 'dl_sum_inundansi';
        } else if (selectedGroup === 'kekeringan') {
          activeMetric = null;
        }
      } else if (infraLayers.aal) {
        if (selectedGroup === 'banjir') hazPrefix = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
        else if (selectedGroup === 'earthquake') hazPrefix = 'pga';
        else if (selectedGroup === 'tsunami') hazPrefix = 'inundansi';
        else if (selectedGroup === 'kekeringan') hazPrefix = 'drought';
        if (hazPrefix) activeMetric = `aal_${hazPrefix}_${activeAalExposure || 'total'}`;
      }

      const isAal = infraLayers.aal && activeMetric;
      const isSawahDL = selectedRpId && infraLayers.directLoss && ((selectedGroup === 'banjir' && floodView === 'sawah') || selectedGroup === 'kekeringan');
      const isEarthquake = selectedGroup === 'earthquake' && infraLayers.directLoss;

      // 1. Calculate Legend Grades (Jenks)
      if (activeMetric || isSawahDL) {
        let vals = [];
        if (isSawahDL) {
          const data = selectedGroup === 'banjir' ? floodSawahData : droughtSawahData;
          if (data) {
            const isCC = selectedRpId && (selectedRpId.includes('comp') || selectedRpId.includes('mme'));
            const ccKey = selectedGroup === 'banjir' ? (isCC ? 'rc' : 'r') : (isCC ? 'mme' : 'gpm');
            const rpMatch = selectedRpId ? selectedRpId.match(/(\d+)/) : null;
            const rpKey = rpMatch ? rpMatch[1] : (data.return_periods?.[0]?.toString() || '2');
            const lossYear = selectedGroup === 'banjir' ? floodSawahYear : droughtLossYear;
            const rows = data[ccKey]?.[rpKey] || [];
            vals = rows.map(r => r[lossYear] || 0).filter(v => typeof v === 'number' && !isNaN(v));
          }
        } else if (activeMetric) {
          vals = activeBoundaryData.features.map(f => {
            if (isEarthquake) {
              let dlExp = f.properties.dl_exposure || {};
              if (typeof dlExp === 'string') { try { dlExp = JSON.parse(dlExp); } catch { dlExp = {}; } }
              const activeLayer = Object.keys(infraLayers).find(l => infraLayers[l] && !['modelHazard', 'directLoss', 'aal', 'boundaries'].includes(l)) || 'total';
              const layerToCat = { 'healthcare': 'fs', 'educational': 'fd' };
              const categoryKey = layerToCat[activeLayer] || activeLayer;
              const catData = dlExp[categoryKey] || {};
              return (catData[activeMetric] || catData[`direct_loss_${activeMetric}`] || 0) * 100;
            }
            return f.properties[activeMetric] || f.properties[`ratio_${activeMetric}`] || 0;
          }).filter(v => typeof v === 'number' && !isNaN(v));
        }

        if (vals.length > 0) {
          const nClasses = vals.length > 30 ? 6 : 5;
          grades = jenks(vals, nClasses).sort((a, b) => a - b);
        }
      }

      const isProportional = infraLayers.modelHazard && (activeMetric || isSawahDL);

      // 2. Styling Functions
      const getVal = (feature) => {
        let val = 0;
        if (isSawahDL) {
          const data = selectedGroup === 'banjir' ? floodSawahData : droughtSawahData;
          if (data) {
            const isCC = selectedRpId && (selectedRpId.includes('comp') || selectedRpId.includes('mme'));
            const ccKey = selectedGroup === 'banjir' ? (isCC ? 'rc' : 'r') : (isCC ? 'mme' : 'gpm');
            const rpMatch = selectedRpId ? selectedRpId.match(/(\d+)/) : null;
            const rpKey = rpMatch ? rpMatch[1] : (data.return_periods?.[0]?.toString() || '2');
            const lossYear = selectedGroup === 'banjir' ? floodSawahYear : droughtLossYear;
            const cityKey = (feature.properties.nama_kota || feature.properties.id_kota || '').toUpperCase();
            const rows = data[ccKey]?.[rpKey] || [];
            const row = rows.find(r => r.kota.toUpperCase() === cityKey);
            val = row ? row[lossYear] || 0 : 0;
          }
        } else if (isEarthquake) {
          let dlExp = feature.properties.dl_exposure || {};
          if (typeof dlExp === 'string') { try { dlExp = JSON.parse(dlExp); } catch { dlExp = {}; } }
          const activeLayer = Object.keys(infraLayers).find(l => infraLayers[l] && !['modelHazard', 'directLoss', 'aal', 'boundaries'].includes(l)) || 'total';
          const layerToCat = { 'healthcare': 'fs', 'educational': 'fd' };
          const categoryKey = layerToCat[activeLayer] || activeLayer;
          const catData = dlExp[categoryKey] || {};
          val = (catData[activeMetric] || catData[`direct_loss_${activeMetric}`] || 0) * 100;
        } else if (activeMetric) {
          val = feature.properties[activeMetric] || feature.properties[`ratio_${activeMetric}`] || 0;
        }
        return val;
      };

      const defaultStyle = (feature) => {
        const val = getVal(feature);
        const showHazard = !!activeMetric;
        const hasAnyDisplay = showHazard || isSawahDL;

        if (isProportional) {
          return {
            color: '#64748b',
            weight: 1.5,
            opacity: opacityAAL > 0 ? 0.8 : 0,
            fillOpacity: hasAnyDisplay ? (opacityAAL * 0.15) : 0,
            fillColor: hasAnyDisplay ? getFillColor(val, grades, activeMetric, isSawahDL) : 'transparent',
            dashArray: '4'
          };
        }

        return {
          color: hasAnyDisplay ? '#ffffff' : '#64748b',
          weight: hasAnyDisplay ? 1 : 1.5,
          opacity: hasAnyDisplay ? opacityAAL : 0.8,
          fillOpacity: hasAnyDisplay ? (opacityAAL * 0.8) : 0,
          fillColor: hasAnyDisplay ? getFillColor(val, grades, activeMetric, isSawahDL) : 'transparent',
          dashArray: hasAnyDisplay ? '' : '4'
        };
      };

      const highlightStyle = (feature) => {
        if (isProportional) return { weight: 2, color: '#f97316', fillOpacity: 0.1, dashArray: '' };
        return { weight: 2, color: '#64748b', fillOpacity: opacityAAL, dashArray: '' };
      };

      const fmtPopup = (n, isEq = false) => {
        if (isEq) return n.toFixed(4) + '%';
        return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
      };

      // 3. Proportional Markers Setup
      let maxMetricValue = 0;
      if (isProportional) {
        maxMetricValue = Math.max(...activeBoundaryData.features.map(f => getVal(f)).filter(v => typeof v === 'number' && !isNaN(v)), 0);
        if (proportionalLayer.current) mapRef.current.removeLayer(proportionalLayer.current);
        proportionalLayer.current = L.layerGroup().addTo(mapRef.current);
      }

      // 4. Create GeoJSON Layer
      boundaryLayer.current = L.geoJSON(activeBoundaryData, {
        pane: 'boundaryPane',
        style: defaultStyle,
        onEachFeature: (feature, layer) => {
          if (feature.properties && (feature.properties.id_kota || feature.properties.nama_kota)) {
            const val = getVal(feature);
            let tooltipLabel = "AAL";
            if (infraLayers.directLoss) {
               tooltipLabel = isEarthquake ? "Loss Ratio" : "Direct Loss";
               if (isSawahDL) tooltipLabel = "Direct Loss Sawah";
            }

            const hasVal = val !== null && val > 0;
            const tooltipContent = `<strong>${feature.properties.nama_kota || feature.properties.id_kota}</strong>${hasVal ? `<br/>${tooltipLabel}: ${fmtPopup(val, isEarthquake)}` : ''}`;

            layer.bindTooltip(tooltipContent, { sticky: true, className: 'boundary-tooltip' });

            if (isProportional && val > 0 && maxMetricValue > 0) {
              const maxRadius = 30, minRadius = 5;
              let center = layer.getBounds().getCenter();
              if (window.turf && feature.geometry) {
                try {
                  const centerFeature = window.turf.pointOnFeature(feature);
                  if (centerFeature?.geometry?.coordinates) center = L.latLng(centerFeature.geometry.coordinates[1], centerFeature.geometry.coordinates[0]);
                } catch (e) {}
              }

              let radius = Math.sqrt(val / maxMetricValue) * maxRadius;
              radius = Math.max(radius, minRadius);
              
              const circle = L.circleMarker(center, {
                radius,
                fillColor: getFillColor(val, grades, activeMetric, isSawahDL),
                color: '#ffffff',
                weight: 1.5,
                opacity: opacityAAL > 0 ? 1 : 0,
                fillOpacity: opacityAAL * 0.9,
                pane: 'markerPane'
              });
              circle.bindTooltip(tooltipContent, { sticky: true, className: 'boundary-tooltip' });
              circle.on('click', (e) => layer.fireEvent('click', e));
              proportionalLayer.current.addLayer(circle);
            }

            layer.on('click', (e) => {
              if (highlightedBoundaryRef.current) boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
              layer.setStyle(highlightStyle(feature));
              highlightedBoundaryRef.current = layer;
              layer.bringToFront();
              setSelectedCityFeature(feature);
              if (mapRef.current) mapRef.current.fire('click', { latlng: e.latlng, layerPoint: e.layerPoint, containerPoint: e.containerPoint });
            });
          }
        }
      }).addTo(mapRef.current);
    }
  }, [infraLayers.boundaries, infraLayers.aal, infraLayers.directLoss, infraLayers.modelHazard, selectedGroup, selectedRpId, boundaryDataAAL, boundaryDataDL, opacityAAL, activeAalExposure, floodView, floodSawahData, droughtSawahData, floodSawahYear, droughtLossYear])





  // ── Grouped Derived Data ────────────────────────────────────────────────────────
  const hazardGroupFiles = useMemo(() => {
    if (!selectedGroup) return []

    let keys = []
    if (selectedGroup === 'banjir') keys = ['flood', 'flood_comp']
    else if (selectedGroup === 'earthquake') keys = ['earthquake']
    else if (selectedGroup === 'tsunami') keys = ['tsunami']
    else if (selectedGroup === 'kekeringan') keys = ['drought_gpm', 'drought_mme']

    let combined = []
    keys.forEach(k => {
      if (metadata[k]) {
        metadata[k].forEach(f => {
          combined.push({
            ...f,
            uniqueId: `${f.type}_${f.rp || 'default'}`,
            displayLabel: k === 'flood_comp' ? `${f.rp} Tahun (Rainfall-Change)`
              : k === 'flood' ? `${f.rp} Tahun (Rainfall)`
                : k === 'drought_gpm' ? `${f.rp} Tahun (non climate change)`
                  : k === 'drought_mme' ? `${f.rp} Tahun (climate change)`
                    : f.rp ? `${f.rp} Tahun` : 'Default'
          })
        })
      }
    })

    return combined.sort((a, b) => (a.rp || 0) - (b.rp || 0))
  }, [selectedGroup, metadata])

  const isSingleLayer = useMemo(() => {
    return hazardGroupFiles.length === 1 && hazardGroupFiles[0].rp === null
  }, [hazardGroupFiles])

  // Reset selection when group changes
  useEffect(() => {
    setSelectedRpId('')
    setFloodView('building')  // reset sawah/building toggle
    if (selectedGroup === null) {
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setRasterStats(null)
    } else if (selectedGroup === 'tsunami' || selectedGroup === 'kekeringan' || selectedGroup === 'flood_comp') {
      // Auto-select for groups that typically only have one relevant mode/RP
      const files = hazardGroupFiles[selectedGroup] || []
      if (files.length > 0) setSelectedRpId(files[0].id)
    }
  }, [selectedGroup, hazardGroupFiles])

  // ── Damage Calculation Helper ────────────────────────────────────────────────
  const calculateDamage = useCallback((curveKey, intensity) => {
    if (!curveData || !curveData[curveKey] || intensity == null) return null

    let processedIntensity = intensity
    const curves = curveData[curveKey]
    const taxos = (curveKey === 'gempa' || curveKey === 'tsunami') ? ['cr', 'mcf'] : (curveKey === 'banjir' ? ['1.0', '2.0', 'sawah'] : ['1.0', '2.0'])

    if (intensity <= 0) {
      const results = {}
      taxos.forEach(t => { results[t] = 0 })
      return results
    }

    // ── PGA to MMI Conversion for Earthquake ─────────────────────────────────
    // If it's gempa and the intensities in the curve look like MMI (e.g. max > 2)
    // and our input looks like PGA (e.g. < 2)
    if (curveKey === 'gempa') {
      const allX = Object.values(curves).flatMap(c => c.x)
      const maxCurveX = Math.max(...allX)
      if (maxCurveX > 3 && processedIntensity < 2) {
        // PGA (g) to MMI conversion (Wald et al. 1999)
        // Convert g to cm/s^2 (gal)
        const pgaGal = processedIntensity * 980
        if (pgaGal < 1) processedIntensity = 1
        else if (pgaGal < 135) {
          processedIntensity = 2 * Math.log10(pgaGal) + 1.15
        } else {
          processedIntensity = 3.66 * Math.log10(pgaGal) - 1.66
        }
        console.log(`Converted PGA ${intensity}g to MMI ${processedIntensity.toFixed(2)}`)
      }
    }

    // ── Drought Curve Logic (Hardcoded GPM Index) ─────────────────────────────
    if (curveKey === 'drought_gpm' || curveKey === 'drought_mme' || curveKey === 'kekeringan') {
      const xInput = processedIntensity
      if (xInput <= DROUGHT_CURVE[0].x) return { 'sawah': DROUGHT_CURVE[0].y }
      if (xInput >= DROUGHT_CURVE[DROUGHT_CURVE.length - 1].x) return { 'sawah': DROUGHT_CURVE[DROUGHT_CURVE.length - 1].y }
      
      for (let i = 1; i < DROUGHT_CURVE.length; i++) {
        const x1 = DROUGHT_CURVE[i - 1].x, y1 = DROUGHT_CURVE[i - 1].y
        const x2 = DROUGHT_CURVE[i].x, y2 = DROUGHT_CURVE[i].y
        if (xInput >= x1 && xInput <= x2) {
          const t = (xInput - x1) / (x2 - x1)
          const damage = y1 + (y2 - y1) * t
          return { 'sawah': damage }
        }
      }
      return { 'sawah': 0 }
    }

    const results = {}

    taxos.forEach(t => {
      // Find curve with case-insensitive match
      const cKey = Object.keys(curves).find(k => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === (t + '.0'))
      const curve = curves[cKey]

      if (curve && curve.x.length > 0) {
        let damage = 0
        const ptsX = curve.x, ptsY = curve.y
        if (processedIntensity <= ptsX[0]) {
          damage = ptsY[0]
        } else if (processedIntensity >= ptsX[ptsX.length - 1]) {
          if (curveKey === 'tsunami') {
            const n = ptsX.length;
            if (n >= 2) {
              const x0 = ptsX[n - 2], y0 = ptsY[n - 2];
              const x1 = ptsX[n - 1], y1 = ptsY[n - 1];
              const slope = (y1 - y0) / (x1 - x0);
              damage = y1 + slope * (processedIntensity - x1);
              if (damage > 1.0) damage = 1.0;
            } else {
              damage = 1.0;
            }
          } else {
            damage = ptsY[ptsY.length - 1]
          }
        } else {
          for (let i = 1; i < ptsX.length; i++) {
            if (processedIntensity <= ptsX[i]) {
              const x0 = ptsX[i - 1], y0 = ptsY[i - 1]
              const x1 = ptsX[i], y1 = ptsY[i]
              damage = y0 + (y1 - y0) * (processedIntensity - x0) / (x1 - x0)
              break
            }
          }
        }
        results[t] = damage
      }
    })
    return results
  }, [curveData])


  // ── Mouse/Click Interaction Logic ──────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return
    const map = mapRef.current

    const onMapClick = (e) => {
      console.log('Map clicked at:', e.latlng);

      if (pickMarkerRef.current) {
        map.removeLayer(pickMarkerRef.current)
      }
      pickMarkerRef.current = L.circleMarker(e.latlng, {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        pane: 'markerPane'
      }).addTo(map)

      const georaster = layerRef.current?.options?.georaster
      if (!georaster || !window.geoblaze) {
        console.warn('Georaster or geoblaze not ready', { hasGeoraster: !!georaster, hasGeoblaze: !!window.geoblaze });
        return
      }

      try {
        const { lat, lng } = e.latlng
        const result = window.geoblaze.identify(georaster, [lng, lat])
        console.log('Geoblaze identify result:', result);
        let intensity = result ? result[0] : null

        if (intensity == null || intensity === georaster.noDataValue || isNaN(intensity)) {
          intensity = 0
        }

        const curveMap = { flood: 'banjir', flood_comp: 'banjir', earthquake: 'gempa', tsunami: 'tsunami', drought_gpm: 'drought_gpm', drought_mme: 'drought_mme' }
        const currentHazardKey = rasterStats?.hazardKey || layerRef.current.options.hazardKey
        const curveKey = curveMap[currentHazardKey]
        console.log('Calculated Hazard Key:', { currentHazardKey, curveKey, intensity });
        const dmg = calculateDamage(curveKey, intensity)
        console.log('Calculated Damage:', dmg);
        setSelectedData({ intensity, damageRatio: dmg })
      } catch (err) {
        console.error('Error during geoblaze identify:', err);
        setSelectedData({ intensity: 0, damageRatio: null })
      }
    }

    if (legendInputMode === 'pick') {
      map.on('click', onMapClick)
      // Apply crosshair cursor to the map container for visual feedback
      if (mapEl.current) mapEl.current.style.cursor = 'crosshair'

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'none'
    } else {
      map.off('click', onMapClick)
      if (mapEl.current) mapEl.current.style.cursor = ''

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'auto'

      if (pickMarkerRef.current) {
        map.removeLayer(pickMarkerRef.current)
        pickMarkerRef.current = null
      }
    }

    return () => {
      map.off('click', onMapClick)
      if (mapEl.current) mapEl.current.style.cursor = ''

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'auto'
    }
  }, [rasterStats?.hazardKey, calculateDamage, legendInputMode])


  // ── Search Logic ─────────────────────────────────────────────────────────────
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    if (!query || query.length < 2 || !exposureData) {
      setSearchResults([])
      return
    }

    const activeTypes = Object.keys(infraLayers).filter(k => k !== 'boundaries' && infraLayers[k])
    const results = exposureData.features
      .filter(f => {
        const id = (f.properties.id_bangunan || '').toUpperCase()
        let type = null
        if (id.startsWith('FS') && infraLayers.healthcare) type = 'healthcare'
        else if (id.startsWith('FD') && infraLayers.educational) type = 'educational'
        else if (id.startsWith('ELECTRICITY') && infraLayers.electricity) type = 'electricity'
        else if (id.startsWith('AIRPORT') && infraLayers.airport) type = 'airport'
        else if (id.startsWith('HOTEL') && infraLayers.hotel) type = 'hotel'
        if (!type) return false

        const name = (f.properties.nama_gedung || '').toLowerCase()
        const addr = (f.properties.alamat || '').toLowerCase()
        const q = query.toLowerCase()
        return name.includes(q) || addr.includes(q)
      })
      .slice(0, 5)
    setSearchResults(results)
  }, [exposureData, infraLayers])

  const handleSearchSelect = useCallback((feature) => {
    if (!mapRef.current) return
    const [lon, lat] = feature.geometry.coordinates
    setSearchQuery(feature.properties.nama_gedung || '')
    setSearchResults([])

    mapRef.current.setView([lat, lon], 17, { animate: true })

    // Open popup after a short delay for the zoom animation
    setTimeout(() => {
      L.popup()
        .setLatLng([lat, lon])
        .setContent(`
          <div style="font-family: inherit; min-width: 200px;">
            <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">${feature.properties.nama_gedung || 'Tanpa Nama'}</div>
            <div style="font-size: 11px; color: #6b7280; font-style: italic; margin-bottom: 8px;">${feature.properties.alamat || '-'}</div>
          </div>
        `)
        .openOn(mapRef.current)
    }, 500)
  }, [])

  // ── Load Sawah COG layer ────────────────────────────────────────────────────
  const loadSawahCOG = useCallback(async (publicUrl) => {
    const parseGeoraster = window.parseGeoraster
    const GeoRasterLayer = window.GeoRasterLayer
    if (!parseGeoraster || !GeoRasterLayer) return

    setLoadingSawah(true)
    try {
      // Check memory cache
      let georaster = null
      if (geoCache.current.has('sawah_' + publicUrl)) {
        georaster = geoCache.current.get('sawah_' + publicUrl)
      } else {
        if (typeof caches === 'undefined') {
          const response = await fetch(publicUrl)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const arrayBuffer = await response.arrayBuffer()
          georaster = await parseGeoraster(arrayBuffer)
        } else {
          const cacheName = 'cog-cache-v2'
          const cache = await caches.open(cacheName)
          const cachedResponse = await cache.match(publicUrl)
          if (cachedResponse) {
            const arrayBuffer = await cachedResponse.clone().arrayBuffer()
            georaster = await parseGeoraster(arrayBuffer)
          } else {
            const response = await fetch(publicUrl)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            await cache.put(publicUrl, response.clone())
            const arrayBuffer = await response.arrayBuffer()
            georaster = await parseGeoraster(arrayBuffer)
          }
        }
        geoCache.current.set('sawah_' + publicUrl, georaster)
      }

      // Remove previous sawah layer
      if (sawahLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(sawahLayerRef.current)
        sawahLayerRef.current = null
      }

      const noData = georaster.noDataValue
      const layer = new GeoRasterLayer({
        georaster,
        opacity: opacitySawah,
        resolution: 256,
        pane: 'rasterPane',
        // Only show pixels with value exactly 1 (sawah class)
        pixelValuesToColorFn: (values) => {
          const v = values[0]
          if (v == null || isNaN(v) || v === noData) return null
          if (Math.round(v) !== 1) return null   // Only render sawah pixels (value = 1)
          return '#4ade80'  // Solid green (alpha handled by layer opacity)
        },
      })
      console.log('Sawah Raster Loaded:', {
        url: publicUrl,
        mins: georaster.mins,
        maxs: georaster.maxs,
        noData,
        pixelWidth: georaster.pixelWidth,
        pixelHeight: georaster.pixelHeight
      })
      layer.addTo(mapRef.current)
      sawahLayerRef.current = layer
    } catch (e) {
      console.error('Sawah COG load error:', e)
    } finally {
      setLoadingSawah(false)
    }
  }, [opacitySawah])

  // ── Effect: load/unload sawah layer when year changes ───────────────────────
  useEffect(() => {
    if (!scriptsReady || !mapRef.current) return
    if (!selectedSawahYear) {
      if (sawahLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(sawahLayerRef.current)
        sawahLayerRef.current = null
      }
      return
    }
    const entry = sawahMetadata.find(e => e.year === selectedSawahYear)
    if (entry) loadSawahCOG(entry.public_url)
  }, [selectedSawahYear, sawahMetadata, scriptsReady, loadSawahCOG])

  // ── Immediate Sawah Opacity Update ──────────────────────────────────────────
  useEffect(() => {
    if (sawahLayerRef.current && typeof sawahLayerRef.current.setOpacity === 'function') {
      sawahLayerRef.current.setOpacity(opacitySawah)
    }
  }, [opacitySawah])

  // Helper to DRY render logic
  const renderLayer = async (georaster, rMin, rMax, hazardKey) => {
    const GeoRasterLayer = window.GeoRasterLayer
    if (layerRef.current && mapRef.current) {
      mapRef.current.removeLayer(layerRef.current)
    }
    const info = HAZARD_INFO[hazardKey]
    const noData = georaster.noDataValue
    const layer = new GeoRasterLayer({
      georaster,
      opacity: opacityHazard,
      resolution: 256,
      pane: 'rasterPane', // Ensure sit on top of AAL boundaries
      pixelValuesToColorFn: (values) => {
        const v = values[0]
        if (v == null || isNaN(v) || v === noData) return null
        // Skip exactly 0 as it usually represents safe/background in integer masks, but allow negative indices for drought.
        const isDrought = hazardKey === 'drought_gpm' || hazardKey === 'drought_mme';
        if (v === 0 && rMin >= 0 && !isDrought) return null

        const t = Math.max(0, Math.min(1, (v - rMin) / (rMax - rMin)))
        return info ? interpolateColor(info.colorStops, t) : null
      },
    })
    layer.addTo(mapRef.current)
    layerRef.current = layer
    mapRef.current.fitBounds(layer.getBounds())
    setRasterStats({ hazardKey, min: rMin, max: rMax })
  }

  // ── Load COG layer ────────────────────────────────────────────────────────────
  const loadCOG = useCallback(async (publicUrl, hazardKey) => {
    const parseGeoraster = window.parseGeoraster
    const GeoRasterLayer = window.GeoRasterLayer

    if (!parseGeoraster || !GeoRasterLayer) {
      setError('Library belum siap.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let georaster = null
      let rMin, rMax

      // 1. Check Memory Cache
      if (geoCache.current.has(publicUrl)) {
        console.log('Serving from memory cache:', publicUrl)
        const cached = geoCache.current.get(publicUrl)
        georaster = cached.georaster
        rMin = cached.rMin
        rMax = cached.rMax
      } else {
        // 2. Check Persistence Cache
        let cache = null;
        let cachedResponse = null;
        if (typeof caches !== 'undefined') {
          const cacheName = 'cog-cache-v2'
          cache = await caches.open(cacheName)
          cachedResponse = await cache.match(publicUrl)
        }

        if (cachedResponse) {
          console.log('Serving from persistent cache (initial):', publicUrl)
          const arrayBuffer = await cachedResponse.clone().arrayBuffer()
          georaster = await parseGeoraster(arrayBuffer)
          rMin = georaster.mins[0]; rMax = georaster.maxs[0];
          if (rMin == null || rMax == null || rMin === rMax) { rMin = 0; rMax = 1; }

          await renderLayer(georaster, rMin, rMax, hazardKey)
          setLoading(false)
          const head = await fetch(publicUrl, { method: 'HEAD' })
          const serverModified = head.headers.get('last-modified')
          const cacheModified = cachedResponse.headers.get('last-modified')

          if (serverModified && cacheModified && serverModified !== cacheModified) {
            console.log('Persistent cache obsolete, updating...')
            const res = await fetch(publicUrl)
            if (res.ok) {
              if (cache) await cache.put(publicUrl, res.clone())
              const newBuf = await res.arrayBuffer()
              const newGeo = await parseGeoraster(newBuf)
              const nrMin = newGeo.mins[0], nrMax = newGeo.maxs[0]
              await renderLayer(newGeo, nrMin || 0, nrMax || 1, hazardKey)
              geoCache.current.set(publicUrl, { georaster: newGeo, rMin: nrMin || 0, rMax: nrMax || 1 })
            }
          } else {
            geoCache.current.set(publicUrl, { georaster, rMin, rMax })
          }
          return
        }

        // 4. No cache - Full Fetch
        console.log('No cache found. Fetching...')
        const response = await fetch(publicUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (cache) await cache.put(publicUrl, response.clone())
        const arrayBuffer = await response.arrayBuffer()
        georaster = await parseGeoraster(arrayBuffer)
        rMin = georaster.mins[0]; rMax = georaster.maxs[0];
        if (rMin == null || rMax == null || rMin === rMax) { rMin = 0; rMax = 1; }
        geoCache.current.set(publicUrl, { georaster, rMin, rMax })
      }

      await renderLayer(georaster, rMin, rMax, hazardKey)
    } catch (e) {
      setError('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [HAZARD_INFO])

  useEffect(() => {
    if (!infraLayers.modelHazard) {
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setRasterStats(null)
      return
    }

    if (!selectedGroup || hazardGroupFiles.length === 0) {
      return
    }

    let file = isSingleLayer ? hazardGroupFiles[0] : null
    if (!file && selectedRpId) {
      file = hazardGroupFiles.find(f => f.uniqueId === selectedRpId)
    }
    if (!file && hazardGroupFiles.length > 0) {
      file = hazardGroupFiles[0]
    }

    if (file) {
      loadCOG(file.public_url, file.type)
    }
  }, [infraLayers.modelHazard, selectedGroup, hazardGroupFiles, isSingleLayer, selectedRpId, loadCOG])

  // ── Clear COG when selection is removed ──────────────────────────────────────
  useEffect(() => {
    if (!selectedGroup) {
      setSelectedRpId('')
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setSelectedData({ intensity: null, damageRatio: null })
      setRasterStats(null)
    }
  }, [selectedGroup])

  // ── Immediate Opacity Update ──────────────────────────────────────────────────
  useEffect(() => {
    if (layerRef.current && typeof layerRef.current.setOpacity === 'function') {
      layerRef.current.setOpacity(opacityHazard)
    }
  }, [opacityHazard])

  // ── Programmatic City Selection (Dropdown) ──────────────────────────────────
  const handleCityDropdownSelect = useCallback((feature) => {
    setSelectedCityFeature(feature);

    if (feature) {
      setInfraLayers(prev => ({ ...prev, boundaries: true }));
    }

    if (!feature) {
      // Clear selection
      if (highlightedBoundaryRef.current && boundaryLayer.current) {
        boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
        highlightedBoundaryRef.current = null;
      }
      return;
    }

    // Highlight and zoom to the selected feature
    if (boundaryLayer.current && mapRef.current) {
      let targetLayer = null;
      boundaryLayer.current.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties.id_kota === feature.properties.id_kota) {
          targetLayer = layer;
        }
      });

      if (targetLayer) {
        if (highlightedBoundaryRef.current) {
          boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
        }

        // Compute style identical to the click handler
        const isAalActive = isExposureActive; // Simplified logic, mimicking click
        targetLayer.setStyle({
          weight: 2, color: '#64748b', fillOpacity: opacityAAL, dashArray: ''
        });

        highlightedBoundaryRef.current = targetLayer;
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          targetLayer.bringToFront();
        }

        mapRef.current.fitBounds(targetLayer.getBounds(), {
          padding: [20, 20],
          maxZoom: 12,
          animate: true
        });
      }
    }
  }, [opacityAAL, isExposureActive]);

  return (
    <>
      {/* Load External Scripts */}
      <Script id="georaster" src="https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoRasterReady(true)} />
      <Script id="georaster-layer" src="https://cdn.jsdelivr.net/npm/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js" strategy="afterInteractive" onLoad={() => setGeoLayerReady(true)} />
      <Script id="geoblaze" src="https://cdn.jsdelivr.net/npm/geoblaze@2.7.0/dist/geoblaze.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoblazeReady(true)} />
      <Script id="turf" src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js" strategy="afterInteractive" onLoad={() => setTurfReady(true)} />

      <style jsx global>{`
        .exposure-icon {
          background: white;
          border-radius: 50%;
          padding: 4px;
          border: 1px solid #f97316;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .exposure-icon:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        .exposure-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        .exposure-tooltip::before {
          border-top-color: white !important;
        }

        .compact-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
        }
        .compact-popup .leaflet-popup-content {
          margin: 10px 12px;
          line-height: 1.2;
        }
      `}</style>

      <div className="relative w-full h-full flex overflow-hidden">
        <LayerServices
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          hazardGroupFiles={hazardGroupFiles}
          isSingleLayer={isSingleLayer}
          selectedRpId={selectedRpId}
          setSelectedRpId={setSelectedRpId}
          infraLayers={infraLayers}
          setInfraLayers={setInfraLayers}
          setInitialExposureTab={setInitialExposureTab}
          loading={loading || fetchingMeta}
          fetchingExposure={fetchingExposure}
          scriptsReady={scriptsReady}
          activeBaseLayer={activeBaseLayer}
          updateBaseLayer={updateBaseLayer}
          opacityBasemap={opacityBasemap}
          setOpacityBasemap={setOpacityBasemap}
          opacityHazard={opacityHazard}
          setOpacityHazard={setOpacityHazard}
          opacityAAL={opacityAAL}
          setOpacityAAL={setOpacityAAL}
          activeAalExposure={activeAalExposure}
          setActiveAalExposure={setActiveAalExposure}
          sawahMetadata={sawahMetadata}
          selectedSawahYear={selectedSawahYear}
          setSelectedSawahYear={setSelectedSawahYear}
          loadingSawah={loadingSawah}
          opacitySawah={opacitySawah}
          setOpacitySawah={setOpacitySawah}
          floodView={floodView}
          setFloodView={setFloodView}
          floodSawahYear={floodSawahYear}
          setFloodSawahYear={setFloodSawahYear}
          onOpenHSBGN={() => {
            setHsbgnPanelPos({ x: 0, y: 0 }); // reset position if re-opened
            setIsHSBGNPanelOpen(true)
          }}
          onOpenBangunan={() => {
            setBangunanPanelPos({ x: 0, y: 0 }); // reset position if re-opened
            setIsBangunanPanelOpen(true)
            setInfraLayers(prev => ({
              ...prev,
              healthcare: true,
              educational: true,
              electricity: true,
              airport: true,
              hotel: true,
              bmn: true,
              residential: true
            }))
          }}
          droughtLossYear={droughtLossYear}
          setDroughtLossYear={setDroughtLossYear}
          exposureData={exposureData}
          boundaryDataDL={enrichedBoundaryDataDL}
          boundaryDataAAL={enrichedBoundaryDataAAL}
          droughtSawahData={droughtSawahData}
          floodSawahData={floodSawahData}
          onOpenDownload={(type) => {
            setDownloadInitialType(type || 'building');
            setIsDownloadOpen(true);
          }}
        />

        {/* ── Map area ── */}
        <div className="flex-1 relative h-full">
          {/* Toggle Sidebar Button */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-6 md:top-4 z-[1010] bg-orange-500 text-white p-1.5 md:p-2 rounded-r-lg shadow-xl hover:bg-orange-600 transition-all animate-in slide-in-from-left duration-300"
            >
              <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          )}

          {/* Exposure Search Bar */}
          {isExposureActive && !isBangunanPanelOpen && (
            <div className="absolute top-6 md:top-4 left-1/2 -translate-x-1/2 z-[1010] w-[140px] sm:w-[240px] md:w-full max-w-[320px] md:max-w-md px-1 md:px-4">
              <div className={`rounded-full shadow-xl border transition-all flex items-center px-3 py-1.5 md:px-4 md:py-2 h-[28px] md:h-auto group focus-within:ring-2 focus-within:ring-[#1E5C9A]/40 ${
                darkMode ? 'bg-[#1E2023]/95 border-gray-700' : 'bg-white/95 border-gray-200'
              }`}>
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`flex-1 w-full bg-transparent text-[10px] md:text-[12px] font-bold outline-none border-0 ring-0 focus:ring-0 focus:outline-none placeholder:text-gray-400 transition-all ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}
                  style={{ boxShadow: 'none' }}
                />
                <button className="text-gray-400 group-hover:text-gray-600">
                  <Layers className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className={`mt-2 rounded-2xl shadow-2xl border transition-all overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ${
                  darkMode ? 'bg-[#1A1D21] border-gray-800' : 'bg-white border-gray-50'
                }`}>
                  {searchResults.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchSelect(f)}
                      className="w-full h-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50 group flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 flex-shrink-0 transition-colors">
                        <Layers size={14} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className={`text-[12px] font-bold truncate transition-all ${
                          darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{f.properties.nama_gedung || 'Tanpa Nama'}</div>
                        <div className={`text-[10px] truncate mt-0.5 transition-all ${
                          darkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>{f.properties.alamat || '-'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map canvas */}
          <div ref={mapEl} className="w-full h-full z-0" />

          {/* Building Detail Overlay */}
          {selectedBuildingHtml && (
            <div
              className={`absolute top-20 left-3 md:left-[280px] z-[1020] backdrop-blur-xl rounded-xl shadow-2xl p-2.5 md:p-3 w-[calc(100vw-24px)] md:w-[220px] max-h-[80vh] overflow-y-auto custom-scrollbar border animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto cursor-grab active:cursor-grabbing transition-all ${
                darkMode ? 'bg-[#0D0F12]/95 border-white/10 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
              }`}
              style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="flex justify-between items-center pb-2 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Info size={12} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-300' : 'text-slate-500'}`}>Building Info</span>
                </div>
                <button 
                  onClick={() => { setSelectedBuildingHtml(null); setSelectedBuildingId(null); }} 
                  className={`close-btn transition-all p-1.5 rounded-lg ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
              <BuildingInfoPanel 
                data={selectedBuildingData}
                darkMode={darkMode}
                boundaryLookup={boundaryLookup}
                activeTab={activeBuildingTab}
                setActiveTab={setActiveBuildingTab}
              />
            </div>
          )}

          {/* Overlays */}
          <ReactLegendOverlay
            rasterStats={rasterStats}
            infraLayers={infraLayers}
            selectedData={selectedData}
            curveData={curveData}
            calculateDamage={calculateDamage}
            HAZARD_INFO={HAZARD_INFO}
            EXPOSURE_COLORS={EXPOSURE_COLORS}
            activeAalExposure={activeAalExposure}
            onInputModeChange={(mode) => setLegendInputMode(mode)}
            boundaryDataAAL={enrichedBoundaryDataAAL}
            boundaryDataDL={enrichedBoundaryDataDL}
            selectedGroup={selectedGroup}
            selectedRpId={selectedRpId}
            selectedCityFeature={enrichedCityFeature}
            onSelectCity={handleCityDropdownSelect}
            onClearCity={() => handleCityDropdownSelect(null)}
            droughtLossYear={droughtLossYear}
            setDroughtLossYear={setDroughtLossYear}
            droughtSawahData={droughtSawahData}
            floodView={floodView}
            setFloodView={(v) => { setFloodView(v); }}
            floodSawahYear={floodSawahYear}
            setFloodSawahYear={setFloodSawahYear}
            floodSawahData={floodSawahData}
            onOpenTable={(tab) => {
              setInitialExposureTab(tab || 'healthcare');
              setInfraLayers(prev => ({
                ...prev,
                [tab || 'healthcare']: true
              }));
              setExposurePanelPos({ x: 0, y: 0 });
              setIsExposurePanelOpen(true);
            }}
            onOpenDownload={(type) => {
              setDownloadInitialType(type || 'building');
              setIsDownloadOpen(true);
            }}
          />

          <DownloadModal 
            isOpen={isDownloadOpen}
            onClose={() => setIsDownloadOpen(false)}
            exposureData={exposureData}
            boundaryDataDL={enrichedBoundaryDataDL}
            boundaryDataAAL={enrichedBoundaryDataAAL}
            droughtSawahData={droughtSawahData}
            floodSawahData={floodSawahData}
            selectedGroup={selectedGroup}
            user={user}
            initialType={downloadInitialType}
          />

          {error && (
            <div className="absolute top-4 right-16 z-[1000] bg-white border border-red-100 text-red-500 px-4 py-2 rounded-full shadow-xl text-[11px] font-bold tracking-wide">
              {error}
            </div>
          )}

          {loading && (
            <div className={`absolute inset-0 z-[2000] flex items-center justify-center backdrop-blur-[4px] transition-all ${
              darkMode ? 'bg-[#0D0F12]/50' : 'bg-white/50'
            }`}>
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                <span className={`text-[11px] font-bold tracking-[0.2em] px-5 py-2 rounded-full shadow-sm border transition-all ${
                  darkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-100'
                }`}>LOADING DATA</span>
              </div>
            </div>
          )}

          {/* Draggable HSBGN Floating Panel */}
          {isHSBGNPanelOpen && (
            <div
              className={`absolute top-[70px] md:top-[64px] left-2 md:left-[290px] z-[1020] backdrop-blur-xl rounded-[20px] md:rounded-[24px] shadow-2xl min-w-[280px] md:min-w-[340px] w-[calc(100vw-16px)] md:w-[500px] h-[calc(100dvh-120px)] md:h-[400px] md:resize overflow-hidden border animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col transition-all ${
                darkMode ? 'bg-[#0D0F12]/95 border-white/10 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
              }`}
              style={{ transform: `translate(${hsbgnPanelPos.x}px, ${hsbgnPanelPos.y}px)` }}
              onPointerDown={handleHsbgnPointerDown}
              onPointerMove={handleHsbgnPointerMove}
              onPointerUp={handleHsbgnPointerUp}
              onPointerCancel={handleHsbgnPointerUp}
            >
              <div className="flex justify-between items-center px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Database size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className={`text-[10px] font-black tracking-[0.12em] uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>Data HSBGN</h3>
                </div>
                <button
                  onClick={() => setIsHSBGNPanelOpen(false)}
                  className="no-drag text-gray-500 hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-500/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="no-drag p-2 flex-1 overflow-hidden w-full flex flex-col scroll-container">
                <CrudHSBGN onDataChanged={refreshAALData} />
              </div>
              
              {/* Resize Handle Indicator */}
              <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white/10 rounded-br-md pointer-events-none" />
            </div>
          )}

          {/* Draggable Bangunan Floating Panel */}
          {isBangunanPanelOpen && (
            <div
              className={`absolute top-[70px] md:top-[64px] left-2 md:left-[320px] z-[1020] backdrop-blur-xl rounded-[20px] md:rounded-[24px] shadow-2xl min-w-[280px] md:min-w-[360px] w-[calc(100vw-16px)] md:w-[640px] h-[calc(100dvh-120px)] md:h-[550px] md:resize overflow-hidden border animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col transition-all ${
                darkMode ? 'bg-[#0D0F12]/95 border-white/10 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
              }`}
              style={{ transform: `translate(${bangunanPanelPos.x}px, ${bangunanPanelPos.y}px)` }}
              onPointerDown={handleBangunanPointerDown}
              onPointerMove={handleBangunanPointerMove}
              onPointerUp={handleBangunanPointerUp}
              onPointerCancel={handleBangunanPointerUp}
            >
              <div className="flex justify-between items-center px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Building2 size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className={`text-[10px] font-black tracking-[0.12em] uppercase transition-all ${
                    darkMode ? 'text-white' : 'text-slate-800'
                  }`}>Data Bangunan</h3>
                </div>
                <button
                  onClick={() => setIsBangunanPanelOpen(false)}
                  className="no-drag text-gray-500 hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-500/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="no-drag p-0 flex-1 overflow-hidden w-full flex flex-col justify-center scroll-container">
                <CrudBuildings
                  onDataChanged={refreshAALData}
                  kotaFilter={kotaFilter}
                  setKotaFilter={setKotaFilter}
                  infraLayers={infraLayers}
                  onFilteredBuildings={setPanelBuildings}
                  onSearchBuilding={(b) => {
                    if (!mapRef.current) return;
                    const lat = parseFloat(b.lat);
                    const lon = parseFloat(b.lon);
                    if (isNaN(lat) || isNaN(lon)) return;

                    mapRef.current.setView([lat, lon], 18, { animate: true });

                    setTimeout(() => {
                      L.popup({ autoClose: true, closeOnClick: true, className: 'compact-popup' })
                        .setLatLng([lat, lon])
                        .setContent(getBuildingPopupHtml(b))
                        .openOn(mapRef.current)
                    }, 500);
                  }}
                />
              </div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white/10 rounded-br-md pointer-events-none" />
            </div>
          )}

          {/* Draggable Exposure Table Floating Panel */}
          {isExposurePanelOpen && (
            <div
              className={`absolute top-[70px] md:top-[64px] left-2 md:left-[350px] z-[1020] backdrop-blur-xl rounded-[20px] md:rounded-[24px] shadow-2xl min-w-[280px] md:min-w-[420px] w-[calc(100vw-16px)] md:w-[500px] h-[calc(100dvh-120px)] md:h-[550px] md:resize overflow-hidden border animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col transition-all ${
                darkMode ? 'bg-[#0D0F12]/95 border-white/10 shadow-black/60' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
              }`}
              style={{ transform: `translate(${exposurePanelPos.x}px, ${exposurePanelPos.y}px)` }}
              onPointerDown={handleExposurePointerDown}
              onPointerMove={handleExposurePointerMove}
              onPointerUp={handleExposurePointerUp}
              onPointerCancel={handleExposurePointerUp}
            >
              <div className="flex justify-between items-center px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Activity size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className={`text-[10px] font-black tracking-[0.12em] uppercase transition-all ${
                    darkMode ? 'text-white' : 'text-slate-800'
                  }`}>Data Direct Loss</h3>
                </div>
                <button
                  onClick={() => setIsExposurePanelOpen(false)}
                  className="no-drag text-gray-500 hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-500/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="no-drag p-0 flex-1 overflow-hidden w-full flex flex-col scroll-container">
                <ExposureTableContent
                  exposureData={exposureData}
                  selectedGroup={selectedGroup}
                  selectedCityFeature={selectedCityFeature}
                  cityGeojson={boundaryDataDL}
                  initialTab={initialExposureTab}
                  onRowClick={handleTableRowClick}
                  onTabChange={(tab) => {
                    setInfraLayers(prev => ({
                      ...prev,
                      healthcare: tab === 'healthcare',
                      educational: tab === 'educational',
                      electricity: tab === 'electricity',
                      airport: tab === 'airport',
                      hotel: tab === 'hotel'
                    }));
                  }}
                />
              </div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white/10 rounded-br-md pointer-events-none" />
            </div>
          )}

        </div>
      </div>
      <Script id="script-georaster" src="https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoRasterReady(true)} />
      <Script id="script-georaster-layer" src="https://cdn.jsdelivr.net/npm/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js" strategy="afterInteractive" onLoad={() => setGeoLayerReady(true)} />
      <Script id="script-geoblaze" src="https://unpkg.com/geoblaze@2.7.0/dist/geoblaze.web.min.js" strategy="afterInteractive" onLoad={() => setGeoblazeReady(true)} />
    </>
  )
}
