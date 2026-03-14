// components/FilterChoropleth.js
import Select from './ui/Select';

const hazards = [
  { key: 'pga', label: 'Gempa Bumi', short: 'Gempa' },
  { key: 'inundansi', label: 'Tsunami', short: 'Tsunami' },
  { key: 'r', label: 'Banjir (R)', short: 'Banjir R' },
  { key: 'rc', label: 'Banjir (RC)', short: 'Banjir RC' }
];

const modelOptions = [
  { value: 'fs', label: 'Healthcare Facilities', short: 'Healthcare' },
  { value: 'fd', label: 'Educational Facilities', short: 'Education' },
  { value: 'electricity', label: 'Electricity', short: 'Electricity' },
  { value: 'hotel', label: 'Hotel', short: 'Hotel' },
  { value: 'airport', label: 'Airport', short: 'Airport' },
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
