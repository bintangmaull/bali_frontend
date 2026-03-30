import Header from '../components/Header'
import { Facebook, Instagram, Twitter, Globe, ArrowRight, FileText, Activity, ShieldCheck, Map as MapIcon } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'next/router';

export default function Home() {
  const { darkMode } = useTheme();
  const router = useRouter();

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${darkMode ? 'bg-[#040608] text-gray-200' : 'bg-slate-50 text-gray-800'}`}>
      <Header />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-600' : 'bg-blue-200'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 ${darkMode ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-[0.03] ${darkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20 md:pt-36 flex flex-col items-center text-center">
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 flex flex-col items-center w-full">

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase leading-none">Provinsi Bali • Analisis Risiko Multi-Bencana</span>
          </div>

          <div className="space-y-6 max-w-5xl">
            <h1 className={`text-3xl md:text-4xl lg:text-4xl font-black tracking-tighter leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Bali Multi-Hazard</span> Risk Dashboard
            </h1>
            <p className={`text-sm md:text-base max-w-3xl mx-auto leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Dashboard ini dikembangkan untuk menyajikan analisis risiko bencana di Provinsi Bali melalui pendekatan
              <span className="font-bold text-blue-500"> catastrophe modelling </span>
              yang mengintegrasikan komponen hazard, exposure, dan vulnerability.
            </p>
          </div>

          {/* Feature Highlight Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl pt-4">
            <div className={`p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 shadow-xl'
              }`}>
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Activity size={20} className="text-blue-500" />
              </div>
              <p className="text-sm md:text-base leading-relaxed font-semibold mb-2">Multi-Hazard Analysis</p>
              <p className="text-xs opacity-70">Gempa Bumi, Banjir, Tsunami, dan Kekeringan secara komprehensif.</p>
            </div>
            <div className={`p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 shadow-xl'
              }`}>
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <ShieldCheck size={20} className="text-blue-500" />
              </div>
              <p className="text-sm md:text-base leading-relaxed font-semibold mb-2">Economic Loss Estimations</p>
              <p className="text-xs opacity-70">Perhitungan metrik Average Annual Loss (AAL) dan Probable Maximum Loss (PML).</p>
            </div>
          </div>

          {/* Mission Quote */}
          <div className="flex flex-col items-center pt-8 space-y-4">
            <p className={`text-xl md:text-3xl font-black italic tracking-tighter ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>
              “Memahami risiko untuk mendukung mitigasi yang lebih efektif.”
            </p>
            <div className="h-1 w-24 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <p className={`text-[10px] md:text-xs opacity-60 max-w-xl leading-relaxed italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              Mendukung pengambilan keputusan berbasis data dalam perencanaan mitigasi di Provinsi Bali.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-10">
            <button
              onClick={() => router.push('/peta')}
              className="group flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-base hover:bg-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all transform hover:scale-105 active:scale-95"
            >
              Our Product
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/about')}
              className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-base border transition-all transform hover:scale-105 active:scale-95 ${darkMode
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-lg'
                }`}
            >
              <FileText size={20} />
              About Us
            </button>
          </div>
        </div>
      </main>

      {/* Social Footer Section */}
      <footer className={`py-10 border-t ${darkMode ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Bali <span className="text-blue-500">Risk Dashboard</span>
            </span>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Bali Multi-Hazard Risk Dashboard. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            {[Facebook, Instagram, Twitter, Globe].map((Icon, idx) => (
              <a key={idx} href="#" className={`p-3 rounded-xl transition-all border ${darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 shadow-sm'
                }`}>
                <Icon size={20} strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
