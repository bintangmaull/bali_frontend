// components/DisasterCurves.js
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Ticks
} from 'chart.js'
import { getDisasterCurves } from '../src/lib/api'
import { useTheme } from '../context/ThemeContext'

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), {
  ssr: false
})

function getDamageFromCurve(curve, xInput) {
  if (!curve || curve.length === 0) return null;
  if (xInput <= curve[0].x) return curve[0].y;
  if (xInput >= curve[curve.length - 1].x) return curve[curve.length - 1].y;
  for (let i = 1; i < curve.length; i++) {
    const x1 = curve[i - 1].x, y1 = curve[i - 1].y;
    const x2 = curve[i].x, y2 = curve[i].y;
    if (xInput >= x1 && xInput <= x2) {
      const t = (xInput - x1) / (x2 - x1);
      return y1 + (y2 - y1) * t;
    }
  }
  return null;
}

function DisasterCurveBox({ keyProp: key, label, grouped, taxonomyList, datasets, maxX, popup, setPopup, closePopup, darkMode }) {
  const [intensityInput, setIntensityInput] = useState('');
  const [damageResults, setDamageResults] = useState(null);

  // Warna chart berdasarkan mode
  const tickColor = darkMode ? '#ffffff' : '#444444';
  const gridColor = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const titleColor = darkMode ? '#ffffff' : '#333333';
  const legendColor = darkMode ? '#ffffff' : '#333333';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200';
  const headText = darkMode ? '' : 'text-gray-800';
  const inputCls = darkMode
    ? 'p-2 rounded bg-gray-700 text-white border border-gray-500 w-48'
    : 'p-2 rounded bg-white text-gray-900 border border-gray-300 w-48';
  const tableBorderCls = darkMode ? 'border-gray-600' : 'border-gray-200';
  const tableHeadBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  const tableRowBorder = darkMode ? 'border-gray-700' : 'border-gray-200';

  const handleCheckDamage = (e) => {
    e.preventDefault();
    const xVal = parseFloat(intensityInput);
    if (isNaN(xVal)) {
      setDamageResults('Input tidak valid');
      return;
    }
    const results = taxonomyList.map(tax => {
      const curve = (grouped[tax]?.x || []).map((x, i) => ({ x, y: grouped[tax].y[i] }));
      const yVal = getDamageFromCurve(curve, xVal);
      return {
        label: TAXONOMY_LABELS[tax] || tax,
        value: yVal !== null ? yVal : 'Tidak ditemukan'
      };
    });
    setDamageResults(results);
  };

  return (
    <div className={`${cardBg} p-4 rounded-lg shadow relative transition-colors duration-300`}>
      <h2 className={`text-xl font-semibold mb-4 ${headText}`}>{label}</h2>
      <Line
        data={{ datasets }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: legendColor,
                usePointStyle: true,
                pointStyle: 'line',
                padding: 10,
                font: { size: 13 },
              }
            },
            tooltip: { enabled: false }
          },
          elements: {
            point: { radius: 0, hoverRadius: 0 }
          },
          onClick: (event, elements, chart) => {
            if (!chart) return;
            const xScale = chart.scales.x;
            const mouseX = event.native.offsetX;
            const mouseY = event.native.offsetY;
            const xValue = xScale.getValueForPixel(mouseX);
            let closest = null;
            let minDist = Infinity;
            chart.data.datasets.forEach(ds => {
              ds.data.forEach(pt => {
                const dist = Math.abs(pt.x - xValue);
                if (dist < minDist) {
                  minDist = dist;
                  closest = pt;
                }
              });
            });
            if (closest) {
              setPopup({ key, label, x: closest.x, y: closest.y, left: mouseX, top: mouseY });
            }
          },
          scales: {
            x: {
              type: 'linear',
              min: 0,
              max: maxX,
              title: {
                display: true,
                text: 'Intensitas Bencana',
                color: titleColor,
                font: { size: 14 }
              },
              ticks: { color: tickColor, font: { size: 12 } },
              grid: { color: gridColor }
            },
            y: {
              min: 0,
              max: 1,
              title: {
                display: true,
                text: 'Tingkat Kerusakan',
                color: titleColor,
                font: { size: 14 }
              },
              ticks: { color: tickColor, font: { size: 12 } },
              grid: { color: gridColor }
            }
          }
        }}
      />

      {/* Popup custom per grafik */}
      {popup && popup.key === key && (
        <div
          style={{
            position: 'absolute',
            left: popup.left + 20,
            top: popup.top,
            background: darkMode ? 'rgba(30,41,59,0.98)' : 'rgba(255,255,255,0.98)',
            color: darkMode ? 'white' : '#333',
            border: '1px solid #888',
            borderRadius: 8,
            padding: '12px 18px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div><b>{popup.label}</b></div>
          <div><b>Intensitas:</b> {popup.x}</div>
          <div><b>Tingkat Kerusakan:</b> {popup.y}</div>
          <button
            onClick={closePopup}
            style={{
              marginTop: 8,
              background: darkMode ? '#334155' : '#e5e7eb',
              color: darkMode ? 'white' : '#333',
              border: 'none',
              borderRadius: 4,
              padding: '2px 10px',
              cursor: 'pointer',
              fontSize: 12
            }}
          >Tutup</button>
        </div>
      )}

      {/* Input intensitas */}
      <form onSubmit={handleCheckDamage} className="mt-4 flex flex-col md:flex-row items-center gap-2">
        <input
          type="number"
          step="any"
          value={intensityInput}
          onChange={e => setIntensityInput(e.target.value)}
          placeholder="Masukkan Intensitas Bencana"
          className={inputCls}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >Cek Tingkat Kerusakan</button>
      </form>

      {damageResults && Array.isArray(damageResults) && (
        <table className={`mt-2 border w-full max-w-md text-sm ${tableBorderCls} ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <thead>
            <tr className={tableHeadBg}>
              <th className="p-2 text-left">{['banjir', 'tsunami', 'gempa'].includes(key) ? 'Klasifikasi' : 'Taxonomy'}</th>
              <th className="p-2 text-left">Tingkat Kerusakan</th>
            </tr>
          </thead>
          <tbody>
            {damageResults.map((r, i) => (
              <tr key={i} className={`border-t ${tableRowBorder}`}>
                <td className="p-2">{r.label}</td>
                <td className="p-2">{typeof r.value === 'number' ? r.value.toFixed(4) : r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {damageResults && typeof damageResults === 'string' && (
        <div className="mt-2 text-red-400">{damageResults}</div>
      )}
    </div>
  );
}

export default function DisasterCurves() {
  const { darkMode } = useTheme()
  const [rawData, setRawData] = useState(null)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    getDisasterCurves()
      .then(setRawData)
      .catch(err => console.error('Failed to load curves', err))
  }, [])

  const closePopup = () => setPopup(null)

  if (!rawData) {
    return <p className={`p-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading charts…</p>
  }

  const TAXONOMY_LABELS = {
    '1.0': 'Lantai 1',
    '2.0': 'Lantai 2+',
    '1': 'Lantai 1',
    '2': 'Lantai 2+',
    'cr': 'CR',
    'mcf': 'MCF',
    'mur': 'MUR',
    'w': 'Lightwood/Wood',
    'lightwood': 'Lightwood/Wood'
  };

  const taxonomyColors = {
    lightwood: '#ffc107',
    w: '#ffc107',
    mur: '#fd7e14',
    mcf: '#dc3545',
    cr: '#6f42c1',
    '1.0': '#ffc107',
    '2.0': '#dc3545',
    '1': '#ffc107',
    '2': '#dc3545',
  };

  const disasters = [
    { key: 'gempa', label: 'Gempa', xAxisLabel: 'Intensitas Bencana (MMI)' },
    { key: 'tsunami', label: 'Tsunami', xAxisLabel: 'Inundansi (m)' },
    { key: 'banjir', label: 'Banjir', xAxisLabel: 'Kedalaman Banjir (m)' }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      {disasters.map(({ key, label }) => {
        const grouped = rawData[key] || {}
        const taxonomyList = Object.keys(grouped);
        const allX = taxonomyList.flatMap(t => grouped[t]?.x || [])
        const maxX = allX.length ? Math.max(...allX) : 0
          const datasets = taxonomyList.map(tax => {
          const pts = grouped[tax] || { x: [], y: [] }
          const data = pts.x.map((x, i) => ({ x, y: pts.y[i] }))
          const labelText = TAXONOMY_LABELS[tax] || tax;
          return {
            label: labelText,
            data,
            borderColor: taxonomyColors[tax] || 'gray',
            fill: false,
            tension: 0.4,
            cubicInterpolationMode: 'monotone'
          }
        })
        return (
          <DisasterCurveBox
            key={key}
            keyProp={key}
            label={label}
            grouped={grouped}
            taxonomyList={taxonomyList}
            datasets={datasets}
            maxX={maxX}
            popup={popup}
            setPopup={setPopup}
            closePopup={closePopup}
            darkMode={darkMode}
          />
        )
      })}
    </div>
  )
}
