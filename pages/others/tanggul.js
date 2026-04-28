// pages/others/tanggul.js
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
  BadgePercent,
  Calculator,
  LayoutList
} from 'lucide-react';

const APP_DIR = '/Kajian/B06 TANGGUL PENAHAN BANJIR DI DAERAH RAWAN BANJIR-20260421T164545Z-3-001/B06 TANGGUL PENAHAN BANJIR DI DAERAH RAWAN BANJIR';

// ── Reusable UI Components ──────────────────────────────────────────────────

function SectionHeading({ children, darkMode, icon: Icon }) {
  return (
    <h2 className={`text-xl md:text-2xl font-black uppercase tracking-tight mb-8 mt-16 flex items-center gap-3 ${
      darkMode ? 'text-white' : 'text-slate-900'
    }`}>
      {Icon && <div className="p-2.5 bg-blue-500/10 rounded-xl"><Icon size={24} className="text-blue-500" /></div>}
      {children}
    </h2>
  );
}

function Paragraph({ children, darkMode }) {
  return (
    <p className={`text-[15.5px] md:text-[16.5px] leading-[1.8] mb-8 font-medium ${
      darkMode ? 'text-slate-400' : 'text-slate-600'
    }`}>
      {children}
    </p>
  );
}

function Figure({ src, caption, number, darkMode }) {
  return (
    <figure className="my-16 flex flex-col items-center group">
      <div className={`relative w-full rounded-[2.5rem] overflow-hidden border ${
        darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-2xl shadow-blue-900/5'
      } p-6 transition-all duration-700 group-hover:shadow-blue-500/10`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
        <img
          src={src}
          alt={caption}
          className="max-w-full mx-auto rounded-3xl object-contain shadow-sm transition-transform duration-700 group-hover:scale-[1.01]"
          style={{ maxHeight: '650px' }}
        />
      </div>
      <div className="mt-6 text-center max-w-2xl px-6">
        <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.25em] block mb-2">Figure {number}</span>
        <figcaption className={`text-sm font-bold tracking-tight leading-relaxed ${
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
    <div className={`my-14 overflow-hidden rounded-[2.5rem] border ${
      darkMode ? 'border-white/10 bg-black/20 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-2xl'
    } transition-all duration-500`}>
      <div className={`px-10 py-7 border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/80'}`}>
        <h3 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {subtitle && <p className={`text-xs mt-2 font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={darkMode ? 'bg-white/5' : 'bg-slate-50/50'}>
              {headers.map((h, i) => (
                <th key={i} className={`px-8 py-5 text-[11.5px] font-black uppercase tracking-wider border-b border-r last:border-r-0 ${
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
                  ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'bg-emerald-50/60 text-emerald-700 font-bold shadow-inner') 
                  : (darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50/50')
              }`}>
                {row.cells.map((cell, j) => (
                  <td key={j} className={`px-8 py-5 text-[13.5px] border-r last:border-r-0 ${
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

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-36">
        {/* Breadcrumb */}
        <button
          onClick={() => router.push('/others')}
          className={`group flex items-center gap-3 mb-14 text-[11px] font-black uppercase tracking-[0.3em] transition-all ${
            darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
          Kembali ke Kajian Lain
        </button>

        <div className="w-full">
          <div>
              <article className="prose prose-slate max-w-none prose-headings:font-black">
                
                {/* ── PENDAHULUAN ────────────────────────────────────────── */}
                <SectionHeading darkMode={darkMode} icon={Construction}>PENDAHULUAN</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Pada studi ini juga dilakukan kajian terkait pembangunan tanggul penahan banjir sebagai salah satu bentuk upaya mitigasi struktural dalam mengurangi dampak bencana banjir. Pembangunan tanggul dipandang sebagai bentuk investasi pemerintah yang bertujuan untuk melindungi wilayah rentan, khususnya kawasan permukiman, lahan pertanian, dan infrastruktur penting, dari potensi genangan akibat luapan sungai. Dengan adanya tanggul, diharapkan intensitas dan luas genangan banjir dapat minimalkan sehingga kerugian yang ditimbulkan dapat ditekan.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Kajian ini tidak hanya mempertimbangkan aspek teknis pembangunan tanggul, tetapi juga relevansinya dalam konteks pengurangan risiko bencana secara keseluruhan. Analisis dilakukan untuk memahami sejauh mana keberadaan tanggul dapat mempengaruhi tingkat paparan dan potensi kerugian pada wilayah terdampak. Dengan demikian, hasil kajian ini diharapkan dapat memberikan masukan dalam perencanaan kebijakan serta pengambilan keputusan terkait prioritas investasi mitigasi banjir di wilayah kajian.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Gambar 1 menunjukkan desain tanggul penahan banjir yang direncanakan di Makassar, Sulawesi Selatan, sebagai bagian dari upaya mitigasi struktural terhadap risiko banjir di wilayah tersebut. Desain tanggul yang diusulkan memiliki dimensi ketinggian 2,5 meter dan lebar 1 meter, yang disesuaikan dengan kondisi hidrologis serta karakteristik aliran sungai di lokasi kajian. Penentuan dimensi ini mempertimbangkan kebutuhan perlindungan terhadap potensi genangan yang dapat terjadi di sekitar kawasan sungai.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_1.PNG`}
                  number="1"
                  caption="Desain tanggul (studi kasus Makassar, Sulawesi Selatan)"
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Ketinggian tanggul ditetapkan berdasarkan hasil pemodelan banjir, khususnya pada skenario periode ulang 5 tahun, yang menunjukkan bahwa ketinggian maksimum genangan mencapai sekitar 2,2 meter. Dengan demikian, tinggi tanggul dirancang sedikit lebih tinggi dari elevasi genangan maksimum sebagai bentuk faktor keamanan untuk mengantisipasi ketidakpastian dan variasi kondisi di lapangan. Pendekatan ini umum digunakan dalam perencanaan infrastruktur pengendali banjir guna meningkatkan efektivitas perlindungan.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Pada kasus sungai di Makassar, tanggul direncanakan dibangun di kedua sisi sungai, yaitu pada sisi utara dan selatan, untuk memberikan perlindungan yang menyeluruh terhadap wilayah di sekitarnya. Panjang tanggul pada masing-masing sisi mencapai sekitar 19,02 km di sisi utara dan 16,20 km di sisi selatan. Perbedaan panjang ini mencerminkan kondisi morfologi sungai dan kebutuhan perlindungan pada masing-masing sisi, sehingga desain tanggul dapat lebih optimal dalam mereduksi dampak banjir di wilayah kajian.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Gambar 2 menunjukkan hasil simulasi pemodelan banjir yang membandingkan kondisi sebelum dan sesudah pembangunan tanggul penahan banjir. Simulasi ini dilakukan untuk mengevaluasi efektivitas tanggul dalam mengurangi dampak genangan banjir di wilayah kajian. Perbandingan tersebut memberikan gambaran yang lebih jelas mengenai perubahan pola dan sebaran genangan akibat adanya intervensi struktural berupa tanggul.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_2.PNG`}
                  number="2"
                  caption="Hasil simulasi model banjir dengan dan tanpa pengaruh tanggul"
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Secara visual, hasil simulasi menunjukkan adanya penurunan luas genangan banjir setelah pembangunan tanggul. Area yang sebelumnya tergenang pada kondisi tanpa tanggul mengalami pengurangan yang cukup signifikan pada skenario dengan tanggul. Adapun hasil perhitungan luas banjir ditunjukkan oleh Gambar 3. Terjadi penurunan luas genangan banjir sebesar 38,21%. Hal ini mengindikasikan bahwa tanggul mampu menahan aliran air agar tidak meluap ke wilayah sekitarnya, sehingga dapat mengurangi tingkat paparan terhadap bahaya banjir.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_3.PNG`}
                  number="3"
                  caption="Grafik perbandingan luas genangan banjir dengan dan tanpa pengaruh tanggul"
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Meskipun demikian, efektivitas tanggul dalam mengurangi genangan banjir tidak hanya ditentukan oleh desain dan dimensinya, tetapi juga dipengaruhi oleh berbagai faktor eksternal, seperti kapasitas tampungan sungai, intensitas dan distribusi curah hujan, serta kondisi topografi wilayah. Variasi pada faktor-faktor tersebut dapat mempengaruhi besarnya debit aliran dan potensi luapan sungai, sehingga berdampak langsung terhadap kinerja tanggul dalam menahan banjir.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Dalam konteks ini, informasi mengenai curah hujan menjadi salah satu aspek penting yang perlu diperhatikan. Hasil pemantauan curah hujan dari beberapa stasiun pengamatan disajikan pada Gambar 4, yang memberikan gambaran mengenai pola dan intensitas hujan di wilayah kajian. Data tersebut dapat digunakan untuk memahami kondisi hidrometeorologi yang mempengaruhi kejadian banjir serta sebagai input dalam evaluasi model yang digunakan.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Oleh karena itu, hasil simulasi pemodelan banjir yang telah dilakukan menjadi penting sebagai dasar dalam mengevaluasi kinerja tanggul secara lebih komprehensif. Selain itu, hasil ini juga dapat dimanfaatkan sebagai bahan pertimbangan dalam perencanaan strategi mitigasi banjir yang lebih efektif dan berkelanjutan di masa mendatang.
                </Paragraph>

                <Figure 
                  src={`${APP_DIR}/B06_FIGURE_4.png`}
                  number="4"
                  caption="Grafik pemantauan curah hujan Bali di beberapa stasiun pemantauan curah hujan"
                  darkMode={darkMode}
                />

                {/* ── PENENTUAN BIAYA ────────────────────────────────────── */}
                <SectionHeading darkMode={darkMode} icon={Calculator}>PENENTUAN BIAYA PEMBANGUNAN TANGGUL</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Penentuan biaya dan dimensi pembangunan tanggul dalam penelitian ini didasarkan pada sintesis literatur coastal engineering yang mengintegrasikan aspek hidraulik, struktural, dan ekonomi. Secara teknis, desain tanggul laut umumnya ditentukan berdasarkan elevasi muka air laut rencana (still water level), tinggi gelombang limpasan (wave run-up), serta tambahan freeboard sebagai faktor keamanan, sebagaimana dirumuskan dalam pedoman EurOtop (2018). Pendekatan ini menyatakan bahwa elevasi puncak tanggul merupakan hasil penjumlahan antara muka air laut, run-up, dan freeboard, sehingga mampu membatasi debit limpasan (overtopping) pada tingkat yang dapat diterima. Dalam praktik rekayasa, dimensi tanggul tipe earthen embankment atau rubble mound umumnya memiliki kemiringan lereng antara 1:2 hingga 1:3, lebar puncak (crest width) minimal sekitar 1–3 meter untuk struktur sederhana, serta lebar dasar yang dapat mencapai 8–15 meter tergantung tinggi tanggul dan stabilitas lereng (USACE, 2006; Van der Meer, 1988). Selain itu, lapisan pelindung (armor layer) yang umumnya berupa batuan memiliki ketebalan berkisar antara 0,4 hingga 1 meter, yang ditentukan berdasarkan stabilitas terhadap gaya gelombang menggunakan pendekatan Hudson atau Van der Meer. Parameter-parameter tersebut menunjukkan bahwa desain tanggul tidak hanya ditentukan oleh tinggi genangan, tetapi juga mempertimbangkan interaksi antara gelombang, material, dan stabilitas struktur secara keseluruhan.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Dari sisi ekonomi, penentuan biaya konstruksi tanggul dalam penelitian ini mengacu pada kisaran biaya yang dilaporkan dalam literatur Coastal Engineering oleh Igigabel dan Yates (2018), yaitu sebesar Rp 8,5–34 juta per meter untuk struktur perlindungan pantai konvensional. Kisaran ini dipilih karena mencerminkan komponen biaya utama dalam konstruksi tanggul, termasuk material urugan, lapisan pelindung, tenaga kerja, serta pekerjaan konstruksi lainnya yang umum digunakan dalam pembangunan tanggul tipe embankment. Selain itu, studi oleh Narayan et al. (2016) menunjukkan bahwa biaya struktur proteksi pantai berbasis rekayasa umumnya berada dalam rentang USD 500–2.000 per meter untuk desain sederhana, yang sejalan dengan kisaran biaya tersebut setelah dikonversi ke dalam mata uang rupiah. Sementara itu, pada skala yang lebih besar, seperti proyek Giant Sea Wall di Jakarta, biaya dapat meningkat secara signifikan hingga mencapai lebih dari USD 1 juta per meter akibat kompleksitas sistem yang mencakup polder, pompa, serta perlindungan kawasan perkotaan (Aerts et al., 2014). Oleh karena itu, dalam penelitian ini dipilih nilai batas bawah sebesar Rp 8,5 juta per meter sebagai pendekatan konservatif yang tetap berada dalam rentang yang dapat dipertanggungjawabkan secara ilmiah.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Pemilihan nilai minimum tersebut dilakukan untuk menjaga keseimbangan antara kesederhanaan model dan kewajaran estimasi biaya, serta menghindari potensi underestimation yang dapat menyebabkan hasil analisis menjadi tidak realistis. Pendekatan ini penting karena estimasi biaya yang terlalu rendah berpotensi menghasilkan bias dalam analisis kelayakan ekonomi, terutama ketika dibandingkan dengan potensi kerugian akibat genangan. Selain itu, penggunaan biaya dari proyek berskala besar seperti Giant Sea Wall dinilai kurang representatif jika langsung diterapkan pada skala tanggul lokal, karena perbedaan kompleksitas struktur dan sistem pendukung. Dengan demikian, nilai yang digunakan dalam penelitian ini tetap berada dalam batas rasional secara teknik dan sesuai dengan praktik rekayasa yang dilaporkan dalam literatur.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Perhitungan total biaya pembangunan tanggul dilakukan dengan mengalikan biaya satuan yang dipilih dengan panjang total tanggul yang direncanakan, yaitu sekitar 35,22 km atau setara dengan 35.220 meter. Berdasarkan pendekatan tersebut, diperoleh estimasi total biaya yang mencerminkan kebutuhan konstruksi langsung untuk pembangunan tanggul sesuai dengan dimensi yang telah ditentukan. Penyajian perhitungan secara eksplisit ini bertujuan untuk meningkatkan transparansi dan memudahkan proses verifikasi, sehingga setiap tahapan estimasi dapat ditelusuri secara sistematis. Dengan demikian, hasil perhitungan yang diperoleh tidak hanya bersifat kuantitatif, tetapi juga memiliki dasar metodologis yang jelas.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Meskipun demikian, estimasi biaya yang dihasilkan dalam penelitian ini masih memiliki keterbatasan karena belum mencakup berbagai komponen tambahan yang dalam praktiknya dapat memberikan kontribusi signifikan terhadap total biaya proyek. Komponen tersebut meliputi perbaikan tanah (ground improvement) pada kondisi tanah lunak, sistem drainase dan pompa, perlindungan terhadap erosi kaki tanggul (toe protection), serta biaya tidak langsung seperti perencanaan, supervisi, dan pemeliharaan. Dalam banyak kasus, terutama pada wilayah pesisir dengan kondisi geoteknik yang kompleks, biaya tambahan ini dapat meningkatkan total investasi secara substansial. Oleh karena itu, estimasi yang diperoleh dalam penelitian ini perlu dipahami sebagai batas bawah (lower bound estimate) dari kebutuhan biaya sebenarnya.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Dengan mempertimbangkan pendekatan teknis dan ekonomi yang digunakan, estimasi biaya dan dimensi tanggul dalam penelitian ini tetap memberikan gambaran awal yang relevan dalam konteks mitigasi risiko bencana pesisir. Nilai yang diperoleh dapat digunakan sebagai dasar untuk membandingkan antara biaya investasi pembangunan tanggul dan potensi pengurangan kerugian akibat genangan. Meskipun masih bersifat sederhana, pendekatan ini telah mengintegrasikan prinsip dasar desain hidraulik dan stabilitas struktur yang diakui secara internasional, sehingga hasilnya dapat dipertanggungjawabkan secara akademik. Ke depan, integrasi data lokal yang lebih detail serta analisis komponen biaya tambahan akan diperlukan untuk menghasilkan estimasi yang lebih komprehensif dan akurat.
                </Paragraph>

                {/* ── REDUKSI KERUGIAN ───────────────────────────────────── */}
                <SectionHeading darkMode={darkMode} icon={TrendingDown}>PENURUNAN ESTIMASI KERUGIAN AKIBAT BENCANA BANJIR</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Dalam penelitian ini, perbedaan antara kondisi tanpa tanggul dan dengan tanggul direpresentasikan secara langsung pada tabel, di mana nilai yang ditampilkan pada baris kedua (ditandai warna hijau) merupakan hasil simulasi setelah implementasi tanggul. Berdasarkan Tabel 1-5, nilai tersebut diperoleh dengan menerapkan faktor reduksi genangan sebesar 38,21%, sehingga kerugian yang terjadi pada skenario dengan tanggul menjadi sekitar 61,79% dari kondisi awal (baseline). Dengan demikian, nilai baseline mencerminkan kondisi eksisting tanpa intervensi, sedangkan nilai hijau merepresentasikan kondisi mitigasi setelah tanggul dibangun.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Secara konseptual, pendekatan ini mengasumsikan bahwa pengurangan luas genangan akibat keberadaan tanggul berbanding lurus dengan penurunan nilai kerugian pada berbagai sektor. Oleh karena itu, setiap nilai kerugian pada skenario dengan tanggul dihitung sebagai hasil pengalian antara nilai baseline dengan faktor 0,6179. Pendekatan ini memberikan estimasi yang konsisten dan terukur dalam membandingkan efektivitas mitigasi, tanpa perlu melakukan simulasi ulang yang kompleks untuk setiap sektor.
                </Paragraph>

                <Paragraph darkMode={darkMode}>
                  Tabel 1 menyajikan estimasi kerugian ekonomi pada sektor bandara yang mencakup terminal dan infrastruktur bandara di Kabupaten Badung dan Buleleng untuk berbagai periode ulang (R2 hingga R250). Nilai kerugian ditampilkan dalam dua kondisi, yaitu kondisi awal (baseline) dan kondisi setelah penerapan tanggul yang direpresentasikan oleh nilai yang telah mengalami reduksi. Berdasarkan Tabel 1, reduksi kerugian ini dihitung dengan asumsi penurunan genangan sebesar 38,21%, sehingga nilai kerugian setelah mitigasi menjadi sekitar 61,79% dari kondisi awal. Secara umum, terlihat bahwa Kabupaten Badung memiliki nilai kerugian yang jauh lebih besar dibandingkan Buleleng, yang menunjukkan tingkat eksposur aset bandara yang lebih tinggi. Selain itu, peningkatan periode ulang berbanding lurus dengan kenaikan nilai kerugian, yang mencerminkan intensitas bencana yang semakin besar.
                </Paragraph>

                <ComparisonTable 
                  title="Tabel 1. Estimasi Kerugian Sektor Bandara Sebelum dan Sesudah Implementasi Tanggul"
                  headers={['No', 'Regency', 'Terminal', 'Airport', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_1_DATA}
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Tabel 2 menunjukkan estimasi kerugian pada fasilitas pendidikan di beberapa kabupaten/kota dengan skenario periode ulang yang sama. Data pada tabel ini memperlihatkan bahwa wilayah dengan jumlah dan kepadatan fasilitas pendidikan yang tinggi, seperti Buleleng dan Karangasem, memiliki nilai kerugian yang signifikan. Penerapan tanggul mampu menurunkan nilai kerugian secara konsisten pada semua wilayah. Pola kenaikan kerugian terhadap periode ulang juga terlihat jelas, yang mengindikasikan bahwa fasilitas pendidikan sangat rentan terhadap peningkatan intensitas banjir. Hal ini penting karena sektor pendidikan memiliki peran vital dalam keberlangsungan sosial masyarakat.
                </Paragraph>

                <ComparisonTable 
                  title="Tabel 2. Estimasi Kerugian Fasilitas Pendidikan"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_2_DATA}
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Tabel 3 menyajikan estimasi kerugian pada infrastruktur kelistrikan, yang meliputi menara transmisi dan gardu induk. Berdasarkan Tabel 3, kerugian pada sektor ini tidak hanya berdampak secara ekonomi, tetapi juga berpotensi menimbulkan gangguan layanan yang luas. Kabupaten seperti Badung dan Buleleng menunjukkan nilai kerugian yang cukup tinggi, terutama pada gardu induk yang jumlahnya besar. Setelah penerapan tanggul, terjadi penurunan kerugian yang cukup signifikan, meskipun tidak merata di semua wilayah. Hal ini menunjukkan bahwa efektivitas mitigasi sangat dipengaruhi oleh distribusi dan kerentanan infrastruktur.
                </Paragraph>

                <div className="space-y-4">
                  <ComparisonTable 
                    title="Tabel 3A. Estimasi Kerugian Menara Transmisi"
                    headers={['No', 'Regency', 'Towers', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                    data={TABLE_3A_DATA}
                    darkMode={darkMode}
                  />
                  <ComparisonTable 
                    title="Tabel 3B. Estimasi Kerugian Gardu Induk"
                    headers={['No', 'Regency', 'Substations', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                    data={TABLE_3B_DATA}
                    darkMode={darkMode}
                  />
                </div>

                <Paragraph darkMode={darkMode}>
                  Tabel 4 memperlihatkan estimasi kerugian pada fasilitas kesehatan di berbagai kabupaten/kota. Dari tabel tersebut terlihat bahwa wilayah seperti Jembrana dan Bangli memiliki nilai kerugian yang cukup tinggi, yang menunjukkan tingkat kerentanan fasilitas kesehatan terhadap banjir. Mengacu pada Tabel 4, penerapan tanggul memberikan dampak pengurangan kerugian yang cukup signifikan di seluruh wilayah. Hal ini menjadi krusial karena fasilitas kesehatan merupakan sektor layanan dasar yang harus tetap berfungsi saat terjadi bencana. Oleh karena itu, mitigasi risiko pada sektor ini memiliki prioritas yang tinggi dalam perencanaan kebencanaan.
                </Paragraph>

                <ComparisonTable 
                  title="Tabel 4. Estimasi Kerugian Fasilitas Kesehatan"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_4_DATA}
                  darkMode={darkMode}
                />

                <Paragraph darkMode={darkMode}>
                  Tabel 5 menunjukkan estimasi kerugian pada sektor hotel yang merupakan bagian dari industri pariwisata. Data menunjukkan bahwa Kabupaten Badung memiliki nilai kerugian paling tinggi dibandingkan wilayah lainnya, yang sejalan dengan tingginya konsentrasi hotel di daerah tersebut. Kerugian meningkat secara signifikan seiring dengan bertambahnya periode ulang, yang menandakan potensi dampak ekonomi yang besar terhadap sektor pariwisata. Setelah penerapan tanggul, terjadi penurunan nilai kerugian yang cukup besar, namun secara absolut tetap tinggi karena besarnya nilai aset. Hal ini menegaskan pentingnya strategi mitigasi struktural dalam melindungi sektor ekonomi unggulan.
                </Paragraph>

                <ComparisonTable 
                  title="Tabel 5. Estimasi Kerugian Sektor Pariwisata (Hotel)"
                  headers={['No', 'Regency', 'R2', 'R5', 'R10', 'R25', 'R50', 'R100', 'R250']}
                  data={TABLE_5_DATA}
                  darkMode={darkMode}
                />

                <SectionHeading darkMode={darkMode} icon={Droplets}>SEKTOR PERTANIAN (LAHAN SAWAH)</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Berdasarkan hasil simulasi banjir dengan periode ulang 5 tahun di Kota Makassar, Sulawesi Selatan, pada skenario pembangunan bendungan, diketahui bahwa keberadaan bendungan mampu mengurangi kedalaman banjir secara signifikan. Kedalaman banjir berkurang sekitar 50% dari kondisi awal, yaitu dari sekitar 3 meter menjadi sekitar 1,5 meter. Dengan demikian, dalam perhitungan estimasi kerugian ekonomi pada lahan sawah, kedalaman banjir setelah adanya bendungan diasumsikan berkurang sebesar 1,5 meter dari hasil pemodelan awal. Pada Tabel 6 dan Tabel 7, estimasi kerugian sebelum adanya bendungan ditunjukkan oleh baris berwarna putih, sedangkan estimasi setelah adanya bendungan ditunjukkan oleh baris berwarna hijau. Tabel 6 menyajikan estimasi kerugian untuk periode ulang 5 tahun tanpa skenario perubahan iklim, sementara Tabel 7 menyajikan estimasi dengan skenario perubahan iklim.
                </Paragraph>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                  <ComparisonTable 
                    title="Tabel 6. Estimasi Kerugian Lahan Sawah (Tanpa Skenario Perubahan Iklim)"
                    headers={['Scenario', '2022', '2025', '2028']}
                    data={TABLE_6_DATA}
                    darkMode={darkMode}
                  />
                  <ComparisonTable 
                    title="Tabel 7. Estimasi Kerugian Lahan Sawah (Dengan Skenario Perubahan Iklim)"
                    headers={['Scenario', '2022', '2025', '2028']}
                    data={TABLE_7_DATA}
                    darkMode={darkMode}
                  />
                </div>

                {/* ── KESIMPULAN ────────────────────────────────────────── */}
                <SectionHeading darkMode={darkMode} icon={ShieldCheck}>KESIMPULAN</SectionHeading>
                <Paragraph darkMode={darkMode}>
                  Berdasarkan keseluruhan data pada tabel-tabel sebelumnya, dilakukan agregasi nilai kerugian untuk membandingkan kondisi tanpa tanggul (baseline) dan dengan tanggul (nilai reduksi/warna hijau) khusus pada periode ulang R5 and RC5. Mengacu pada data di atas, nilai kerugian setelah implementasi tanggul merupakan hasil reduksi sebesar 38,21% dari kondisi awal, sehingga secara teoritis nilai dengan tanggul berada pada kisaran 61,79% dari baseline. Namun demikian, perhitungan langsung dari data menunjukkan besaran yang lebih konkret dalam konteks masing-masing sektor.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Untuk periode ulang R5, total kerugian tanpa tanggul (akumulasi seluruh sektor: bandara, pendidikan, listrik, kesehatan, dan hotel) mencapai sekitar ± USD 174,5 juta, sedangkan setelah penerapan tanggul menurun menjadi sekitar ± USD 107,8 juta. Dengan demikian, terjadi penurunan risiko kerugian sebesar ± USD 66,7 juta. Nilai ini menunjukkan bahwa intervensi tanggul memberikan dampak signifikan dalam mengurangi potensi kerugian ekonomi akibat banjir, terutama pada sektor dengan kontribusi besar seperti hotel di Kabupaten Badung.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Sementara itu, untuk periode ulang RC5, total kerugian tanpa tanggul tercatat sekitar ± USD 186,3 juta, dan setelah penerapan tanggul menurun menjadi sekitar ± USD 115,1 juta. Dengan demikian, diperoleh selisih pengurangan kerugian sebesar ± USD 71,2 juta. Nilai ini sedikit lebih besar dibandingkan skenario R5, yang mengindikasikan bahwa pada kondisi risiko yang mempertimbangkan komponen tambahan (RC), efektivitas tanggul tetap konsisten bahkan memberikan dampak reduksi yang lebih besar secara absolut.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Secara keseluruhan, hasil ini menunjukkan bahwa pembangunan tanggul sebagai upaya mitigasi struktural mampu menurunkan risiko kerugian secara signifikan pada berbagai sektor. Penurunan ini tidak hanya bersifat proporsional terhadap reduksi genangan, tetapi juga dipengaruhi oleh distribusi aset dan tingkat eksposur di masing-masing wilayah. Dengan demikian, keberadaan tanggul menjadi komponen penting dalam strategi pengurangan risiko bencana, khususnya di wilayah dengan konsentrasi ekonomi tinggi seperti Kabupaten Badung.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Jika dibandingkan antara biaya pembangunan tanggul dan manfaat yang diperoleh berupa penurunan risiko kerugian, maka dapat dilakukan pendekatan analisis sederhana berbasis cost-benefit. Berdasarkan estimasi yang digunakan dalam penelitian ini, total biaya pembangunan tanggul sepanjang 35,22 km adalah sekitar USD 18,7 juta atau setara dengan IDR 299,4 miliar (menggunakan asumsi biaya minimum IDR 8,5 juta/meter). Nilai ini merupakan estimasi konservatif yang belum memasukkan komponen biaya tambahan seperti pembebasan lahan dan sistem drainase.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Di sisi lain, hasil perhitungan sebelumnya menunjukkan bahwa untuk periode ulang R5, pembangunan tanggul mampu menurunkan kerugian dari sekitar USD 174,5 juta menjadi USD 107,8 juta, sehingga terdapat pengurangan kerugian sebesar ± USD 66,7 juta. Sementara itu, untuk skenario RC5, penurunan kerugian bahkan mencapai sekitar ± USD 71,2 juta. Mengacu pada data simulasi, penurunan ini konsisten dengan reduksi genangan sebesar 38,21% akibat keberadaan tanggul.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Apabila dibandingkan secara langsung, maka nilai manfaat ekonomi (benefit) yang diperoleh dari pengurangan kerugian pada satu skenario kejadian (R5 atau RC5) sudah 3–4 kali lebih besar dibandingkan dengan biaya pembangunan tanggul. Dengan kata lain, bahkan dalam satu kejadian banjir dengan periode ulang 5 tahun, investasi tanggul sudah berpotensi “terbayar” secara ekonomi. Hal ini menunjukkan bahwa dari perspektif ekonomi teknik, pembangunan tanggul termasuk dalam kategori highly cost-effective.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Lebih lanjut, jika mempertimbangkan bahwa banjir merupakan kejadian berulang (bukan hanya satu kali selama umur infrastruktur), maka akumulasi manfaat ekonomi dalam jangka panjang akan jauh lebih besar. Artinya, nilai pengurangan kerugian dapat berlipat ganda sepanjang umur layanan tanggul, sementara biaya konstruksi hanya dikeluarkan sekali di awal. Kondisi ini memperkuat argumen bahwa pembangunan tanggul bukan hanya layak, tetapi juga merupakan investasi mitigasi yang sangat menguntungkan secara ekonomi.
                </Paragraph>
                <Paragraph darkMode={darkMode}>
                  Namun demikian, perlu dicatat bahwa analisis ini masih menggunakan pendekatan konservatif, baik dari sisi biaya (menggunakan batas bawah) maupun manfaat (hanya mempertimbangkan beberapa sektor utama). Oleh karena itu, dalam kondisi nyata, nilai manfaat yang diperoleh berpotensi lebih besar, terutama jika mempertimbangkan dampak tidak langsung seperti gangguan ekonomi regional, kehilangan pendapatan pariwisata, dan disrupsi layanan publik.
                </Paragraph>

              </article>
            </div>
          </div>
        </main>

      <Footer />
    </div>
  );
}
