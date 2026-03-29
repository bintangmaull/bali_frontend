import Header from '../components/Header'
import { Facebook, Instagram, Twitter, Globe } from "lucide-react";
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <Header />

      {/* Background Image Layer */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#0D0F12]">
        {/* The Image - Cinematic Refinement */}
        <img 
          src="/itb1%20(1).png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 dark:opacity-20 grayscale blur-[2px] scale-105" 
        />
        
        {/* Deep Gradient Overlays for Premium Cinematic Feel */}
        <div className={`absolute inset-0 transition-colors duration-300 ${
          darkMode ? 'bg-gradient-to-b from-[#0D0F12]/80 via-[#0D0F12]/60 to-[#0D0F12]' : 'bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-slate-50'
        }`} />
        
        {/* Subtle Radial Glow to focus the center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(13,15,18,0.4)_100%)]" />
      </div>

      {/* Main content pushed below fixed header */}
      <main className="min-h-screen flex flex-col pt-16 md:pt-20">
        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative">
          <div className="max-w-6xl w-full text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 flex flex-col items-center">
            {/* Institution Logos */}
            <div className="flex justify-center items-center gap-6 mb-2 scale-90 md:scale-100">
              <img src="/logoitb.png" alt="ITB Logo" className="h-8 md:h-10 w-auto object-contain brightness-110" />
              <img src="/logobali.png" alt="Bali Logo" className="h-8 md:h-10 w-auto object-contain brightness-110" />
            </div>

            {/* Badge */}
            <div className="flex justify-center">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                darkMode ? 'bg-[#1E5C9A]/10 text-[#1E5C9A] border border-[#1E5C9A]/20' : 'bg-[#1E5C9A]/5 text-[#1E5C9A] border border-[#1E5C9A]/10'
              }`}>
                Provinsi Bali • Analisis Risiko Multi-Bencana
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold font-[Outfit, sans-serif] tracking-tight leading-tight transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Selamat Datang di <span className="text-[#1E5C9A]">Bali Multi-Hazard</span> Risk Dashboard
            </h1>
            
            <div className={`space-y-4 max-w-5xl mx-auto text-center text-xs md:text-base font-medium leading-relaxed transition-colors duration-300 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <p>
                Dashboard ini dikembangkan untuk menyajikan analisis risiko bencana di Provinsi Bali melalui pendekatan 
                <span className="text-[#1E5C9A] font-bold"> catastrophe modeling </span> 
                yang mengintegrasikan komponen hazard, exposure, dan vulnerability.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <div className={`p-3 rounded-xl border transition-all ${
                  darkMode ? 'bg-slate-900/40 border-slate-700 text-slate-400' : 'bg-white/60 border-slate-200 text-slate-500 shadow-sm backdrop-blur-sm'
                }`}>
                  <p className="text-[10px] md:text-xs">Mencakup berbagai bencana utama: <strong>Gempa Bumi, Banjir, Tsunami, dan Kekeringan.</strong></p>
                </div>
                <div className={`p-3 rounded-xl border transition-all ${
                  darkMode ? 'bg-slate-900/40 border-slate-700 text-slate-400' : 'bg-white/60 border-slate-200 text-slate-500 shadow-sm backdrop-blur-sm'
                }`}>
                  <p className="text-[10px] md:text-xs">Estimasi kerugian ekonomi disajikan melalui metrik <strong>Average Annual Loss (AAL)</strong> dan <strong>Probable Maximum Loss (PML).</strong></p>
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-80">
                Dashboard ini bertujuan untuk memberikan gambaran komprehensif serta mendukung pengambilan keputusan berbasis data dalam perencanaan mitigasi.
              </p>
            </div>

            <div className="pt-4 relative">
              <p className={`text-lg md:text-xl font-black italic font-[Outfit, sans-serif] transition-colors duration-300 ${
                darkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                “Memahami risiko untuk mendukung mitigasi yang lebih efektif.”
              </p>
              <div className="h-0.5 w-12 bg-[#1E5C9A] mx-auto mt-3 rounded-full" />
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <a
                href="/calculation"
                className="group relative px-6 py-2.5 bg-[#1E5C9A] text-white rounded-xl font-bold text-sm hover:bg-[#2F6FAF] shadow-lg shadow-[#1E5C9A]/20 transition-all transform hover:scale-105 active:scale-95"
              >
                Our Product
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={`py-8 border-t transition-colors duration-300 ${
          darkMode ? 'bg-[#0D0F12]/80 border-slate-800' : 'bg-white/80 border-slate-100 backdrop-blur-sm'
        }`}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col items-center md:items-start space-y-1">
                <span className={`text-base font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                   Bali <span className="text-[#1E5C9A]">Risk Dashboard</span>
                </span>
                <p className={`text-[9px] font-bold leading-none ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                   © {new Date().getFullYear()} Bali Multi-Hazard Risk Dashboard.
                </p>
              </div>

              <div className="flex gap-4">
                {[Facebook, Instagram, Twitter, Globe].map((Icon, idx) => (
                  <a key={idx} href="#" className={`p-2 rounded-lg transition-all border ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white' 
                             : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm'
                  }`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </a>
                ))}
              </div>

              <div className={`text-[8px] uppercase tracking-[0.2em] font-black ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>
                All Rights Reserved
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
