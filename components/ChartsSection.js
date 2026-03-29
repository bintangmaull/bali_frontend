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
  { key: 'pga', label: 'Gempa Bumi', color: '#1E5C9A' },       // Deep Blue
  { key: 'inundansi', label: 'Tsunami', color: '#6FB5C2' },     // Muted Cyan
  { key: 'r', label: 'Banjir (R)', color: '#2FA69A' },         // Teal Green
  { key: 'rc', label: 'Banjir (RC)', color: '#1C7C75' },       // Dark Teal
];

const chartTypes = [
  { title: 'All Buildings', tipe: 'total' },
  { title: 'Healthcare Facilities', tipe: 'fs' },
  { title: 'Educational Facilities', tipe: 'fd' },
  { title: 'Electricity', tipe: 'electricity' },
  { title: 'Hotel', tipe: 'hotel' },
  { title: 'Airport', tipe: 'airport' },
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


// Custom Tick untuk X-Axis agar teks bisa 2 baris
function CustomXAxisTick({ x, y, payload, tickColor }) {
  const words = payload.value.split(' ');
  return (
    <g transform={`translate(${x},${y})`}>
      {words.map((word, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={10}
          textAnchor="middle"
          fill={tickColor}
          fontSize={10}
        >
          {word}
        </text>
      ))}
    </g>
  );
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
    <section className="py-2 px-2 sm:px-6">
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className={`text-xl md:text-2xl font-semibold font-[SF Pro] ${titleColor}`}>
          Diagram Batang Average Annual Loss Kota
        </h2>
        {/* Dropdown untuk memilih kota */}
        <select
          className={`w-48 sm:w-64 rounded-4xl px-3 py-1.5 text-sm appearance-none transition-colors duration-300 text-center shadow-md font-semibold ${darkMode
            ? 'bg-[#1E5C9A] text-white border-transparent'
            : 'bg-[#1E5C9A] text-white border-transparent'
            } hover:bg-[#2F6FAF]`}
          defaultValue=""
          onChange={(e) => load(e.target.value)}
        >
          <option value="" disabled>Pilih Kota</option>
          {provs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chartTypes.map(({ title, tipe }, index) => {
          const chartData = buildChartData(tipe);
          // "Semua Bangunan" (index 0) dibuat full-width di layar besar (optional)
          // Namun user minta 3 sisanya 1 baris. Jadi md:grid-cols-2 lg:grid-cols-3 
          // akan menempatkan 3 chart di baris yang sama pada layar lebar.
          return (
            <div key={tipe} className={`${chartCardBg} rounded-lg p-2 sm:p-4 transition-colors duration-300 ${index === 0 ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
              <h3 className={`${titleColor} text-center mb-2 transition-colors duration-300 text-sm sm:text-base`}>{title}</h3>
              <ResponsiveContainer width="100%" height={index === 0 ? 200 : 180}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, bottom: 10, left: -15 }}
                  barGap={10}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={<CustomXAxisTick tickColor={tickColor} />}
                    height={40}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fill: tickColor, fontSize: 10 }}
                    width={60}
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
