// components/ChartsSection.js
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

// Konfigurasi bencana disederhanakan, hanya butuh label dan warna
const hazardsConfig = [
  { key: 'gempa', label: 'Gempa Bumi', color: '#2563eb' },
  { key: 'banjir', label: 'Banjir', color: '#22c55e' },
  { key: 'longsor', label: 'Longsor', color: '#f59e42' },
  { key: 'gunungberapi', label: 'Gunung Berapi', color: '#e11d48' },
];

// Tipe bangunan yang akan ditampilkan dalam chart
const chartTypes = [
  { title: 'Semua Bangunan', tipe: 'total' },
  { title: 'Bangunan Milik Negara', tipe: 'bmn' },
  { title: 'Fasilitas Kesehatan', tipe: 'fs' },
  { title: 'Fasilitas Pendidikan', tipe: 'fd' },
];

// Helper untuk format angka Y-Axis
const formatYAxis = (value) => {
  const len = Math.round(value).toString().length;
  if (len > 12) return `${Math.round(value / 1e12)}T`; // Triliun
  if (len > 9) return `${Math.round(value / 1e9)}M`;  // Miliar
  if (len > 6) return `${Math.round(value / 1e6)}JT`; // Juta
  return value.toLocaleString('id-ID');
};

// Tooltip kustom
function CustomTooltip({ active, payload, label, darkMode }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className={`p-2 rounded border text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200 shadow'}`}>
        <strong>{`Bencana: ${label}`}</strong>
        <div style={{ color: data.fill, marginTop: '4px' }}>
          Total AAL:{' '}
          {data.value.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          })}
        </div>
      </div>
    );
  }
  return null;
}


export default function ChartsSection({ provs, data, load }) {
  const { darkMode } = useTheme();

  // Classes berdasarkan mode
  const chartCardBg = darkMode ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200';
  const titleColor = darkMode ? 'text-white' : 'text-gray-800';
  const tickColor = darkMode ? '#ddd' : '#555';
  const gridColor = darkMode ? '#444' : '#ccc';
  const cursorColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  // Fungsi untuk membangun data chart
  const buildChartData = (bangunanTipe) =>
    hazardsConfig.map((hazard) => ({
      name: hazard.label,
      aal: data?.[`aal_${hazard.key}_${bangunanTipe}`] ?? 0,
      fill: hazard.color,
    }));

  return (
    <section className="p-6">
      <div className="mb-4">
        {/* Dropdown untuk memilih kota */}
        <select
          className={`w-72 rounded-4xl px-4 py-2 appearance-none transition-colors duration-300 ${darkMode
            ? 'bg-[#C6FF00] text-black'
            : 'bg-[#C6FF00] text-black border border-yellow-400'
            }`}
          defaultValue=""
          onChange={(e) => load(e.target.value)}
        >
          <option value="" disabled>Pilih Kota</option>
          {provs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartTypes.map(({ title, tipe }) => {
          const chartData = buildChartData(tipe);
          return (
            <div key={tipe} className={`${chartCardBg} rounded-lg p-4 transition-colors duration-300`}>
              <h3 className={`${titleColor} text-center mb-2 transition-colors duration-300`}>{title}</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 5, left: 30 }}
                  barGap={10}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: tickColor, fontSize: 14 }}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fill: tickColor, fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    content={<CustomTooltip darkMode={darkMode} />}
                    cursor={{ fill: cursorColor }}
                  />
                  <Bar
                    dataKey="aal"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </section>
  );
}
