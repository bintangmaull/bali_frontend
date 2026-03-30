// pages/about.js
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'

const leadership = [
  {
    name: 'Oloan Yesmando Nainggolan',
    role: '15121020',
    imageUrl: '/oloan.svg',
  },
  {
    name: 'Celine Deandra Romandiza',
    role: '15121032',
    imageUrl: '/celine.svg',
  },
  {
    name: 'Bintang Maulana Magribi',
    role: '15121039',
    imageUrl: '/bintang.svg',
  },
  {
    name: 'Fortuna Mahardikasuci',
    role: '15121055',
    imageUrl: '/fortuna.svg',
  },
]

export default function About() {
  const { darkMode } = useTheme()

  const researchTeam = [
    'Prof. Dr. Irwan Meilano, S.T., M.Sc.',
    'Prof. Sapto Wahyu Indratno, S.Si., M.Sc., Ph.D.',
    'Dr. Rio Raharja, S.T., M.T.',
    'Dr. Fiza Wira Atmaja, S.Si., M.B.A.',
    'Ricky Jaya Kusuma, S.T., M.T.',
    'Zidane Luthfi Salim, S.T., M.T.',
    'Dinda Puspa Vidya, S.T.',
    'Farah Diba Aulia Yasmin, S.T.',
    'Bintang Maulana Magribi, S.T.'
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${darkMode ? 'bg-[#040608] text-gray-200' : 'bg-slate-50 text-gray-800'}`}>
      <Header />

      {/* Background Decor (Matching Index.js) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-600' : 'bg-blue-200'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 ${darkMode ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-[0.03] ${darkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20 md:pt-36 flex flex-col items-center">
        <div className="w-full flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">

          {/* Header Section */}
          <section className="text-center space-y-6 max-w-5xl">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase leading-none">Visi & Misi • Dashboard Risiko</span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Us</span>
            </h1>
            <p className={`text-sm md:text-base leading-relaxed text-center italic opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Bali Multi-Hazard Risk Dashboard dikembangkan berdasarkan penelitian catastrophe modelling yang berfokus pada analisis risiko bencana di Provinsi Bali.
            </p>
          </section>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {/* Leadership Box */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.02] flex flex-col justify-center ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 shadow-xl'
              }`}>
              <div className="h-10 w-10 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-xl">🏛️</span>
              </div>
              <h3 className={`text-lg font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Leadership & Research</h3>
              <p className="text-xs md:text-sm leading-relaxed opacity-90">
                Penelitian ini dipimpin oleh <strong>Dr. Riantini Virtriana</strong> sebagai Associate Professor di bidang Disaster Risk Assessment, Fakultas Ilmu dan Teknologi Kebumian, Institut Teknologi Bandung.
              </p>
            </div>

            {/* Methodology Box */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.02] flex flex-col justify-center ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 shadow-xl'
              }`}>
              <div className="h-10 w-10 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-xl">📊</span>
              </div>
              <h3 className={`text-lg font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Methodology</h3>
              <p className="text-xs md:text-sm leading-relaxed opacity-90">
                Studi ini mengintegrasikan pemodelan hazard, data exposure, serta kurva vulnerability untuk mengestimasi dampak dan kerugian finansial akibat bencana alam.
              </p>
            </div>
          </div>

          {/* Research Team Section */}
          <section className="w-full max-w-5xl space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Research Team</h2>
              <div className="h-1 w-20 bg-blue-600 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {researchTeam.map((member, index) => (
                <div key={index} className={`group px-6 py-5 rounded-[1.5rem] border transition-all duration-300 flex items-center gap-4 ${darkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-blue-600/10 hover:border-blue-500/40' : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:shadow-md hover:border-blue-200'
                  }`}>
                  <div className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                  <span className="text-xs md:text-sm font-bold tracking-tight">{member}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Mission Conclusion */}
          <section className={`w-full max-w-4xl p-10 rounded-[3rem] border transition-all text-center relative overflow-hidden group ${darkMode ? 'bg-blue-600/5 border-blue-500/20' : 'bg-blue-50 border-blue-100 shadow-inner'
            }`}>
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <p className={`text-sm md:text-base leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-blue-900'}`}>
                Dashboard ini merupakan platform visualisasi interaktif untuk mendukung pemahaman risiko bencana serta pengambilan keputusan berbasis data di Provinsi Bali.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="h-[1px] w-12 bg-blue-500/30" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Project Mission</span>
                <div className={`h-[1px] w-12 bg-blue-500/30`} />
              </div>
            </div>
            {/* Soft decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700" />
          </section>

        </div>
      </main>
    </div>
  )
}
