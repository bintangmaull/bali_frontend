// pages/others/populasi-terdampak.js
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'next/router';
import { ArrowLeft, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

// ── static data ────────────────────────────────────────────────────────────
const table1 = {
  caption: 'Tabel 1. Ringkasan populasi terdampak berdasarkan jenis bahaya',
  headers: ['Impact Category', 'Flood R25', 'Flood R250', 'Flood RC25', 'Flood RC250', 'Tsunami', 'Earthquake'],
  rows: [
    ['Exposed Household', '134,440', '165,239', '150,170', '183,204', '115,456', '1,268'],
    ['Exposed Total Population', '454,228', '558,000', '507,204', '619,551', '374,744', '4,537'],
    ['Exposed Male', '227,914', '279,933', '254,452', '310,702', '187,889', '2,286'],
    ['Exposed Female', '226,315', '278,067', '252,752', '308,849', '186,855', '2,251'],
    ['Exposed Total with Disability', '1,729', '2,124', '1,956', '2,367', '1,316', '21'],
    ['Exposed Disabled Male', '854', '1,051', '968', '1,174', '651', '10'],
    ['Exposed Disabled Female', '875', '1,074', '988', '1,193', '664', '11'],
    ['Exposed Total > 60', '63,402', '77,823', '71,101', '86,574', '51,096', '625'],
    ['Exposed > 60 Male', '30,263', '37,172', '33,924', '41,344', '24,409', '298'],
    ['Exposed > 60 Female', '33,140', '40,650', '37,177', '45,230', '26,687', '327'],
  ],
};

const table2 = {
  caption: 'Tabel 2. Persentase rata-rata populasi terdampak berdasarkan usia dan disabilitas',
  headers: ['Hazard', 'Disabled Person (%)', 'Aged > 60 (%)'],
  rows: [
    ['Flood', '0.38', '13.97'],
    ['Tsunami', '0.35', '13.64'],
    ['Earthquake', '0.46', '13.78'],
    ['Average', '0.39', '13.84'],
  ],
};

const table3 = {
  caption: 'Tabel 3. Ringkasan regional paparan populasi terhadap bahaya alam',
  headers: ['Regency/City', 'Flood R25', 'Flood R250', 'Flood RC25', 'Flood RC250', 'Tsunami', 'Earthquake'],
  rows: [
    ['Badung', '12,822', '17,646', '15,516', '20,676', '19,149', '31'],
    ['Bangli', '962', '1,403', '1,107', '1,766', '0', '4'],
    ['Buleleng', '1,689', '2,195', '1,980', '2,676', '0', '13'],
    ['Denpasar City', '5,125', '6,041', '5,432', '6,457', '40,515', '59'],
    ['Gianyar', '2,062', '2,411', '2,165', '2,779', '13,531', '15'],
    ['Jembrana', '3,373', '4,283', '3,814', '4,733', '13,021', '13'],
    ['Karangasem', '1,361', '1,577', '1,459', '1,705', '1,044', '22'],
    ['Klungkung', '553', '613', '597', '640', '3,038', '4'],
    ['Tabanan', '1,282', '1,496', '1,390', '1,636', '4,717', '10'],
  ],
};

const BASE_URL = '/Kajian/B02 POTENSI POPULASI TERDAMPAK BENCANA-20260421T054351Z-3-001/B02 POTENSI POPULASI TERDAMPAK BENCANA';

// ── utility: parse CSV ─────────────────────────────────────────────────────
function parseCSV(csvText, hasComplexHeaders = false) {
  // Enhanced split to handle quotes and commas inside quotes
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Handle newlines inside quotes for tables with multi-line headers
  let sanitizedText = csvText.replace(/"([^"]*)"/g, (match, p1) => {
    return '"' + p1.replace(/\n/g, ' ') + '"';
  });

  const lines = sanitizedText.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return null;

  if (hasComplexHeaders) {
    // Row 1: Group headers
    const row1 = parseLine(lines[0]);
    const groupHeaders = [];
    let currentGroup = null;
    let currentCount = 0;

    row1.forEach((cell, i) => {
      const val = cell.replace(/^"(.*)"$/, '$1').trim();
      if (val !== '') {
        if (currentGroup !== null) {
          groupHeaders.push({ label: currentGroup, span: currentCount });
        }
        currentGroup = val;
        currentCount = 1;
      } else {
        if (currentGroup === null) {
          groupHeaders.push({ label: '', span: 1 });
        } else {
          currentCount++;
        }
      }
    });
    if (currentGroup !== null) {
      groupHeaders.push({ label: currentGroup, span: currentCount });
    }

    // Row 2: Sub headers
    const subHeaders = parseLine(lines[1]).map(s => s.replace(/^"(.*)"$/, '$1').trim());

    // Rows 3+: Data
    const data = lines.slice(2).map(line => parseLine(line).map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));

    return { groupHeaders, subHeaders, data };
  } else {
    // Simple table (Headers in first row)
    const headers = parseLine(lines[0]).map(s => s.replace(/^"(.*)"$/, '$1').trim());
    const rows = lines.slice(1).map(line => parseLine(line).map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
    return { headers, rows };
  }
}

// ── reusable sub-components ────────────────────────────────────────────────
function SectionHeading({ children, darkMode }) {
  return (
    <h2 className={`text-lg md:text-xl font-black uppercase tracking-widest mb-4 mt-12 pb-2 border-b ${
      darkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-200'
    }`}>
      {children}
    </h2>
  );
}

function Paragraph({ children, darkMode }) {
  return (
    <p className={`text-sm md:text-[15px] leading-relaxed mb-5 ${
      darkMode ? 'text-slate-300' : 'text-slate-700'
    }`}>
      {children}
    </p>
  );
}

function Figure({ src, caption, darkMode }) {
  return (
    <figure className={`my-8 flex flex-col items-center gap-3`}>
      <div className={`w-full rounded-2xl overflow-hidden border ${
        darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
      } p-3 shadow-inner`}>
        <img
          src={src}
          alt={caption}
          className="max-w-full mx-auto rounded-xl object-contain shadow-lg"
          style={{ maxHeight: '540px' }}
        />
      </div>
      <figcaption className={`text-xs text-center italic max-w-2xl px-4 ${
        darkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {caption}
      </figcaption>
    </figure>
  );
}

function DataTable({ parsedData, darkMode, caption, tableType = 'summary' }) {
  const [page, setPage] = useState(1);
  const [selectedRegency, setSelectedRegency] = useState('All');
  const [visibleGroups, setVisibleGroups] = useState([]);

  // Initialize filters based on table type
  useEffect(() => {
    if (tableType === 'B02_T4') {
      setVisibleGroups(['Earthquake', 'Flood', 'Tsunami']);
    } else if (tableType === 'B02_T5') {
      setVisibleGroups(['Disabled Status', 'Age Group', 'Combined']);
    }
  }, [tableType]);

  if (!parsedData) return <div className="p-10 text-center animate-pulse">Loading table...</div>;

  const { headers, rows } = parsedData;

  // 1. Get unique values for Regency filter (index 3 corresponds to Regency/City)
  const regencies = ['All', ...new Set(rows.map(row => row[3]).filter(Boolean))].sort();

  // 2. Filter logic for rows
  const filteredRows = rows.filter(row => {
    if (selectedRegency === 'All') return true;
    return row[3] === selectedRegency;
  });

  // 3. Filter logic for columns
  const getVisibleColumnIndices = () => {
    const indices = [];
    // Always show first 5 columns (Administrative) + T5 specifically needs Household/Total (5,6)
    const adminCutoff = tableType === 'B02_T5' ? 7 : 5;
    for (let i = 0; i < adminCutoff; i++) indices.push(i);

    headers.forEach((h, i) => {
      if (i < adminCutoff) return;
      
      if (tableType === 'B02_T4') {
        const hUpper = h.toUpperCase();
        if (visibleGroups.includes('Earthquake') && hUpper.includes('EARTHQUAKE')) indices.push(i);
        if (visibleGroups.includes('Flood') && hUpper.includes('FLOOD')) indices.push(i);
        if (visibleGroups.includes('Tsunami') && hUpper.includes('TSUNAMI')) indices.push(i);
      } else if (tableType === 'B02_T5') {
        // Table 5 Logic: 
        // Disabled Status: D1_.. to D4_.. (indices 7-10 approx)
        // Age Group: A1_.. to A6_.. (indices 11-16 approx)
        // Combined: D1A1.. (indices 17+)
        if (visibleGroups.includes('Disabled Status') && h.startsWith('D') && h.includes('_')) indices.push(i);
        if (visibleGroups.includes('Age Group') && h.startsWith('A') && h.includes('_')) indices.push(i);
        if (visibleGroups.includes('Combined') && /D\dA\d/.test(h)) indices.push(i);
      } else {
        indices.push(i);
      }
    });
    return indices;
  };

  const colIndices = getVisibleColumnIndices();
  const visibleHeaders = colIndices.map(i => headers[i]);
  const rowsPerPage = 50;
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const displayedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleGroup = (group) => {
    setVisibleGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
    setPage(1);
  };

  return (
    <figure className="my-10 w-full flex flex-col gap-4">
      <figcaption className={`text-xs text-center italic max-w-2xl mx-auto px-4 ${
        darkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {caption}
      </figcaption>

      {/* FILTER UI */}
      {(tableType === 'B02_T4' || tableType === 'B02_T5') && (
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-5 rounded-2xl border ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <div className="flex flex-col gap-3">
             <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
               Filter Wilayah
             </span>
             <select
               value={selectedRegency}
               onChange={(e) => { setSelectedRegency(e.target.value); setPage(1); }}
               className={`px-4 py-2 text-sm rounded-xl border focus:ring-2 outline-none transition-all cursor-pointer w-full md:w-56 ${
                 darkMode 
                   ? 'bg-slate-900 border-white/10 text-white focus:border-blue-500/50' 
                   : 'bg-white border-slate-200 text-slate-900 focus:border-blue-400'
               }`}
             >
               {regencies.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
          </div>

          <div className="flex flex-col gap-3">
             <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
               Tampilkan Data
             </span>
             <div className="flex flex-wrap gap-4">
               {(tableType === 'B02_T4' ? ['Earthquake', 'Flood', 'Tsunami'] : ['Disabled Status', 'Age Group', 'Combined']).map(group => (
                 <label key={group} className="flex items-center gap-2 cursor-pointer group">
                   <input
                     type="checkbox"
                     checked={visibleGroups.includes(group)}
                     onChange={() => toggleGroup(group)}
                     className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                   />
                   <span className={`text-xs font-medium transition-colors ${
                     visibleGroups.includes(group) 
                       ? (darkMode ? 'text-white' : 'text-slate-900') 
                       : (darkMode ? 'text-slate-500' : 'text-slate-400')
                   } group-hover:text-blue-500`}>
                     {group}
                   </span>
                 </label>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl border" style={{
        borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff'
      }}>
        <div className="overflow-auto w-full max-h-[600px]">
          <table className="min-w-full text-xs md:text-[13px] border-collapse relative">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className={darkMode ? 'bg-[#0a1118]' : 'bg-blue-50'}>
                {visibleHeaders.map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] whitespace-nowrap ${
                    darkMode ? 'text-blue-300 border-b border-white/10' : 'text-blue-800 border-b border-blue-200'
                  }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.length > 0 ? displayedRows.map((row, ri) => (
                <tr key={ri} className={`transition-colors flex-none ${
                  ri % 2 === 0
                    ? (darkMode ? 'bg-white/[0.01]' : 'bg-white')
                    : (darkMode ? 'bg-white/[0.03]' : 'bg-slate-50/50')
                } flex-none ${darkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50/50'}`}>
                  {colIndices.map((idx, ci) => (
                    <td key={ci} className={`px-4 py-2.5 whitespace-nowrap ${
                      darkMode ? 'text-slate-300 border-b border-white/5' : 'text-slate-700 border-b border-slate-100'
                    } ${idx <= 1 ? 'font-medium' : ''}`}>
                      {row[idx]}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                   <td colSpan={visibleHeaders.length} className="px-4 py-12 text-center text-slate-500 animate-pulse">
                     Tidak ada data yang sesuai dengan filter.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 mt-2 mb-4">
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, rows.length)} of {rows.length} entries
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                page === 1 
                  ? (darkMode ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400')
                  : (darkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')
              }`}
            >
              Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                page === totalPages 
                  ? (darkMode ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400')
                  : (darkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </figure>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function PopulasiTerdampak() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [table1Data, setTable1Data] = useState(null);
  const [table2Data, setTable2Data] = useState(null);
  const [table3Data, setTable3Data] = useState(null);
  const [table4Data, setTable4Data] = useState(null);
  const [table5Data, setTable5Data] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/B02_TABLE_1.csv`).then(r => r.text()).then(txt => setTable1Data(parseCSV(txt))).catch(console.error);
    fetch(`${BASE_URL}/B02_TABLE_2.csv`).then(r => r.text()).then(txt => setTable2Data(parseCSV(txt))).catch(console.error);
    fetch(`${BASE_URL}/B02_TABLE_3.csv`).then(r => r.text()).then(txt => setTable3Data(parseCSV(txt))).catch(console.error);
    fetch(`${BASE_URL}/B02_TABLE_4.csv`).then(r => r.text()).then(txt => setTable4Data(parseCSV(txt))).catch(console.error);
    fetch(`${BASE_URL}/B02_TABLE_5.csv`).then(r => r.text()).then(txt => setTable5Data(parseCSV(txt))).catch(console.error);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${
      darkMode ? 'bg-[#040608] text-gray-200' : 'bg-slate-50 text-gray-800'
    }`}>
      <Header />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-600' : 'bg-blue-200'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 ${darkMode ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        <div className={`absolute inset-0 opacity-[0.03] ${darkMode ? 'invert' : ''}`}
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-24 md:pt-36">
        <button
          onClick={() => router.push('/others')}
          className={`flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'}`}
        >
          <ArrowLeft size={14} /> Kembali ke Kajian Lain
        </button>

        <div className={`rounded-[2rem] border p-8 md:p-12 mb-12 bg-gradient-to-br ${darkMode ? 'from-blue-500/10 to-indigo-500/5 border-blue-500/20 bg-white/5' : 'from-blue-50 to-indigo-50 border-blue-100 shadow-xl'}`}>
          <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
            Impact Analysis · Kajian B02
          </span>
          <h1 className={`text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Potensi Populasi Terdampak Bencana
          </h1>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Estimasi populasi terdampak untuk identifikasi jumlah orang dalam setiap kategori pendukung perencanaan respons bencana.
          </p>
        </div>

        <div className="flex flex-col items-start w-full animate-in fade-in slide-in-from-bottom-4 duration-700 text-justify">
          <SectionHeading darkMode={darkMode}>PENDAHULUAN</SectionHeading>
          <Paragraph darkMode={darkMode}>
            Estimasi populasi terdampak bertujuan untuk mengidentifikasi jumlah orang dalam setiap kategori, termasuk kepala keluarga, jenis kelamin, status disabilitas, dan kelompok usia. Informasi ini dapat digunakan untuk mendukung perencanaan respons bencana, memprioritaskan populasi rentan, serta merancang bantuan yang tepat sasaran dan strategi pemulihan pascabencana. Perhitungan populasi terdampak bencana dilakukan secara proporsi serta untuk bahaya gempa bumi, banjir, dan tsunami. Penilaian ini didasarkan pada model bahaya yang telah dikembangkan dan data populasi yang telah dikumpulkan.
          </Paragraph>
          <Paragraph darkMode={darkMode}>
            Secara umum, perhitungan populasi terdampak bencana dilakukan melalui tiga tahap utama: identifikasi nilai bahaya untuk setiap tingkat desa, perhitungan rasio kategori populasi, dan rasio kelas bahaya. Karena data populasi hanya tersedia di tingkat desa, semua perhitungan dilakukan pada tingkat ini. Proses identifikasi nilai bahaya untuk setiap desa dilakukan dengan bantuan sistem informasi geografis (GIS) melalui analisis spasial tumpang susun (overlay) antara data batas administrasi desa dengan data bahaya. Proses perhitungan rasio kategori populasi dan kelas bahaya dilakukan dengan model matematis sederhana pembagian antara data kategori populasi atau kelas bahaya dibagi dengan total masing-masing data yang terkait.
          </Paragraph>
          <Paragraph darkMode={darkMode}>
            Proses agregasi nilai bahaya terdiri dari dua langkah utama: klasifikasi bahaya dan perhitungan kelas bahaya untuk setiap tingkat desa. Model bahaya gempa bumi diklasifikasikan ke dalam lima tingkat, yaitu no damage, slight, moderate, extensive, dan collapse. Model bahaya banjir dan tsunami diklasifikasikan ke dalam tiga tingkat: rendah, sedang, dan tinggi, berdasarkan kedalaman genangan. Kelas rendah mewakili kedalaman genangan kurang dari 1 meter, kelas sedang berkisar antara 1 hingga 2 meter, dan kelas tinggi mewakili kedalaman lebih dari 2 meter. Model bahaya banjir yang digunakan adalah periode ulang 2, 5, 10, 25, 50, 100, dan 250 tahun serta mencakup skenario tanpa dan dengan perubahan iklim. Nilai bahaya yang telah diklasifikasikan kemudian dihitung untuk setiap tingkat desa, sehingga diperoleh rasio kelas bahaya setiap desa. Hasil perhitungan rasio kelas bahaya ini kemudian dapat digunakan untuk menghitung rasio jumlah orang mengungsi untuk setiap skenario bahaya.
          </Paragraph>
          <Paragraph darkMode={darkMode}>
            Data populasi yang digunakan secara umum memiliki dua kategori, yaitu kategori kelompok disabilitas dan kelompok usia. Kelompok disabilitas terdiri dari empat kelas dan kelompok usia terdiri dari enam kelas. Detail kelas kedua kategori ini ditunjukkan oleh Tabel 1.
          </Paragraph>
          
          <DataTable parsedData={table1Data} darkMode={darkMode} caption="Tabel 1. Daftar kelas kelompok disabilitas dan kelompok usia" />

          <Paragraph darkMode={darkMode}>
            Dalam kajian ini, perhitungan estimasi penduduk mengungsi didasarkan pada rasio penduduk untuk setiap kategori. Karena terdapat dua kategori populasi, maka perlu dilakukan kombinasi antarkategori. Hasil kombinasi empat kelas kelompok disabilitas dan enam kelas kelompok usia adalah 24 kelas kelompok kombinasi. Detail kelas kelompok kombinasi ditunjukkan oleh Tabel 2. Kode kelas kombinasi telah dibuat untuk memudahkan pembacaan kelas kombinasi. Sebagai contoh, kode D2A4 adalah kode untuk rasio wanita penyandang disabilitas pada kelompok usia middle age (40 - 59 tahun).
          </Paragraph>

          <DataTable parsedData={table2Data} darkMode={darkMode} caption="Tabel 2. Daftar kelas kelompok kombinasi" />

          <Paragraph darkMode={darkMode}>
            Tahap selanjutnya adalah integrasi data rasio populasi, rasio kelas bahaya, dan rasio jumlah orang mengungsi. Tahap ini dilakukan menggunakan metode penggabungan tabel (join table) yang memerlukan pengidentifikasi unik untuk menghubungkan kumpulan data tersebut. Dalam studi ini, kode desa atau ID desa digunakan sebagai pengidentifikasi untuk menghubungkan data kelas bahaya dengan data populasi di tingkat desa. Proses ini menghasilkan kumpulan data yang berisi informasi rasio kelas bahaya dan populasi untuk setiap desa, yang kemudian digunakan untuk menghitung jumlah orang di setiap kategori yang terpapar pada setiap jenis bahaya.
          </Paragraph>
          <Paragraph darkMode={darkMode}>
            Hasil estimasi populasi terpapar selanjutnya digunakan untuk memperkirakan jumlah orang yang mungkin perlu dievakuasi saat terjadi bencana. Untuk bahaya gempa bumi, penduduk yang berada di area yang diklasifikasikan sebagai tingkat sedang hingga runtuh dianggap perlu dievakuasi. Asumsi ini mengikuti standar Federal Emergency Management Agency (FEMA), yang menunjukkan bahwa bangunan dengan kerusakan sedang secara struktural tidak aman karena retakan yang signifikan dan risiko kegagalan struktur (Milyardi dkk., 2025). Untuk bahaya banjir dan tsunami, penduduk di area yang diklasifikasikan sebagai tingkat sedang dan tinggi dianggap perlu dievakuasi. Ambang batas kelas bahaya banjir yang digunakan untuk menentukan kebutuhan evakuasi didasarkan pada studi kasus peristiwa banjir di Bali pada September 2025. Informasi terkait evakuasi selama peristiwa banjir September 2025 di Bali disajikan dalam Tabel 3.
          </Paragraph>

          <DataTable parsedData={table3Data} darkMode={darkMode} caption="Tabel 3. Data evakuasi korban banjir di Bali pada September 2025" />

          <Paragraph darkMode={darkMode}>
            Tabel di atas menyajikan laporan peristiwa banjir di Bali pada September 2025 sebagaimana didokumentasikan oleh Badan Penanggulangan Bencana Daerah (BPBD). Informasi tersebut mencakup kabupaten dan kota yang terdampak, lokasi pengungsian, dan jumlah hari evakuasi. Karena kurangnya data lapangan yang terperinci mengenai kedalaman banjir aktual, estimasi kedalaman banjir diperoleh dari model bahaya banjir yang dikembangkan dalam studi ini, sebagaimana ditunjukkan pada kolom estimasi kedalaman banjir. Estimasi kedalaman banjir dihitung sebagai kedalaman banjir rata-rata untuk setiap desa di mana lokasi pengungsian diidentifikasi. Hasilnya menunjukkan bahwa kedalaman banjir selama peristiwa tersebut berkisar antara 0,71 m hingga 5,59 m, dengan kedalaman rata-rata 1,72 m. Berdasarkan estimasi tersebut, ambang batas kedalaman banjir sebesar 1 meter diterapkan untuk mengklasifikasikan penduduk yang memerlukan evakuasi.
          </Paragraph>
          <Paragraph darkMode={darkMode}>
            Dalam studi ini, estimasi populasi terpapar idealnya dilakukan pada tingkat bangunan untuk memberikan hasil yang lebih terperinci. Namun, karena keterbatasan ketersediaan data tingkat bangunan, analisis hanya dilakukan pada tingkat desa. Ambang batas yang digunakan untuk mengidentifikasi populasi yang memerlukan evakuasi didasarkan pada beberapa referensi dan pendekatan berbasis kasus. Untuk bahaya gempa bumi, ambang batas mengikuti standar FEMA yang menunjukkan bahwa pada tingkat kerusakan sedang, bangunan dianggap tidak aman sehingga penduduk diharuskan untuk mengevakuasi diri. Untuk bahaya banjir, ambang batas ditentukan berdasarkan peristiwa banjir di Bali pada September 2025, di mana penduduk di area yang diklasifikasikan sebagai bahaya sedang atau dengan kedalaman banjir lebih dari 1 meter dianggap perlu dievakuasi. Demikian pula, ambang batas evakuasi untuk bahaya tsunami diturunkan menggunakan pendekatan yang sama dengan banjir, karena kedua model bahaya tersebut menggunakan kedalaman air sebagai indikator utama dampak.
          </Paragraph>

          <SectionHeading darkMode={darkMode}>HASIL</SectionHeading>
          <Paragraph darkMode={darkMode}>
            Tabel 4 menyajikan hasil perhitungan rasio penduduk mengungsi sesuai skenario bahaya di setiap desa di Provinsi Bali. Dalam setiap model bahaya, kategori No Class atau No Damage didefinisikan untuk mewakili area yang tidak memiliki potensi bahaya banjir. Proporsi yang dihitung menunjukkan bahwa kategori No Class atau No Damage cenderung mendominasi dibandingkan dengan kelas bahaya lainnya, yang menunjukkan bahwa sebagian besar area di desa-desa relatif aman. Dalam kajian ini, area yang diklasifikasikan dalam tingkat bahaya banjir dan tsunami sedang dan tinggi dianggap sebagai zona dimana populasi harus mengevakuasi diri. Sementara itu, untuk bahaya gempa bumi, area yang dikategorikan sebagai moderate, extensive, dan collapse dianggap sebagai zona yang memerlukan evakuasi populasi.
          </Paragraph>

          <DataTable parsedData={table4Data} darkMode={darkMode} caption="Tabel 4. Rasio penduduk mengungsi setiap skenario bahaya untuk setiap desa di Bali" tableType="B02_T4" />

          <Paragraph darkMode={darkMode}>
            Setelah rasio populasi yang mengevakuasi diri diperoleh untuk setiap desa dan setiap jenis bahaya, langkah selanjutnya adalah menghitung rasio penduduk terdampak untuk setiap kelompok kombinasi antara kelompok disabilitas dan kelompok usia. Hasil perhitungan rasio penduduk mengungsi ditunjukkan oleh Tabel 5.
          </Paragraph>

          <DataTable parsedData={table5Data} darkMode={darkMode} caption="Tabel 5. Rasio penduduk menurut kelompok kombinasi (kelompok disabilitas dan kelompok usia) setiap desa di Bali" tableType="B02_T5" />

          <Paragraph darkMode={darkMode}>
            Berdasarkan hasil perhitungan rasio penduduk mengungsi (Tabel 4) dan rasio penduduk menurut kelompok kombinasi (Tabel 5), dapat dihitung estimasi populasi terdampak bencana. Estimasi ini dapat dilakukan dengan mengalikan jumlah penduduk secara keseluruhan dengan rasio penduduk mengungsi dan rasio penduduk menurut kelmpok kombinasi.
          </Paragraph>

          <SectionHeading darkMode={darkMode}>REFERENSI</SectionHeading>
          <div className="w-full text-left">
            <Paragraph darkMode={darkMode}>
              Milyardi, R., Pribadi, K. S., Abduh, M., Meilano, I., Lim, E., Hs, H., & Ansyari, A. (2025). Rehabilitation and reconstruction cost drivers in earthquake-affected buildings: a damage-level-based analysis in Indonesia. Bulletin of Earthquake Engineering, 23(13), 5469–5493. <a href="https://doi.org/10.1007/s10518-025-02243-5" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">https://doi.org/10.1007/s10518-025-02243-5</a>
            </Paragraph>
          </div>
        </div>
      </main>
    </div>
  );
}
