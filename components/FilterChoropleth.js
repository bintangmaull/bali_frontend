// components/FilterChoropleth.js
import Select from './ui/Select';

// const periodMap = {
//   gempa: ['500', '250', '100'],
//   banjir: ['100', '50', '25'],
//   longsor: ['5', '2'],
//   gunungberapi: ['250', '100', '50']
// };

const hazardLabels = {
  gempa: 'Gempa Bumi',
  banjir: 'Banjir',
  longsor: 'Longsor',
  gunungberapi: 'Gunung Berapi'
};

const modelLabels = {
  bmn: 'Bangunan Milik Negara',
  fs: 'Fasilitas Kesehatan',
  fd: 'Fasilitas Pendidikan',
  total: 'Total'
};

// Daftar bencana diambil langsung dari hazardLabels
const hazardOptions = Object.keys(hazardLabels).map(key => ({
  value: key,
  label: hazardLabels[key]
}));

export default function FilterChoropleth({
  hazard, setHazard,
  model, setModel
}) {
  // when hazard changes, reset period & model
  const onHazardChange = (h) => {
    setHazard(h);
    // setPeriod('');
    setModel('');
  };

  return (
    <div className="rounded-lg p-2">
      <div className="flex flex-col md:flex-row gap-2 items-center">
        <Select
          id="hazardSelect"
          value={hazard}
          onChange={onHazardChange}
          options={hazardOptions}
          placeholder="Pilih Bencana"
          className="w-64 md:w"
        />
        {/* <Select
          id="periodSelect"
          value={period}
          onChange={setPeriod}
          options={hazard ? periodMap[hazard].map(p => ({
            value: p,
            label: `${p} tahun`
          })) : []}
          placeholder="Pilih Return Period"
          disabled={!hazard}
          className="w-64 md:w"
        /> */}
        <Select
          id="modelSelect"
          value={model}
          onChange={setModel}
          options={['bmn', 'fs', 'fd', 'total'].map(m => ({
            value: m,
            label: modelLabels[m]
          }))}
          placeholder="Pilih Jenis Bangunan"
          disabled={!hazard}
          className="w-64 md:w"
        />
      </div>
    </div>
  );
}
