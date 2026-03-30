import Select from './ui/Select'
import { useTheme } from '../context/ThemeContext';

const layerGroups = [
  {
    label: 'Gempa Bumi',
    options: [
      { value: 'hazard_gempa_pga_100', label: 'Gempa PGA 100' },
      { value: 'hazard_gempa_pga_250', label: 'Gempa PGA 250' },
      { value: 'hazard_gempa_pga_500', label: 'Gempa PGA 500' },
      { value: 'hazard_gempa_pga_1000', label: 'Gempa PGA 1000' }
    ]
  },
  {
    label: 'Banjir',
    options: [
      { value: 'hazard_banjir_r_25', label: 'Banjir R 25-th' },
      { value: 'hazard_banjir_r_100', label: 'Banjir R 100-th' },
      { value: 'hazard_banjir_rc_25', label: 'Banjir RC 25-th' },
      { value: 'hazard_banjir_rc_100', label: 'Banjir RC 100-th' }
    ]
  },
  {
    label: 'Tsunami',
    options: [
      { value: 'hazard_tsunami_inundansi', label: 'Tsunami Inundansi' }
    ]
  }
]

export default function FilterPetaBencana({ layer, setLayer }) {
  const { darkMode } = useTheme();
  return (
    <div className={`rounded-lg p-2 shadow flex flex-col md:flex-row gap-2 items-center w-fit border transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 border-gray-800 shadow-black/20' : 'bg-white border-gray-200'
    }`}>
      <Select
        id="layerSelect"
        value={layer}
        onChange={setLayer}
        options={layerGroups.flatMap(group =>
          group.options.map(opt => ({
            ...opt,
            group: group.label
          }))
        )}
        groupBy="group"
        placeholder="Pilih Bencana"
        className="w-64"
      />
    </div>
  )
}