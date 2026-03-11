// components/FilterChoropleth.js
import Select from './ui/Select';

const hazards = [
  { key: 'gempa', label: 'Gempa Bumi', short: 'Gempa' },
  { key: 'banjir', label: 'Banjir', short: 'Banjir' },
  { key: 'longsor', label: 'Longsor', short: 'Longsor' },
  { key: 'gunungberapi', label: 'Gunung Berapi', short: 'Gunung' }
];

const modelOptions = [
  { value: 'bmn', label: 'Bangunan Milik Negara', short: 'BMN' },
  { value: 'fs', label: 'Fasilitas Kesehatan', short: 'Faskes' },
  { value: 'fd', label: 'Fasilitas Pendidikan', short: 'Fasdik' },
  { value: 'total', label: 'Total', short: 'Total' }
];

export default function FilterChoropleth({
  hazard, setHazard,
  model, setModel
}) {
  // when hazard changes, reset period & model
  const onHazardChange = (h) => {
    setHazard(h);
    setModel('');
  };

  return (
    <div className="rounded-lg py-1">
      <div className="flex flex-row gap-2 items-center w-full justify-start">
        <div className="w-48 sm:w-64">
          <Select
            id="hazardSelect"
            value={hazard}
            onChange={onHazardChange}
            options={hazards.map(h => ({
              value: h.key,
              label: h.label
            }))}
            placeholder="Bencana"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
          />
        </div>
        <div className="w-48 sm:w-64">
          <Select
            id="modelSelect"
            value={model}
            onChange={setModel}
            options={modelOptions.map(m => ({
              value: m.value,
              label: m.label
            }))}
            placeholder="Jenis"
            disabled={!hazard}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
          />
        </div>
      </div>
    </div>
  );
}
