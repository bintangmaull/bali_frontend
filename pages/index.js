// pages/index.js
import Header from '../components/Header'
import Image from 'next/image'
import { Facebook, Instagram, Twitter, Globe } from "lucide-react";
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-800 bg-gray-100'}`}>
      <Header />

      {/* Main content pushed below fixed header */}
      <main className="pt-25 relative h-screen flex flex-col">
        {/* Background wrapper */}
        <div className="absolute inset-0 h-full w-full -z-10">
          <Image
            src="/coverbangunan.svg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gelap di dark mode, terang semi-transparan di light mode */}
          <div
            className={`absolute inset-0 transition-colors duration-300 ${darkMode ? 'bg-[#0D0F12]/80' : 'bg-white/70'
              }`}
          />
        </div>

        {/* Hero & CTA */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl text-center space-y-6">
            <h1 className={`text-4xl md:text-6xl font-semibold font-[SF Pro] transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Selamat datang di CardinAAL
            </h1>
            <div className="space-y-4">
              <p className={`text-lg font-[SF Pro] transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                CardinAAL merupakan sebuah dashboard yang dirancang untuk membantu menghitung kerugian tahunan rata-rata (Average Annual Loss)
                dan kerugian langsung (Direct Loss) yang disebabkan oleh kejadian bencana alam berupa gempa bumi, banjir, tanah longsor, dan
                letusan gunung api di Indonesia.
              </p>
              <p className={`text-lg font-[SF Pro] italic transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                "Menghitung kerugian tahunan guna menyusun strategi mitigasi bencana yang baik."
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/calculation"
                className="px-6 py-3 bg-[#1fdfc2] text-black rounded-full font-[SF Pro] hover:bg-[#A8D600] transition"
              >
                Lihat Kalkulasi
              </a>
              <a
                href="/data"
                className={`px-6 py-3 rounded-full font-[SF Pro] transition border ${darkMode
                    ? 'border-gray-500 text-gray-300 hover:border-white hover:text-white'
                    : 'border-gray-700 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                  }`}
              >
                Manajemen Data
              </a>
            </div>
          </div>
        </div>

        {/* Footer-like info */}
        <div className="py-6">
          <div className="max-w-4xl mx-auto text-center space-y-6 px-4">

            {/* Ikon sosial */}
            <div className="flex justify-center gap-6">
              <a
                href=""
                className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
              <a
                href=""
                className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href=""
                className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
                aria-label="Twitter"
              >
                <Twitter size={24} />
              </a>
              <a
                href=""
                className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
                aria-label="Website"
              >
                <Globe size={24} />
              </a>
            </div>

            {/* Hak cipta */}
            <p className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
              © {new Date().getFullYear()} CardinAAL. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
