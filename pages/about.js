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
    <div className={`min-h-screen transition-colors duration-300 relative ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <Header />

      {/* Background Image Layer (Matching Index.js) */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#0D0F12]">
        <img 
          src="/itb1%20(1).png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 dark:opacity-20 grayscale blur-[2px] scale-105" 
        />
        <div className={`absolute inset-0 transition-colors duration-300 ${
          darkMode ? 'bg-gradient-to-b from-[#0D0F12]/80 via-[#0D0F12]/60 to-[#0D0F12]' : 'bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-slate-50'
        }`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(13,15,18,0.4)_100%)]" />
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 md:pt-32 pb-12">
        <div className="max-w-4xl w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Header Section */}
          <section className="space-y-6 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold font-[Outfit, sans-serif] text-[#1E5C9A] transition-colors duration-300">
              About Us
            </h1>
            <p className={`text-sm md:text-base leading-relaxed text-justify transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <strong>Bali Multi-Hazard Risk Dashboard</strong> dikembangkan berdasarkan penelitian 
              <span className="text-[#1E5C9A] font-bold"> catastrophe modeling </span> 
              yang berfokus pada analisis risiko bencana di Provinsi Bali. Studi ini mengintegrasikan pemodelan hazard, data exposure, serta kurva vulnerability untuk mengestimasi dampak dan kerugian akibat berbagai jenis bencana alam.
            </p>
          </section>

          {/* Leadership Section */}
          <section className={`p-8 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/40 border-slate-700 shadow-xl' : 'bg-white/60 border-slate-200 shadow-lg backdrop-blur-sm'
          }`}>
            <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Penelitian ini dipimpin oleh <strong>Dr. Riantini Virtriana</strong> sebagai Associate Professor di bidang Disaster Risk Assessment, Fakultas Ilmu dan Teknologi Kebumian, Institut Teknologi Bandung.
            </p>
          </section>

          {/* Team Section */}
          <section className="space-y-6">
            <h2 className={`text-xl font-bold transition-all border-l-4 border-[#1E5C9A] pl-4 py-1 ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Tim Penelitian
            </h2>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Tim penelitian terdiri dari akademisi dan peneliti dengan keahlian di bidang kebencanaan, geospasial, dan analisis risiko, yaitu:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {researchTeam.map((member, index) => (
                <div key={index} className={`px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  darkMode ? 'bg-slate-900/20 border-slate-800 text-slate-300 hover:border-[#1E5C9A]/50 hover:bg-slate-900/40' : 'bg-white/40 border-slate-100 text-slate-700 hover:border-blue-200 hover:bg-white/60'
                }`}>
                  {member}
                </div>
              ))}
            </div>
          </section>

          {/* Mission Conclusion */}
          <section className={`p-6 rounded-2xl border transition-all text-center italic ${
            darkMode ? 'bg-blue-900/10 border-[#1E5C9A]/20 text-slate-400' : 'bg-blue-50 border-blue-100 text-[#1E5C9A]'
          }`}>
            <p className="text-xs md:text-sm leading-relaxed">
              Dashboard ini merupakan bentuk pengembangan dari hasil penelitian tersebut ke dalam platform visualisasi interaktif, 
              dengan tujuan untuk mendukung pemahaman risiko bencana serta pengambilan keputusan berbasis data dalam upaya mitigasi dan pengurangan risiko.
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
