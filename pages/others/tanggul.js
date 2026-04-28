import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Construction, 
  TrendingDown, 
  Info, 
  BarChart3, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Building2,
  Droplets,
  BadgePercent
} from 'lucide-react';

const APP_DIR = '/Kajian/B06 TANGGUL PENAHAN BANJIR DI DAERAH RAWAN BANJIR-20260421T164545Z-3-001/B06 TANGGUL PENAHAN BANJIR DI DAERAH RAWAN BANJIR';

// ── Reusable UI Components ──────────────────────────────────────────────────

function SectionHeading({ children, darkMode, icon: Icon }) {
  return (
    <h2 className={`text-xl md:text-2xl font-black uppercase tracking-tight mb-6 mt-12 flex items-center gap-3 ${
      darkMode ? 'text-white' : 'text-slate-900 border-slate-200'
    }`}>
      {Icon && <div className="p-2 bg-blue-500/10 rounded-lg"><Icon size={24} className="text-blue-500" /></div>}
      {children}
    </h2>
  );
}

function Paragraph({ children, darkMode }) {
  return (
    <p className={`text-[15px] md:text-[16px] leading-relaxed mb-6 font-medium ${
      darkMode ? 'text-slate-400' : 'text-slate-600'
    }`}>
      {children}
    </p>
  );
}

function Figure({ src, caption, number, darkMode }) {
  return (
    <figure className="my-14 flex flex-col items-center group">
      <div className={`relative w-full rounded-[2.5rem] overflow-hidden border ${
        darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-2xl shadow-blue-900/5'
      } p-5 transition-all duration-700 group-hover:shadow-blue-500/10`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
        <img
          src={src}
          alt={caption}
          className="max-w-full mx-auto rounded-3xl object-contain shadow-sm transition-transform duration-700 group-hover:scale-[1.01]"
          style={{ maxHeight: '600px' }}
        />
      </div>
      <div className="mt-5 text-center max-w-2xl px-6">
        <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Figure {number}</span>
        <figcaption className={`text-sm font-semibold tracking-tight ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {caption}
        </figcaption>
      </div>
    </figure>
  );
}

function ComparisonTable({ title, headers, data, darkMode, subtitle }) {
  return (
    <div className={`my-12 overflow-hidden rounded-[2.5rem] border ${
      darkMode ? 'border-white/10 bg-black/20 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-2xl'
    } transition-all duration-500`}>
      <div className={`px-8 py-6 border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/80'}`}>
        <h3 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {subtitle && <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={darkMode ? 'bg-white/5' : 'bg-slate-50/50'}>
              {headers.map((h, i) => (
                <th key={i} className={`px-6 py-4 text-[12px] font-black uppercase tracking-wider border-b border-r last:border-r-0 ${
                  darkMode ? 'text-slate-400 border-white/5' : 'text-slate-500 border-slate-100'
                } whitespace-nowrap`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
            {data.map((row, i) => (
              <tr key={i} className={`transition-all duration-300 ${
                row.isMitigated 
                  ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'bg-emerald-50/60 text-emerald-700 font-bold') 
                  : (darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50/50')
              }`}>
                {row.cells.map((cell, j) => (
                  <td key={j} className={`px-6 py-4 text-[13px] border-r last:border-r-0 ${
                    darkMode ? 'border-white/5' : 'border-slate-100'
                  }`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Data Constants ─────────────────────────────────────────────────────────

const TABLE_1_DATA = [
  { cells: ['1', 'Badung', '3', '1', '$1,908,085', '$2,158,254', '$2,333,103', '$2,441,996', '$2,608,359', '$2,772,536', '$2,973,867'], isMitigated: false },
  { cells: ['', 'Badung', '3', '1', '$1,179,006', '$1,333,585', '$1,441,624', '$1,508,910', '$1,611,705', '$1,713,150', '$1,837,552'], isMitigated: true },
  { cells: ['2', 'Buleleng', '0', '1', '$90,089', '$98,994', '$104,506', '$105,875', '$107,375', '$110,854', '$112,980'], isMitigated: false },
  { cells: ['', 'Buleleng', '0', '1', '$55,666', '$61,168', '$64,574', '$65,420', '$66,347', '$68,497', '$69,811'], isMitigated: true },
];

const TABLE_2_DATA = [
  { cells: ['1', 'Badung', '$1,085,099', '$1,168,141', '$1,233,113', '$1,284,925', '$1,349,457', '$1,422,217', '$1,535,496'], isMitigated: false },
  { cells: ['', 'Badung', '$670,483', '$721,794', '$761,941', '$793,955', '$833,830', '$878,788', '$948,783'], isMitigated: true },
  { cells: ['2', 'Bangli', '$89,664', '$89,664', '$89,664', '$90,946', '$92,482', '$94,020', '$100,717'], isMitigated: false },
  { cells: ['', 'Bangli', '$55,403', '$55,403', '$55,403', '$56,195', '$57,145', '$58,095', '$62,233'], isMitigated: true },
  { cells: ['3', 'Buleleng', '$2,459,102', '$2,603,269', '$2,729,361', '$2,811,487', '$2,969,164', '$3,033,019', '$3,252,583'], isMitigated: false },
  { cells: ['', 'Buleleng', '$1,519,479', '$1,608,560', '$1,686,472', '$1,737,218', '$1,834,646', '$1,874,103', '$2,009,771'], isMitigated: true },
  { cells: ['4', 'Gianyar', '$368,756', '$400,550', '$419,472', '$454,548', '$497,667', '$525,884', '$554,305'], isMitigated: false },
  { cells: ['', 'Gianyar', '$227,854', '$247,500', '$259,192', '$280,865', '$307,509', '$324,944', '$342,505'], isMitigated: true },
  { cells: ['5', 'Jembrana', '$1,007,963', '$1,216,111', '$1,291,023', '$1,331,792', '$1,380,341', '$1,423,787', '$1,493,812'], isMitigated: false },
  { cells: ['', 'Jembrana', '$622,820', '$751,435', '$797,723', '$822,915', '$852,913', '$879,758', '$923,027'], isMitigated: true },
  { cells: ['6', 'Karangasem', '$1,960,838', '$2,148,574', '$2,248,934', '$2,337,217', '$2,428,561', '$2,530,579', '$2,682,815'], isMitigated: false },
  { cells: ['', 'Karangasem', '$1,211,602', '$1,327,604', '$1,389,617', '$1,444,166', '$1,500,608', '$1,563,645', '$1,657,712'], isMitigated: true },
  { cells: ['7', 'Klungkung', '$412,043', '$447,426', '$475,013', '$509,425', '$546,148', '$589,062', '$609,154'], isMitigated: false },
  { cells: ['', 'Klungkung', '$254,601', '$276,465', '$293,510', '$314,774', '$337,465', '$363,982', '$376,396'], isMitigated: true },
  { cells: ['8', 'Denpasar City', '$980,303', '$1,156,195', '$1,252,071', '$1,350,782', '$1,454,442', '$1,557,782', '$1,692,292'], isMitigated: false },
  { cells: ['', 'Denpasar City', '$605,729', '$714,413', '$773,654', '$834,648', '$898,699', '$962,554', '$1,045,667'], isMitigated: true },
  { cells: ['9', 'Tabanan', '$1,418,330', '$1,553,436', '$1,640,551', '$1,667,171', '$1,705,994', '$1,762,119', '$1,815,960'], isMitigated: false },
  { cells: ['', 'Tabanan', '$876,386', '$959,868', '$1,013,697', '$1,030,145', '$1,054,133', '$1,088,813', '$1,122,082'], isMitigated: true },
];

const TABLE_3A_DATA = [
  { cells: ['1', 'Badung', '4', '$63,802', '$82,433', '$95,042', '$105,849', '$117,369', '$127,361', '$142,493'], isMitigated: false },
  { cells: ['', 'Badung', '4', '$39,423', '$50,935', '$58,726', '$65,404', '$72,522', '$78,696', '$88,046'], isMitigated: true },
  { cells: ['2', 'Buleleng', '3', '$85,264', '$102,764', '$116,979', '$125,642', '$138,151', '$350,245', '$395,695'], isMitigated: false },
  { cells: ['', 'Buleleng', '3', '$52,684', '$63,498', '$72,281', '$77,634', '$85,363', '$216,417', '$244,500'], isMitigated: true },
];

const TABLE_3B_DATA = [
  { cells: ['1', 'Badung', '416', '$551,941', '$624,334', '$690,383', '$745,035', '$790,252', '$834,297', '$888,763'], isMitigated: false },
  { cells: ['', 'Badung', '416', '$341,044', '$385,776', '$426,588', '$460,357', '$488,297', '$515,512', '$549,167'], isMitigated: true },
  { cells: ['2', 'Buleleng', '551', '$366,936', '$430,590', '$465,055', '$492,334', '$543,550', '$557,117', '$653,196'], isMitigated: false },
  { cells: ['', 'Buleleng', '551', '$226,730', '$266,061', '$287,357', '$304,213', '$335,860', '$344,243', '$403,610'], isMitigated: true },
];

const TABLE_4_DATA = [
  { cells: ['1', 'Badung', '$226,655', '$216,933', '$230,684', '$242,679', '$257,886', '$280,596', '$387,919'], isMitigated: false },
  { cells: ['', 'Badung', '$140,050', '$134,043', '$142,540', '$149,951', '$159,348', '$173,381', '$239,695'], isMitigated: true },
  { cells: ['2', 'Bangli', '$677,110', '$616,903', '$628,742', '$638,353', '$649,471', '$663,476', '$679,953'], isMitigated: false },
  { cells: ['', 'Bangli', '$418,386', '$381,185', '$388,500', '$394,438', '$401,308', '$409,962', '$420,143'], isMitigated: true },
];

const TABLE_5_DATA = [
  { cells: ['1', 'Badung', '$79,765,077', '$89,718,971', '$96,949,280', '$103,627,861', '$110,162,066', '$119,941,115', '$136,812,234'], isMitigated: false },
  { cells: ['', 'Badung', '$49,286,841', '$55,437,352', '$59,904,960', '$64,031,655', '$68,069,141', '$74,111,615', '$84,536,279'], isMitigated: true },
];

const TABLE_6_DATA = [
  { cells: ['Baseline (Depth)', '1.59964', '1.68263', '1.68263'], isMitigated: false },
  { cells: ['Baseline (Loss USD)', '$46,109,442', '$58,014,369', '$66,025,040'], isMitigated: false },
  { cells: ['Mitigated (Depth)', '0.09964', '0.18263', '0.18263'], isMitigated: true },
  { cells: ['Mitigated (Loss USD)', '$0', '$2,116,897', '$2,409,200'], isMitigated: true },
];

const TABLE_7_DATA = [
  { cells: ['Baseline (Depth)', '1.01823', '1.08689', '1.08689'], isMitigated: false },
  { cells: ['Baseline (Loss USD)', '$36,869,573', '$47,013,415', '$53,505,066'], isMitigated: false },
  { cells: ['Mitigated (Depth)', '0.00000', '0.00000', '0.00000'], isMitigated: true },
  { cells: ['Mitigated (Loss USD)', '$0', '$0', '$0'], isMitigated: true },
];

// ────────────────────────────────────────────────────────────────────────────

export default function TanggulBanjir() {
  const { darkMode } = useTheme();
  const router = useRouter();

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-x-hidden ${
      darkMode ? 'bg-[#040608] text-slate-200' : 'bg-[#FAFCFF] text-slate-800'
    }`}>
      <Header />

      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-30 ${
          darkMode ? 'bg-blue-600/20' : 'bg-blue-100'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-20 ${
          darkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'
        }`} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-32">
        {/* Animated Breadcrumb */}
        <button
          onClick={() => router.push('/others')}
          className={`group flex items-center gap-3 mb-12 text-[11px] font-black uppercase tracking-[0.25em] transition-all ${
            darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
          Kembali ke Kajian Lain
        </button>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Main Content Column */}
          <div className="lg:w-[70%] order-2 lg:order-1">
            <div>
              <article className="prose prose-slate max-w-none prose-headings:font-black">
                
                <SectionHeading darkMode={darkMode} icon={Construction}>PENDAHULUAN</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Pada studi ini juga dilakukan kajian terkait pembangunan tanggul penahan banjir sebagai salah satu bentuk upaya mitigasi struktural dalam mengurangi dampak bencana banjir. Pembangunan tanggul dipandang sebagai bentuk investasi pemerintah yang bertujuan untuk melindungi wilayah rentan, khususnya kawasan permukiman, lahan pertanian, dan infrastruktur penting, dari potensi genangan akibat luapan sungai. Dengan adanya tanggul, diharapkan intensitas dan luas genangan banjir dapat diminimalkan sehingga kerugian yang ditimbulkan dapat ditekan.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Kajian ini tidak hanya mempertimbangkan aspek teknis pembangunan tanggul, tetapi juga relevansinya dalam konteks pengurangan risiko bencana secara keseluruhan. Analisis dilakukan untuk memahami sejauh mana keberadaan tanggul dapat mempengaruhi tingkat paparan dan potensi kerugian pada wilayah terdampak. Dengan demikian, hasil kajian ini diharapkan dapat memberikan masukan dalam perencanaan kebijakan serta pengambilan keputusan terkait prioritas investasi mitigasi banjir di wilayah kajian.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_1.PNG`}
                  number="1"
                  caption="Desain tanggul penahan banjir (studi kasus Makassar, Sulawesi Selatan) dengan ketinggian 2,5m dan lebar 1m."
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Ketinggian tanggul ditetapkan berdasarkan hasil pemodelan banjir, khususnya pada skenario periode ulang 5 tahun, yang menunjukkan bahwa ketinggian maksimum genangan mencapai sekitar 2,2 meter. Dengan demikian, tinggi tanggul dirancang sedikit lebih tinggi dari elevasi genangan maksimum sebagai bentuk faktor keamanan untuk mengantisipasi ketidakpastian dan variasi kondisi di lapangan.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_2.PNG`}
                  number="2"
                  caption="Hasil simulasi pemodelan banjir membandingkan kondisi Baseline (kiri) vs Mitigasi (kanan)."
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Secara visual, hasil simulasi menunjukkan adanya penurunan luas genangan banjir setelah pembangunan tanggul. Area yang sebelumnya tergenang pada kondisi tanpa tanggul mengalami pengurangan yang cukup signifikan pada skenario dengan tanggul. Terjadi penurunan luas genangan banjir sebesar <b>38,21%</b>. Hal ini mengindikasikan bahwa tanggul mampu menahan aliran air agar tidak meluap ke wilayah sekitarnya.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_3.PNG`}
                  number="3"
                  caption="Grafik analisis perbandingan luas genangan banjir."
                  darkMode={darkMode}
                />

                <SectionHeading darkMode={darkMode} icon={BadgePercent}>BIAYA PEMBANGUNAN TANGGUL</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Dari sisi ekonomi, penentuan biaya konstruksi tanggul dalam penelitian ini mengacu pada kisaran biaya yang dilaporkan dalam literatur <i>Coastal Engineering</i> oleh Igigabel dan Yates (2018), yaitu sebesar <b>Rp 8,5–34 juta per meter</b>. Dalam penelitian ini dipilih nilai batas bawah sebesar <b>Rp 8,5 juta per meter</b> sebagai pendekatan konservatif yang tetap berada dalam rentang yang dapat dipertanggungjawabkan secara ilmiah.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Perhitungan total biaya pembangunan tanggul dilakukan dengan mengalikan biaya satuan yang dipilih dengan panjang total tanggul yang direncanakan, yaitu sekitar <b>35,22 km</b> atau setara dengan 35.220 meter. Berdasarkan pendekatan tersebut, diperoleh estimasi total biaya sebesar <b>Rp 299,4 Miliar</b>.
                </Paragraph>

                {/* Economic Summary Highlight */}
                <div className={`my-12 p-10 rounded-[2.5rem] border ${
                  darkMode ? 'bg-blue-600/10 border-blue-500/20 shadow-blue-500/5' : 'bg-blue-50 border-blue-100 shadow-blue-900/5'
                } relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110 duration-700">
                    <Zap size={120} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <h4 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    <Zap size={24} /> Estimasi Investasi Struktural
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Satuan Biaya (Min)</span>
                      <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Rp 8,5 Jt <span className="text-sm font-medium opacity-50">/ meter</span></p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Biaya Konstruksi</span>
                      <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Rp 299,4 M</p>
                    </div>
                  </div>
                </div>

                <SectionHeading darkMode={darkMode} icon={TrendingDown}>ESTIMASI REDUKSI KERUGIAN</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Berdasarkan simulasi, implementasi tanggul menghasilkan faktor reduksi genangan sebesar <b>38,21%</b>. Hal ini berdampak langsung pada penurunan estimasi risiko kerugian di berbagai sektor. Nilai yang ditandai warna hijau merepresentasikan kondisi mitigasi setelah tanggul dibangun.
                </Paragraph>

                <ComparisonTable 
                  title="Tabel 1. Estimasi Kerugian Sektor Bandara"
                  subtitle="Membandingkan Kerugian (USD) antara Terminal dan Infrastruktur Bandara."
                  headers={['No', 'Regency', 'Terminal', 'Airport', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_1_DATA}
                  darkMode={darkMode}
                />

                <ComparisonTable 
                  title="Tabel 2. Estimasi Kerugian Fasilitas Pendidikan"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_2_DATA}
                  darkMode={darkMode}
                />

                <SectionHeading darkMode={darkMode} icon={Zap}>INFRASTRUKTUR KELISTRIKAN</SectionHeading>
                <ComparisonTable 
                  title="Tabel 3A. Menara Transmisi"
                  headers={['No', 'Regency', 'Towers', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_3A_DATA}
                  darkMode={darkMode}
                />
                <ComparisonTable 
                  title="Tabel 3B. Gardu Induk"
                  headers={['No', 'Regency', 'Substations', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_3B_DATA}
                  darkMode={darkMode}
                />

                <SectionHeading darkMode={darkMode} icon={ShieldCheck}>FASILITAS KESEHATAN & PARIWISATA</SectionHeading>
                <ComparisonTable 
                  title="Tabel 4. Estimasi Kerugian Fasilitas Kesehatan"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_4_DATA}
                  darkMode={darkMode}
                />
                <ComparisonTable 
                  title="Tabel 5. Estimasi Kerugian Sektor Pariwisata (Hotel)"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_5_DATA}
                  darkMode={darkMode}
                />

                <SectionHeading darkMode={darkMode} icon={Droplets}>KAJIAN LAHAN SAWAH (MAKASSAR)</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Pada skenario bendungan di Makassar, kedalaman banjir berkurang sekitar 50% dari kondisi awal (3m menjadi 1,5m). Berikut analisis dampaknya terhadap sektor pertanian lahan sawah:
                </Paragraph>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                  <ComparisonTable 
                    title="Tabel 6. Tanpa Perubahan Iklim"
                    headers={['Scenario', '2022', '2025', '2028']}
                    data={TABLE_6_DATA}
                    darkMode={darkMode}
                  />
                  <ComparisonTable 
                    title="Tabel 7. Dengan Perubahan Iklim"
                    headers={['Scenario', '2022', '2025', '2028']}
                    data={TABLE_7_DATA}
                    darkMode={darkMode}
                  />
                </div>

                <SectionHeading darkMode={darkMode}>KESIMPULAN</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Berdasarkan keseluruhan data, pembangunan tanggul sebagai upaya mitigasi struktural mampu menurunkan risiko kerugian secara signifikan pada berbagai sektor. Nilai manfaat ekonomi (<i>benefit</i>) yang diperoleh dari pengurangan kerugian pada satu skenario kejadian (R5 atau RC5) sudah <b>3–4 kali lebih besar</b> dibandingkan dengan biaya pembangunan tanggul.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Untuk periode ulang R5, total kerugian tanpa tanggul mencapai ± USD 174,5 juta, sedangkan setelah penerapan tanggul menurun menjadi ± USD 107,8 juta. Terjadi penurunan risiko kerugian sebesar <b>± USD 66,7 juta</b>. Investasi ini terbukti sangat <i>cost-effective</i> bagi ketahanan wilayah pesisir di masa depan.
                </Paragraph>

              </article>
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:w-[30%] order-1 lg:order-2">
            <div className="sticky top-28 space-y-8">
              
              <div 
                className={`p-8 rounded-[2rem] border ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-2xl'
                }`}
              >
                <h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Highlights</h4>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg h-fit"><ShieldCheck size={20} className="text-blue-500" /></div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Efektivitas</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reduksi Luas Genangan 38.21%</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg h-fit"><TrendingDown size={20} className="text-emerald-500" /></div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Manfaat (R5)</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Penghematan ± USD 66.7 Juta</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg h-fit"><Construction size={20} className="text-amber-500" /></div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Investasi</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Estimasi Biaya Rp 299.4 M</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className={`p-8 rounded-[2rem] border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Navigasi Halaman</h4>
                <nav className="flex flex-col gap-1">
                  {['Pendahuluan', 'Metodologi', 'Hasil Simulasi', 'Analisis Ekonomi', 'Kesimpulan'].map((item) => (
                    <button key={item} className={`text-left px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-blue-600 hover:bg-white'
                    }`}>
                      {item}
                    </button>
                  ))}
                </nav>
              </div>

            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
