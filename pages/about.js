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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0D0F12] text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      <Header />

      <main className="max-w-screen mx-auto py-10 px-6 space-y-12 mt-18">
        <div className="mx-auto max-w-7xl">
          {/* Intro */}
          <div className="w-full mb-12">
            <h1 className="text-4xl font-semibold text-[#ff6a00]">
              Capstone AAL
            </h1>
            <p className={`mt-4 text-lg text-justify transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              CardinAAL dikembangkan oleh tim yang terdiri dari mahasiswa Program Studi Teknik
              Geodesi dan Geomatika 2021 Institut Teknologi Bandung untuk memenuhi SKS mata kuliah GD4201 Capstone Project.
              Selain itu, mahasiswa juga berkolaborasi dengan dosen pembimbing untuk membantu memberikan masukan dan arahan dalam pengembangan
              dashboard ini.
              Kami berkomitmen untuk membangun dashboard yang berguna dan mudah digunakan untuk
              menghitung kerugian tahunan rata-rata (Average Annual Loss) dan kerugian langsung (Direct Loss)
              akibat bencana alam yang disebabkan oleh gempa bumi, banjir, longsor, dan letusan gunung api di Indonesia.
            </p>
          </div>

          {/* Kelompok Mahasiswa */}
          <section>
            <h2 className="text-3xl font-semibold text-[#ff6a00] mb-6">
              Kelompok Capstone AAL
            </h2>
            <ul role="list" className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
              {leadership.map((person) => (
                <li key={person.name} className={`flex items-center gap-x-6 rounded-xl p-4 transition-colors duration-300 ${darkMode ? 'bg-[#1E2023]' : 'bg-white shadow-sm'}`}>
                  <img
                    src={person.imageUrl}
                    alt={person.name}
                    className="h-50 w-50 rounded-full object-cover"
                  />
                  <div>
                    <h3 className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {person.name}
                    </h3>
                    <p className="text-lg text-[#ff6a00]">{person.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>
    </div>
  )
}
