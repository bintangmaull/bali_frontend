// components/ChartsSection.js
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend, // Legend mungkin tidak diperlukan lagi, tapi kita simpan
} from 'recharts';

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

// Tooltip kustom yang lebih sederhana
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-800 text-white p-2 rounded border border-gray-700">
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
};


export default function ChartsSection({ provs, data, load }) {
  // Fungsi untuk membangun data chart, sekarang jauh lebih sederhana
  const buildChartData = (bangunanTipe) =>
    hazardsConfig.map((hazard) => ({
      name: hazard.label,
      // Mengambil nilai dari kolom AAL total per bencana
      // contoh: aal_gempa_total, aal_banjir_bmn, dll.
      aal: data?.[`aal_${hazard.key}_${bangunanTipe}`] ?? 0,
      fill: hazard.color,
    }));

  return (
    <section className="p-6">
      <div className="mb-4">
        {/* Dropdown untuk memilih provinsi */}
        <select
          className="w-72 rounded-4xl bg-[#C6FF00] px-4 py-2 text-black appearance-none"
          defaultValue=""
          onChange={(e) => load(e.target.value)}
        >
          <option value="" disabled>Pilih Provinsi</option>
          {provs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartTypes.map(({ title, tipe }) => {
          const chartData = buildChartData(tipe);
          return (
            <div key={tipe} className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white text-center mb-2">{title}</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 5, left: 30 }}
                  barGap={10}
                >
                  <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#ddd', fontSize: 14 }}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fill: '#ddd', fontSize: 12 }}
                    width={80} // Memberi ruang untuk label (T, M, JT)
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                  {/* Tidak perlu Legend jika hanya satu bar */}
                  {/* <Legend /> */}

                  {/* Hanya ada satu komponen Bar sekarang */}
                  <Bar
                    dataKey="aal"
                    radius={[4, 4, 0, 0]}
                  // Warna diambil dari data, tidak perlu loop
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