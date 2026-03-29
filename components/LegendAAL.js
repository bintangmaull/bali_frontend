// components/LegendAAL.js
import { useTheme } from '../context/ThemeContext';

const colors = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027', '#7f0000'];

// Fungsi Jenks Natural Breaks (5 atau 6 kelas)
function jenks(data, n_classes) {
  if (!Array.isArray(data) || data.length === 0) return [];
  data = data.slice().sort((a, b) => a - b);
  const matrices = Array(data.length + 1).fill(0).map(() => Array(n_classes + 1).fill(0));
  const variances = Array(data.length + 1).fill(0).map(() => Array(n_classes + 1).fill(0));
  for (let i = 1; i <= n_classes; i++) {
    matrices[0][i] = 1;
    variances[0][i] = 0;
    for (let j = 1; j <= data.length; j++) {
      variances[j][i] = Infinity;
    }
  }
  for (let l = 1; l <= data.length; l++) {
    let sum = 0, sumSquares = 0, w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = data[i3 - 1];
      w++;
      sum += val;
      sumSquares += val * val;
      const variance = sumSquares - (sum * sum) / w;
      if (i3 !== 1) {
        for (let j = 2; j <= n_classes; j++) {
          if (variances[l][j] >= (variance + variances[i3 - 1][j - 1])) {
            matrices[l][j] = i3;
            variances[l][j] = variance + variances[i3 - 1][j - 1];
          }
        }
      }
    }
    matrices[l][1] = 1;
    variances[l][1] = sumSquares - (sum * sum) / w;
  }
  const k = data.length;
  const kclass = Array(n_classes + 1).fill(0);
  kclass[n_classes] = data[data.length - 1];
  kclass[0] = data[0];
  let countNum = n_classes;
  let kTmp = k;
  while (countNum > 1) {
    kclass[countNum - 1] = data[matrices[kTmp][countNum] - 2];
    kTmp = matrices[kTmp][countNum] - 1;
    countNum--;
  }
  return kclass;
}

export default function LegendAAL({ geojson, hazard, period, model }) {
  const { darkMode } = useTheme();

  // Classes berdasarkan mode
  const cardCls = darkMode 
    ? 'bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-2xl' 
    : 'bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl';
  const titleCls = darkMode ? 'text-white' : 'text-[#1E5C9A]';
  const textCls = darkMode ? 'text-gray-300' : 'text-gray-700';

  if (!hazard || !model) return null;
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    return (
      <div className="absolute top-2 left-2 z-50 opacity-75 pointer-events-none">
        <div className={`border rounded-lg shadow px-4 py-3 transition-colors duration-300 ${cardCls}`}>
          <div className={`font-semibold mb-2 ${titleCls}`}>Legenda Nilai Kerugian (Rupiah)</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-4 rounded" style={{ background: colors[0], border: '1px solid #ccc' }} />
              <span className={`text-sm ${textCls}`}>Rp 0 – Rp 0</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const actModel = model === 'total' ? 'total' : model;
  const metric = period ? `aal_${hazard}_${period}_${actModel}` : `aal_${hazard}_${actModel}`;
  const vals = geojson.features.map(f => f.properties[metric] || 0).filter(v => typeof v === 'number' && !isNaN(v));

  // Pilih jumlah kelas (5 atau 6)
  const nClass = vals.length > 30 ? 6 : 5;
  let grades = jenks(vals, nClass);
  grades = grades.sort((a, b) => a - b);

  return (
    <div className="flex flex-col items-start mt-4">
      <div className={`border rounded-lg shadow px-4 py-3 transition-colors duration-300 ${cardCls}`}>
        <div className={`font-semibold mb-2 ${titleCls}`}>Average Annual Loss (Rupiah)</div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: nClass }).map((_, i) => {
            const low = Math.ceil(grades[i] / 1e6);
            const high = Math.ceil(grades[i + 1] / 1e6);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="inline-block w-6 h-4 rounded" style={{ background: colors[i], border: '1px solid #ccc' }} />
                <span className={`text-sm ${textCls}`}>
                  {`Rp ${low}M`} – {`Rp ${high}M`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

