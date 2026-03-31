import React, { useState } from 'react'
import {
  ChevronLeft, Layers, SlidersHorizontal, Layout,
  AlertTriangle, BarChart3, Box, Plus,
  Stethoscope, GraduationCap, Zap, Plane, Bed, Home, Landmark, Sprout, Database,
  ArrowRight, Download
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import DownloadModal from './DownloadModal'

const SectionTitle = ({ children, icon: Icon, onSettingsClick, isActive }) => {
  const { darkMode } = useTheme();
  return (
    <div className="flex items-center justify-between mt-2 mb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />}
        <h3 className={`text-[9px] font-black tracking-[0.12em] uppercase ${darkMode ? 'text-blue-200/80' : 'text-slate-700'}`}>
          {children}
        </h3>
      </div>
      {onSettingsClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onSettingsClick(); }}
          className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : (darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}`}
          title={`Settings for ${typeof children === 'string' ? children : ''}`}
        >
          <SlidersHorizontal size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

const CustomIcon = ({ id, active, darkMode }) => {
  const iconColors = {
    healthcare: '#EF4444',
    educational: '#3B82F6',
    electricity: '#F59E0B',
    airport: '#10B981',
    hotel: '#8B5CF6',
    bmn: '#EC4899',
    sawah: '#10B981',
    residential: '#06B6D4'
  };

  const color = active ? iconColors[id] || (darkMode ? '#60a5fa' : '#3b82f6') : (darkMode ? '#4b5563' : '#94a3b8');
  const size = 16;

  const icons = {
    healthcare: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h4a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-3a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2h-2z" />
        <path d="M18 9h1" /><path d="M14 9h.01" /><path d="M10 9h.01" /><path d="M5 9h1" />
        <path d="M18 15h1" /><path d="M14 15h.01" /><path d="M10 15h.01" /><path d="M5 15h1" />
      </svg>
    ),
    educational: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    electricity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color + '40' : "none"} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    airport: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
    hotel: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16M2 11h20M2 17h20M22 4v16M11 4v7M15 4v7" />
      </svg>
    ),
    bmn: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M3 11c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v0H3v0zM12 2l10 6H2l10-6z" />
      </svg>
    ),
    sawah: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 10 1 1h3l1 1M12 22V10M12 10c0-2.8-2.2-5-5-5M17 2l-3 3M2 2l3 3M7 2 4 5M12 2v3" />
      </svg>
    ),
    residential: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color + '40' : "none"} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  };

  return icons[id] || <Box size={size} />;
};

const ExposureCard = ({ id, label, active, onClick, disabled }) => {
  const { darkMode } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group flex flex-col items-center justify-center gap-1 p-1 rounded-xl border transition-all duration-300 overflow-hidden ${active
        ? (darkMode ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-blue-50 border-blue-200 shadow-sm')
        : (darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100')
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
    >
      <div className={`p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${active
        ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white')
        : (darkMode ? 'bg-white/5 text-gray-400' : 'bg-white text-slate-400 shadow-sm')
        }`}>
        <CustomIcon id={id} active={active} darkMode={darkMode} />
      </div>
      <span className={`text-[8.5px] font-bold tracking-tight transition-colors duration-300 ${active
        ? (darkMode ? 'text-blue-100' : 'text-blue-900')
        : (darkMode ? 'text-gray-500' : 'text-slate-500')
        }`}>
        {label}
      </span>
    </button>
  );
};

const RadioItem = ({ label, name, value, checked, onChange, disabled }) => {
  const { darkMode } = useTheme();
  return (
    <button
      onClick={() => onChange(value)}
      disabled={disabled}
      className={`group flex items-center justify-between w-full p-1.5 rounded-xl border transition-all duration-300 ${checked
        ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-emerald-50 border-emerald-100 shadow-sm')
        : (darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:border-slate-200')
        }`}
    >
      <span className={`text-[11px] font-bold tracking-tight transition-colors duration-300 ${checked
        ? (darkMode ? 'text-white' : 'text-blue-900')
        : (darkMode ? 'text-gray-400' : 'text-slate-500')
        }`}>
        {label}
      </span>
      <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 relative ${checked ? 'bg-blue-500' : (darkMode ? 'bg-white/10' : 'bg-slate-200')
        }`}>
        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 transform ${checked ? 'translate-x-4' : 'translate-x-0'
          }`} />
      </div>
    </button>
  );
};

const CheckItem = ({ label, checked, onChange, disabled, icon: Icon }) => {
  const { darkMode } = useTheme();
  return (
    <button
      disabled={disabled}
      onClick={onChange}
      className={`group flex items-center gap-3 w-full p-2.5 rounded-xl border transition-all duration-300 ${checked
        ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-emerald-50 border-emerald-100')
        : (darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm')
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
    >
      <div className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center shrink-0 ${checked
        ? 'bg-emerald-500 border-emerald-500'
        : (darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')
        }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={14} className={checked ? 'text-emerald-500' : 'text-gray-400'} />}
        <span className={`text-[11px] font-bold tracking-tight transition-colors duration-300 truncate ${checked
          ? (darkMode ? 'text-white' : 'text-emerald-900')
          : (darkMode ? 'text-gray-400' : 'text-slate-600')
          }`}>
          {label}
        </span>
      </div>
    </button>
  );
};

export default function LayerServices({
  isSidebarOpen,
  setIsSidebarOpen,
  selectedGroup,
  setSelectedGroup,
  hazardGroupFiles,
  isSingleLayer,
  selectedRpId,
  setSelectedRpId,
  activeCategory,
  setActiveCategory,
  infraLayers,
  setInfraLayers,
  setInitialExposureTab,
  loading,
  fetchingExposure,
  scriptsReady,
  activeBaseLayer,
  updateBaseLayer,
  opacityBasemap,
  setOpacityBasemap,
  opacityHazard,
  setOpacityHazard,
  opacityAAL,
  setOpacityAAL,
  activeAalExposure,
  setActiveAalExposure,
  // Sawah raster exposure props
  sawahMetadata = [],
  selectedSawahYear,
  setSelectedSawahYear,
  loadingSawah,
  opacitySawah,
  setOpacitySawah,
  onOpenHSBGN,
  onOpenBangunan,
  droughtLossYear,
  setDroughtLossYear,
  floodView,
  setFloodView,
  floodSawahYear,
  setFloodSawahYear,
  // Data for download
  exposureData,
  boundaryDataDL,
  boundaryDataAAL,
  droughtSawahData,
  floodSawahData,
  onOpenDownload
}) {
  const { darkMode } = useTheme()
  const [openSettings, setOpenSettings] = useState(null) // 'basemap' | 'hazard' | 'aal' | 'sawah' | null
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          console.error('Failed to parse user from localStorage')
        }
      }
    }
  }, [])

  return (
    <aside className={`absolute left-0 top-0 h-full z-[2001] transition-all duration-500 ease-in-out flex
      ${darkMode ? 'bg-[#0D0F12]/95 backdrop-blur-xl border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)]' : 'bg-white border-r border-slate-200 shadow-2xl'}
      ${isSidebarOpen ? 'w-[280px]' : 'w-0'}`}>

      <div className="flex-1 flex flex-col h-full pt-[40px] relative overflow-hidden">
        {/* Header sidebar - Very compact */}
        <div className={`py-1 px-4 flex items-center justify-between border-b ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col min-w-0">
            <h2 className={`font-black text-[9.5px] tracking-[0.2em] leading-none uppercase ${darkMode ? 'text-blue-400' : 'text-[#1E5C9A]'}`}>
              Layer Selection
            </h2>
            <span className={`text-[6.5px] font-bold uppercase tracking-widest leading-none mt-0.5 ${darkMode ? 'text-blue-200/30' : 'text-blue-600/30'}`}>
              System Dashboard
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`p-1 rounded-lg transition-all ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <ChevronLeft size={14} strokeWidth={2.5} className="shrink-0" />
          </button>
        </div>

        {/* Content scroller */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

          {/* Base Map / Layer Selection Toggle */}
          <div className="px-1">
            <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 w-full backdrop-blur-md transition-all ${darkMode ? 'bg-white/[0.03] border-white/5 shadow-inner' : 'bg-white shadow-[0_2px_12px_rgb(0,0,0,0.05)] border-slate-100'
              }`}>
              {/* Left Icon with Settings Trigger */}
              <button
                onClick={(e) => { e.stopPropagation(); setOpenSettings(openSettings === 'basemap' ? null : 'basemap'); }}
                className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-lg cursor-pointer transition-all duration-300 ${openSettings === 'basemap' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : (darkMode ? 'text-gray-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50')}`}
                title="Basemap Opacity"
              >
                <SlidersHorizontal size={14} strokeWidth={2.5} />
              </button>

              {/* Layer Buttons */}
              <div className="flex gap-1 w-full">
                {[
                  { id: 'road', label: 'ROAD' },
                  { id: 'satellite', label: 'SAT' },
                  { id: 'terrain', label: 'TER' }
                ].map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => updateBaseLayer(layer.id)}
                    className={`px-1 py-1.5 text-[9px] font-black tracking-widest rounded-lg transition-all duration-300 flex-1
                      ${activeBaseLayer === layer.id
                        ? (darkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-slate-900 text-white shadow-sm')
                        : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')}`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Basemap Settings Dropdown */}
          <div className="relative flex justify-center w-full">
            {openSettings === 'basemap' && (
              <div className={`absolute top-0 z-[2010] p-3 rounded-xl border animate-in fade-in zoom-in-95 duration-200 mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
                } w-[200px]`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Opacity Basemap</span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{Math.round(opacityBasemap * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={opacityBasemap}
                  onChange={(e) => setOpacityBasemap(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            )}
          </div>

          {/* Hazard Section */}
          <section className="relative">
            <SectionTitle
              icon={AlertTriangle}
              onSettingsClick={() => setOpenSettings(openSettings === 'hazard' ? null : 'hazard')}
              isActive={openSettings === 'hazard'}
            >
              Hazard
            </SectionTitle>

            {openSettings === 'hazard' && (
              <div className={`absolute right-0 top-12 z-[2010] p-4 rounded-2xl border animate-in fade-in zoom-in-95 duration-200 w-56 ${darkMode ? 'bg-[#1A1D21] border-white/10 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'
                }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Opacity Layer</span>
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{Math.round(opacityHazard * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={opacityHazard}
                  onChange={(e) => setOpacityHazard(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'banjir', label: 'Banjir' },
                { id: 'earthquake', label: 'Gempa Bumi' },
                { id: 'tsunami', label: 'Tsunami' },
                { id: 'kekeringan', label: 'Kekeringan' },
              ].map(item => {
                const isActive = selectedGroup === item.id
                const showRpDropdown = isActive && !isSingleLayer && hazardGroupFiles.length > 0

                return (
                  <div key={item.id} className={`flex flex-col gap-2 ${showRpDropdown ? 'col-span-2' : ''}`}>
                    <RadioItem
                      label={item.label}
                      name="hazard"
                      value={item.id}
                      checked={isActive}
                      onChange={(val) => setSelectedGroup(isActive ? null : val)}
                    />

                    {showRpDropdown && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200 p-2 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <select
                          value={selectedRpId}
                          onChange={(e) => setSelectedRpId(e.target.value)}
                          className={`w-full text-[11px] font-bold py-2 px-3 rounded-lg border focus:outline-none appearance-none cursor-pointer transition-all ${darkMode
                            ? 'bg-transparent border-white/10 text-white'
                            : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
                        >
                          <option value="" disabled>Select Return Period</option>
                          {hazardGroupFiles.map(f => (
                            <option key={f.uniqueId} value={f.uniqueId} className={darkMode ? 'bg-[#1A1D21]' : ''}>
                              {f.displayLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              disabled={!selectedGroup || (hazardGroupFiles.length > 0 && !isSingleLayer && !selectedRpId)}
              onClick={() => setInfraLayers(prev => ({ ...prev, modelHazard: !prev.modelHazard }))}
              className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl border font-black text-[10px] tracking-widest uppercase transition-all duration-300 ${infraLayers.modelHazard && !!selectedGroup
                ? (darkMode ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-blue-400' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20')
                : (darkMode ? 'bg-white/[0.03] border-white/5 text-gray-500 hover:bg-white/[0.05]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100')
                } ${(!selectedGroup) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <Box size={14} />
              Visualisasi Model Hazard
            </button>
          </section>

          {/* Produk Section (AAL & Direct Loss) */}
          <section className="relative">
            <SectionTitle
              icon={BarChart3}
              onSettingsClick={() => setOpenSettings(openSettings === 'aal' ? null : 'aal')}
              isActive={openSettings === 'aal'}
            >
              Analisis Risiko
            </SectionTitle>

            {openSettings === 'aal' && (
              <div className={`absolute right-0 top-12 z-[2010] p-4 rounded-2xl border animate-in fade-in zoom-in-95 duration-200 w-56 ${darkMode ? 'bg-[#1A1D21] border-white/10 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'
                }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Opacity Boundary</span>
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{Math.round(opacityAAL * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={opacityAAL}
                  onChange={(e) => setOpacityAAL(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <CheckItem
                  label="Average Annual Loss (AAL)"
                  checked={infraLayers.aal && !!selectedGroup}
                  onChange={() => setInfraLayers(prev => ({ ...prev, aal: !prev.aal, directLoss: false }))}
                  disabled={!selectedGroup}
                  icon={BarChart3}
                />

                {infraLayers.aal && !!selectedGroup && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200 p-2 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <select
                      value={activeAalExposure}
                      onChange={(e) => setActiveAalExposure(e.target.value)}
                      className={`w-full text-[11px] font-bold py-2 px-3 rounded-lg border focus:outline-none appearance-none cursor-pointer transition-all ${darkMode
                        ? 'bg-[#1A1D21] border-white/10 text-white'
                        : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
                    >
                      <option value="total" className={darkMode ? 'bg-[#1A1D21]' : ''}>All Buildings</option>
                      <option value="fs" className={darkMode ? 'bg-[#1A1D21]' : ''}>Healthcare</option>
                      <option value="fd" className={darkMode ? 'bg-[#1A1D21]' : ''}>Educational</option>
                      <option value="electricity" className={darkMode ? 'bg-[#1A1D21]' : ''}>Electricity</option>
                      <option value="airport" className={darkMode ? 'bg-[#1A1D21]' : ''}>Airport</option>
                      <option value="hotel" className={darkMode ? 'bg-[#1A1D21]' : ''}>Hotel</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <CheckItem
                  label="Visualisasi Direct Loss"
                  checked={infraLayers.directLoss && !!selectedGroup}
                  onChange={() => setInfraLayers(prev => ({ ...prev, directLoss: !prev.directLoss, aal: false }))}
                  disabled={!selectedGroup}
                  icon={AlertTriangle}
                />

                {/* Drought year selector */}
                {selectedGroup === 'kekeringan' && infraLayers.directLoss && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">Tahun Exposure Sawah</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{ key: 'loss_2022', label: '2022' }, { key: 'loss_2025', label: '2025' }, { key: 'loss_2028', label: '2028' }].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setDroughtLossYear && setDroughtLossYear(key)}
                          className={`text-[10px] font-black py-1.5 rounded-lg border transition-all ${(droughtLossYear || 'loss_2022') === key
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                            : (darkMode ? 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10' : 'bg-white text-slate-400 border-slate-100')
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flood View Toggle & Year Selector */}
                {selectedGroup === 'banjir' && infraLayers.directLoss && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className={`p-1 rounded-xl border flex gap-1 ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <button
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${(floodView || 'building') === 'building'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : (darkMode ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-600')
                          }`}
                        onClick={() => setFloodView && setFloodView('building')}
                      >
                        BUILDING
                      </button>
                      <button
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${floodView === 'sawah'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : (darkMode ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-600')
                          }`}
                        onClick={() => setFloodView && setFloodView('sawah')}
                      >
                        RICE FIELD
                      </button>
                    </div>

                    {floodView === 'sawah' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">Tahun Sawah</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[{ key: 'loss_2022', label: '2022' }, { key: 'loss_2025', label: '2025' }, { key: 'loss_2028', label: '2028' }].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setFloodSawahYear && setFloodSawahYear(key)}
                              className={`text-[10px] font-black py-1.5 rounded-lg border transition-all ${(floodSawahYear || 'loss_2022') === key
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : (darkMode ? 'bg-white/5 text-gray-400 border-white/5 hover:border-white/10' : 'bg-white text-slate-400 border-slate-100')
                                }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedGroup && (
                <div className={`p-3 rounded-xl border border-dashed flex items-start gap-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <AlertTriangle size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-[9px] text-gray-400 font-bold leading-tight">
                    Pilih Hazard terlebih dahulu untuk melihat AAL / Direct Loss
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Exposure Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={Layout}>Exposure Layer</SectionTitle>
              {fetchingExposure && (
                <div className="w-3 h-3 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shrink-0 mb-3" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'healthcare', label: 'Healthcare Facilities' },
                { id: 'educational', label: 'Educational Facilities' },
                { id: 'electricity', label: 'Electricity' },
                { id: 'airport', label: 'Airport' },
                { id: 'hotel', label: 'Hotel' },
                { id: 'bmn', label: 'BMN' },
                { id: 'sawah', label: 'Rice Field' },
                { id: 'residential', label: 'Residential' },
              ].map(item => (
                <ExposureCard
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  active={item.id === 'sawah' ? !!selectedSawahYear : (infraLayers[item.id] || false)}
                  onClick={() => {
                    if (item.id === 'sawah') {
                      if (selectedSawahYear) {
                        setSelectedSawahYear('');
                      } else {
                        setSelectedSawahYear(sawahMetadata[0]?.year || '2025');
                      }
                    } else {
                      setInfraLayers(prev => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }));
                      if (setInitialExposureTab && !infraLayers[item.id]) {
                        setInitialExposureTab(item.id);
                      }
                    }
                  }}
                />
              ))}
            </div>

            {selectedSawahYear && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600/60'}`}>Select Year</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenSettings(openSettings === 'sawah' ? null : 'sawah'); }}
                    className={`p-1.5 rounded-lg transition-all ${openSettings === 'sawah' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5'}`}
                  >
                    <SlidersHorizontal size={14} strokeWidth={2.5} />
                  </button>
                </div>

                {openSettings === 'sawah' && (
                  <div className={`mb-3 p-3 rounded-xl border ${darkMode ? 'bg-[#1A1D21] border-white/10' : 'bg-white border-emerald-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[9px] font-bold ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Opacity Sawah</span>
                      <span className="text-[10px] font-black text-emerald-500">{Math.round(opacitySawah * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={opacitySawah}
                      onChange={(e) => setOpacitySawah(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                )}

                <div className="relative">
                  <select
                    value={selectedSawahYear}
                    onChange={(e) => setSelectedSawahYear(e.target.value)}
                    className={`w-full text-[11px] font-bold py-2 px-3 rounded-xl border focus:outline-none appearance-none cursor-pointer transition-all ${darkMode ? 'bg-[#1A1D21] border-white/10 text-white' : 'bg-white border-emerald-100 text-slate-700'
                      }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}
                  >
                    {sawahMetadata.map(s => (
                      <option key={s.year} value={s.year} className={darkMode ? 'bg-[#1A1D21]' : ''}>Year {s.year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Administratif Section */}
          <section className="relative">
            <SectionTitle icon={Database}>BATAS ADMINISTRASI</SectionTitle>
            <div className="space-y-2">
              <CheckItem
                label="Batas Kota / Kabupaten"
                checked={infraLayers.boundaries || false}
                onChange={() => setInfraLayers(prev => ({ ...prev, boundaries: !prev.boundaries }))}
                icon={Plus}
              />
            </div>
          </section>

          {/* Manajemen Data Section */}
          <section className={`pt-4 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <SectionTitle icon={Layout}>MANAJEMEN DATA</SectionTitle>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <button
                onClick={onOpenHSBGN}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Database size={14} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[11px] font-black tracking-tight ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Manajemen HSBGN</span>
                </div>
                <ArrowRight size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>

              {onOpenBangunan && (
                <button
                  onClick={onOpenBangunan}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Home size={14} strokeWidth={2.5} />
                    </div>
                    <span className={`text-[11px] font-black tracking-tight ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Manajemen Bangunan</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              )}

              {/* Download Data Section */}
              <button
                onClick={() => onOpenDownload('building')}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Download size={14} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[11px] font-black tracking-tight ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Download Data</span>
                </div>
                <ArrowRight size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
