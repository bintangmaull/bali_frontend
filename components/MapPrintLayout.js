import React from 'react';
import { Compass, Info, Map as MapIcon, Database, Layers } from 'lucide-react';

const MapPrintLayout = ({ mapImage, activeLayers, selectedGroup, darkMode }) => {
  const timestamp = new Date().toLocaleString('id-ID');
  
  return (
    <div 
      id="map-print-layout"
      className="bg-white text-slate-900 p-8 flex flex-col gap-4 font-sans"
      style={{ width: '1200px', minHeight: '800px', position: 'fixed', top: '-9999px', left: '-9999px' }}
    >
      {/* Header */}
      <div className="flex border-4 border-slate-900 p-4 justify-between items-center bg-slate-50">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Peta Risiko Multi-Bahaya</h1>
          <h2 className="text-xl font-bold text-slate-600 uppercase">Provinsi Bali, Indonesia</h2>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="bg-slate-900 text-white px-3 py-1 text-xs font-black uppercase tracking-widest mb-1">
            Bali Dashboard
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
            Generated: {timestamp}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex flex-1 gap-4 min-h-[600px]">
        {/* Left: Map Area */}
        <div className="flex-[3] border-4 border-slate-900 relative overflow-hidden bg-slate-100 flex items-center justify-center">
          {mapImage ? (
            <img src={mapImage} alt="Map Capture" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <MapIcon size={48} />
              <span className="font-bold uppercase tracking-widest text-xs">Map Content Area</span>
            </div>
          )}
          
          {/* Grid Lines Overlay (Decorative) */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Right: Legend & Metadata Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* North Arrow & Scale Box */}
          <div className="border-4 border-slate-900 p-4 flex flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <Compass size={60} strokeWidth={1.5} className="text-slate-900" />
              <span className="absolute top-0 font-black text-lg">U</span>
            </div>
            <div className="w-full flex flex-col items-center gap-1">
              <div className="w-full h-2 border-x-2 border-b-2 border-slate-900 relative">
                 <div className="absolute top-0 left-0 w-1/2 h-full bg-slate-900"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Skala Baris - Referensi Saja</span>
            </div>
          </div>

          {/* Legend Area */}
          <div className="border-4 border-slate-900 p-4 flex-1 flex flex-col gap-3 bg-white">
            <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 pb-1 mb-1">Legenda</h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">Tingkat Risiko</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-red-600 border border-slate-900"></div>
                  <span className="text-[9px] font-bold uppercase">Risiko Tinggi / Danger</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-orange-500 border border-slate-900"></div>
                  <span className="text-[9px] font-bold uppercase">Risiko Sedang / Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-yellow-400 border border-slate-900"></div>
                  <span className="text-[9px] font-bold uppercase">Risiko Rendah / Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-blue-500 border border-slate-900"></div>
                  <span className="text-[9px] font-bold uppercase">Area Terdampak Banjir</span>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">Skenario Aktif</span>
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border border-slate-200">
                  <Layers size={12} />
                  <span className="text-[9px] font-black uppercase">{selectedGroup ? selectedGroup.toUpperCase() : 'MULTI-HAZARD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sources Area */}
          <div className="border-4 border-slate-900 p-3 bg-slate-50 text-[8px] leading-tight font-medium flex flex-col gap-1">
            <h4 className="font-black uppercase tracking-widest mb-1 text-[9px]">Sumber Data:</h4>
            <p>1. Peta Rupa Bumi Indonesia Digital Skala 1:25.000</p>
            <p>2. Analisis Risiko Multi-Bahaya Bali Capstone Project 2026</p>
            <p>3. Data Inpres & InaRisk BNPB</p>
            <p>4. Citra Satelit Landsat 8/9 Operasional</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-4 border-slate-900 p-3 bg-slate-900 text-white flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">PT JSCORP AAL INDONESIA</span>
        <div className="flex items-center gap-4 text-[9px] font-bold opacity-80">
          <span>Sistem Informasi Geografis</span>
          <span className="w-1 h-1 bg-white rounded-full"></span>
          <span>Analisis Dampak Lingkungan</span>
        </div>
      </div>
    </div>
  );
};

export default MapPrintLayout;
