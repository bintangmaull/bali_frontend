// components/LayerServices.js
import React from 'react'
import { ChevronLeft, Layers, SlidersHorizontal } from 'lucide-react'

const SectionTitle = ({ children, onSettingsClick, isActive }) => (
  <div className="flex items-center justify-between mt-1 mb-2">
    <h3 className="text-gray-400 text-[9px] font-bold tracking-[0.1em] uppercase">
      {children}
    </h3>
    {onSettingsClick && (
      <button 
        onClick={(e) => { e.stopPropagation(); onSettingsClick(); }}
        className={`p-1 rounded-full transition-colors flex-shrink-0 ${isActive ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-orange-500 hover:bg-orange-50'}`}
        title={`Atur Opacity Layer ${typeof children === 'string' ? children : ''}`}
      >
        <SlidersHorizontal size={14} strokeWidth={2.5} />
      </button>
    )}
  </div>
)

const RadioItem = ({ label, name, value, checked, onChange }) => (
  <div className="flex items-center justify-between group py-0.5 w-full">
    <div 
      className="flex items-center gap-2.5 cursor-pointer flex-1"
      onClick={() => onChange(value)}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          readOnly
          className="sr-only"
        />
        <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex-shrink-0
          ${checked ? 'border-orange-500' : 'border-gray-200 group-hover:border-gray-300'}`} />
        {checked && <div className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 animate-in fade-in zoom-in duration-200 flex-shrink-0" />}
      </div>
      <span className={`text-[12px] transition-colors duration-200 truncate
        ${checked ? 'text-gray-800 font-medium' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {label}
      </span>
    </div>
  </div>
)

const CheckItem = ({ label, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between group py-0.5 w-full ${disabled ? 'opacity-50' : ''}`}>
    <label className={`flex items-center gap-2.5 flex-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-3.5 h-3.5 rounded border transition-all duration-200 flex-shrink-0
          ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}
          ${!disabled && !checked ? 'group-hover:border-gray-300' : ''}`} />
        {checked && (
          <svg className="absolute w-3 h-3 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-[12px] transition-colors duration-200 truncate
        ${checked ? 'text-gray-800 font-medium' : 'text-gray-400'}
        ${!disabled && !checked ? 'group-hover:text-gray-600' : ''}`}>
        {label}
      </span>
    </label>
  </div>
)

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
  onOpenHSBGN,
  onOpenBangunan
}) {
  const [openSettings, setOpenSettings] = React.useState(null) // 'basemap' | 'hazard' | 'aal' | null

  return (
    <aside className={`absolute left-0 top-0 h-full z-[2001] bg-white shadow-2xl transition-all duration-500 ease-in-out flex
      ${isSidebarOpen ? 'w-[260px]' : 'w-0'}`}>
      
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header sidebar */}
        <div className="bg-white border-b border-gray-100 p-3 flex items-center justify-between">
          <div>
            <h2 className="text-gray-800 text-[15px] font-bold tracking-tight">Layer Selection</h2>
            <p className="text-gray-400 text-[8px] mt-0.5 uppercase tracking-wider">Map Configuration</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 p-1.5 hover:bg-gray-50 hover:text-gray-600 rounded-full transition-all"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Content scroller */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-orange-200">
          
          {/* Base Map / Layer Selection Toggle */}
          <div className="flex justify-center mb-1 mt-1 px-1">
            <div className="bg-white/95 backdrop-blur-sm p-1 rounded-full shadow-[0_2px_12px_rgb(0,0,0,0.1)] border border-slate-100/50 flex items-center gap-1 w-full max-w-[210px]">
              {/* Left Icon with Settings Trigger */}
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenSettings(openSettings === 'basemap' ? null : 'basemap'); }}
                className={`w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-full ml-0.5 cursor-pointer transition-colors ${openSettings === 'basemap' ? 'text-orange-500 bg-orange-50' : 'text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
                title="Atur Opacity Basemap"
              >
                <SlidersHorizontal size={14} strokeWidth={2.5} />
              </button>
              
              {/* Layer Buttons */}
              <div className="flex gap-0.5 pr-1 w-full justify-between">
                {[
                  { id: 'road', label: 'ROAD' },
                  { id: 'satellite', label: 'SATELLITE' },
                  { id: 'terrain', label: 'TERRAIN' }
                ].map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => updateBaseLayer(layer.id)}
                    className={`px-2 py-1 text-[8.5px] font-extrabold tracking-wider rounded-full transition-all duration-300 flex-1
                      ${activeBaseLayer === layer.id 
                        ? 'bg-[#1e293b] text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
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
              <div className="absolute top-0 z-[2010] bg-white p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 w-[200px] animate-in fade-in zoom-in-95 duration-200 mt-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-700">Opacity Basemap</span>
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
          <section className="relative mt-2">
            <SectionTitle 
              onSettingsClick={() => setOpenSettings(openSettings === 'hazard' ? null : 'hazard')}
              isActive={openSettings === 'hazard'}
            >
              Hazard
            </SectionTitle>
            
            {openSettings === 'hazard' && (
              <div className="absolute right-0 top-8 z-[2010] bg-white p-3 rounded-xl shadow-lg border border-slate-100 w-48 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-700">Opacity Layer Hazard</span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{Math.round(opacityHazard * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={opacityHazard} 
                  onChange={(e) => setOpacityHazard(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="text-[8px] text-gray-400 italic text-left mt-2.5 mb-0.5">*Langsung diterapkan ke peta</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-3">
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
                      <div className="ml-7 animate-in fade-in slide-in-from-top-1 duration-200">
                        <select
                          value={selectedRpId}
                          onChange={(e) => setSelectedRpId(e.target.value)}
                          className="w-full bg-orange-50 text-orange-700 text-[11px] font-semibold py-1 px-2 rounded border border-orange-200 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer shadow-sm"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f97316' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '10px' }}
                        >
                          <option value="" disabled className="text-gray-400">Pilih Return Period...</option>
                          {hazardGroupFiles.map(f => (
                            <option key={f.uniqueId} value={f.uniqueId}>
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

            <div className="pt-1">
              <CheckItem
                label="Visualisasi Model Hazard"
                checked={infraLayers.modelHazard && !!selectedGroup}
                onChange={() => setInfraLayers(prev => ({ ...prev, modelHazard: !prev.modelHazard }))}
                disabled={!selectedGroup || (hazardGroupFiles.length > 0 && !isSingleLayer && !selectedRpId)}
              />
            </div>
          </section>

          {/* Produk Section */}
          <section className="relative mt-2">
            <SectionTitle 
              onSettingsClick={() => setOpenSettings(openSettings === 'aal' ? null : 'aal')}
              isActive={openSettings === 'aal'}
            >
              Produk
            </SectionTitle>

            {openSettings === 'aal' && (
              <div className="absolute right-0 top-8 z-[2010] bg-white p-3 rounded-xl shadow-lg border border-slate-100 w-48 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-700">Opacity Layer Boundary</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round(opacityAAL * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={opacityAAL} 
                  onChange={(e) => setOpacityAAL(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="text-[8px] text-gray-400 italic text-left mt-2.5 mb-0.5">*Langsung diterapkan ke peta</div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between mt-2">
                <CheckItem
                  label="Visualisasi AAL"
                  checked={infraLayers.aal && !!selectedGroup}
                  onChange={() => setInfraLayers(prev => ({ ...prev, aal: !prev.aal, directLoss: false }))}
                  disabled={!selectedGroup}
                />
                
                {infraLayers.aal && !!selectedGroup && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                    <select
                      value={activeAalExposure}
                      onChange={(e) => setActiveAalExposure(e.target.value)}
                      className="bg-orange-50 text-orange-700 text-[10px] font-semibold py-1 px-2 pr-6 rounded border border-orange-200 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer shadow-sm min-w-[120px]"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f97316' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '10px' }}
                    >
                      <option value="total">All Buildings</option>
                      <option value="fs">Healthcare</option>
                      <option value="fd">Educational</option>
                      <option value="electricity">Electricity</option>
                      <option value="airport">Airport</option>
                      <option value="hotel">Hotel</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <CheckItem
                  label="Visualisasi Direct Loss"
                  checked={infraLayers.directLoss && !!selectedGroup}
                  onChange={() => setInfraLayers(prev => ({ ...prev, directLoss: !prev.directLoss, aal: false }))}
                  disabled={!selectedGroup}
                />
              </div>
              {!selectedGroup && (
                <p className="text-[9px] text-gray-400 italic ml-6 leading-tight mt-1.5">
                  *Pilih Hazard terlebih dahulu untuk melihat AAL / Direct Loss
                </p>
              )}
            </div>
          </section>

          {/* Eksposur Section */}
          <section>
            <div className="flex items-center gap-2">
              <SectionTitle>Eksposur</SectionTitle>
              {fetchingExposure && (
                <div className="w-3 h-3 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-1" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-2">
              {[
                { id: 'healthcare', label: 'Healthcare' },
                { id: 'educational', label: 'Educational' },
                { id: 'electricity', label: 'Electricity' },
                { id: 'airport', label: 'Airport' },
                { id: 'hotel', label: 'Hotel' },
              ].map(item => (
                <CheckItem
                  key={item.id}
                  label={item.label}
                  checked={infraLayers[item.id] || false}
                  onChange={() => {
                    setInfraLayers(prev => ({
                      ...prev,
                      [item.id]: !prev[item.id]
                    }));
                    if (setInitialExposureTab && !infraLayers[item.id]) {
                      setInitialExposureTab(item.id);
                    }
                  }}
                />
              ))}
            </div>
          </section>

          {/* Administratif Section */}
          <section>
            <SectionTitle>Administratif</SectionTitle>
            <div className="space-y-3 mt-2">
              <CheckItem
                label="Batas Kota/Kabupaten"
                checked={infraLayers.boundaries || false}
                onChange={() => setInfraLayers(prev => ({ ...prev, boundaries: !prev.boundaries }))}
              />
            </div>
          </section>

          {/* Manajemen Data Section */}
          <section className="mt-4 border-t border-gray-100 pt-3 mb-4">
            <SectionTitle>Manajemen Data</SectionTitle>
            <div className="space-y-2.5 mt-3 flex flex-col items-center">
              <button
                onClick={onOpenHSBGN}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-1.5 px-3 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Layers size={14} />
                Manajemen HSBGN
              </button>
              
              {onOpenBangunan && (
                <button
                  onClick={onOpenBangunan}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-1.5 px-3 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Layers size={14} />
                  Manajemen Bangunan
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
