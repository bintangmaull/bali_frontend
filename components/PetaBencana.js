import { useRef, useEffect, useState } from 'react'
import Select from './ui/Select'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Struktur data baru untuk bencana dan intensitasnya
const bencanaOptions = [
  { value: 'gempa', label: 'Gempa Bumi' },
  { value: 'banjir', label: 'Banjir' },
  { value: 'tsunami', label: 'Tsunami' }
]

const intensitasOptions = {
  gempa: [
    { value: 'hazard_gempa_pga_100', label: 'PGA 100-th' },
    { value: 'hazard_gempa_pga_200', label: 'PGA 200-th' },
    { value: 'hazard_gempa_pga_250', label: 'PGA 250-th' },
    { value: 'hazard_gempa_pga_500', label: 'PGA 500-th' },
    { value: 'hazard_gempa_pga_1000', label: 'PGA 1000-th' }
  ],
  banjir: [
    { value: 'hazard_banjir_r_2', label: 'Banjir R 2-th' },
    { value: 'hazard_banjir_r_10', label: 'Banjir R 10-th' },
    { value: 'hazard_banjir_r_50', label: 'Banjir R 50-th' },
    { value: 'hazard_banjir_r_100', label: 'Banjir R 100-th' },
    { value: 'hazard_banjir_r_250', label: 'Banjir R 250-th' },
    { value: 'hazard_banjir_rc_2', label: 'Banjir RC 2-th' },
    { value: 'hazard_banjir_rc_10', label: 'Banjir RC 10-th' },
    { value: 'hazard_banjir_rc_50', label: 'Banjir RC 50-th' },
    { value: 'hazard_banjir_rc_100', label: 'Banjir RC 100-th' },
    { value: 'hazard_banjir_rc_250', label: 'Banjir RC 250-th' }
  ],
  tsunami: [
    { value: 'hazard_tsunami_inundansi', label: 'Inundansi (m)' }
  ]
}

// Define legend styles manually based on GeoServer backend colors
// YOU NEED TO ADJUST THE LABELS (RANGES) BASED ON YOUR GEOSERVER STYLING/DATA
const zeroColor = "#004d00"; // from backend code
const posColors = ["#006400", "#66cc00", "#edd16d", "#cc6600", "#ff0000"]; // from backend code

const legendStyles = {
  'hazard_gempa_mmi_100': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 3.15' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '3.15 - 6.65' },
    { color: "#edd16d", label: '6.65 - 8.66' },
    { color: "#cc6600", label: '8.66 - 9.71' },
    { color: "#ff0000", label: '9.71 - 11.96' },
  ],
  'hazard_gempa_mmi_250': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 4.70' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '4.70 - 8.43' },
    { color: "#edd16d", label: '8.43 - 9.48' },
    { color: "#cc6600", label: '9.48 - 10.37' },
    { color: "#ff0000", label: '10.37 - 12.36' },
  ],
  'hazard_gempa_mmi_500': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 4.58' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '4.58 - 8.39' },
    { color: "#edd16d", label: '8.39 - 9.73' },
    { color: "#cc6600", label: '9.73 - 10.77' },
    { color: "#ff0000", label: '10.77 - 12.78' },
  ],
  'hazard_banjir_depth_25': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 0.73' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '0.73 - 2.25' },
    { color: "#edd16d", label: '2.25 - 5.53' },
    { color: "#cc6600", label: '5.53 - 12.20' },
    { color: "#ff0000", label: '12.20 - 28.46' },
  ],
  'hazard_banjir_depth_50': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 0.76' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '0.76 - 2.26' },
    { color: "#edd16d", label: '2.26 - 5.29' },
    { color: "#cc6600", label: '5.29 - 12.25' },
    { color: "#ff0000", label: '12.25 - 24.78' },
  ],
  'hazard_banjir_depth_100': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 0.99' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '0.99 - 2.93' },
    { color: "#edd16d", label: '2.93 - 6.72' },
    { color: "#cc6600", label: '6.72 - 14.95' },
    { color: "#ff0000", label: '14.95 - 61.71' },
  ],
  'hazard_longsor_mflux_2': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 27545.29' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '27545.29 - 80138.96' },
    { color: "#edd16d", label: '80138.96 - 154185.00' },
    { color: "#cc6600", label: '154185.00 - 261752.95' },
    { color: "#ff0000", label: '261752.95 - 884917.38' },
  ],
  'hazard_longsor_mflux_5': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 27456.30' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '27456.30 - 79212.81' },
    { color: "#edd16d", label: '79212.81 - 151713.78' },
    { color: "#cc6600", label: '151713.78 - 257144.77' },
    { color: "#ff0000", label: '257144.77 - 884646.50' },
  ],
  'hazard_gunungberapi_kpa_50': [
    { color: "#004d00", label: '0' }, // Assuming 0 is a specific entry
    { color: "#006400", label: '0.00 - 0.00' }, // Example ranges, ADJUST THESE
    { color: "#66cc00", label: '0.00 - 0.00' },
    { color: "#edd16d", label: '0.00 - 0.00' },
    { color: "#cc6600", label: '0.00 - 0.00' },
    { color: "#ff0000", label: '0.00 - 0.00' },
  ],
  'hazard_gunungberapi_kpa_100': [
    { color: "#004d00", label: '0' },
    { color: "#006400", label: '0.00 - 0.11' },
    { color: "#66cc00", label: '0.11 - 0.49' },
    { color: "#edd16d", label: '0.49 - 1.16' },
    { color: "#cc6600", label: '1.16 - 2.10' },
    { color: "#ff0000", label: '2.10 - 3.19' },
  ],
  'hazard_gunungberapi_kpa_250': [
    { color: "#004d00", label: '0' },
    { color: "#006400", label: '0.00 - 0.61' },
    { color: "#66cc00", label: '0.61 - 1.94' },
    { color: "#edd16d", label: '1.94 - 3.89' },
    { color: "#cc6600", label: '3.89 - 6.47' },
    { color: "#ff0000", label: '6.47 - 10.01' },
  ],
  'hazard_tsunami_inundansi': [
    { color: "#004d00", label: '0' },
    { color: "#006400", label: '0.00 - 1.50' },
    { color: "#66cc00", label: '1.50 - 3.00' },
    { color: "#edd16d", label: '3.00 - 5.00' },
    { color: "#cc6600", label: '5.00 - 10.00' },
    { color: "#ff0000", label: '10.00 - 20.00+' },
  ],
};

export default function PetaBencana() {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const wmsOverlay = useRef(null)
  const legendControl = useRef(null)
  const [selectedBencana, setSelectedBencana] = useState('')
  const [selectedIntensitas, setSelectedIntensitas] = useState('')

  // Function to refresh WMS overlay
  const refreshWmsOverlay = (layerName) => {
    if (!mapObj.current) return

    // Remove existing overlay if it exists
    if (wmsOverlay.current) {
      mapObj.current.removeLayer(wmsOverlay.current)
      wmsOverlay.current = null
    }

    if (!layerName) return

    // Create WMS layer with legend
    const wmsBase = 'http://localhost:8081/geoserver/ne/wms'
    wmsOverlay.current = L.tileLayer.wms(wmsBase, {
      layers: 'ne:' + layerName,
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: 'GeoServer',
      legend: true
    }).addTo(mapObj.current)
  }

  // Function to update the custom legend
  const updateLegend = (layerName) => {
    if (!legendControl.current || !mapObj.current) return

    const legendInfo = legendStyles[layerName];
    const div = legendControl.current.getContainer();

    if (!legendInfo || !div) {
      div.innerHTML = ''; // Clear legend if no info or layerName
      return;
    }

    let html = '<b>Intensitas Bencana</b><br>';
    legendInfo.forEach((item) => {
      html +=
        '<i style="background:' +
        item.color +
        '; width: 18px; height: 18px; float: left; margin-right: 8px; opacity: 0.8;"></i> '
        + item.label + '<br>';
    });
    div.innerHTML = html;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapObj.current) return

    // Leaflet is already imported at the top level and this component is dynamically loaded with ssr: false


    // Define bounds for Indonesia
    const southWest = L.latLng(-11.0, 94.5)
    const northEast = L.latLng(6.0, 141.5)
    const bounds = L.latLngBounds(southWest, northEast)

    // Init map with zoom limits
    mapObj.current = L.map(mapRef.current, {
      center: [-2.5, 117],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OSM'
    }).addTo(mapObj.current)

    // Custom Legend control
    legendControl.current = L.control({ position: 'bottomleft' })
    legendControl.current.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      div.style.backgroundColor = 'white'
      div.style.padding = '6px 8px'
      div.style.borderRadius = '4px'
      div.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)'
      return div
    }
    legendControl.current.addTo(mapObj.current)

    // Cleanup
    return () => {
      if (mapObj.current) {
        mapObj.current.remove()
        mapObj.current = null
      }
      if (legendControl.current) {
        legendControl.current.remove()
        legendControl.current = null
      }
    }
  }, [])

  // Handle zoom adjustment on fullscreen
  useEffect(() => {
    const handleFullscreen = () => {
      const map = mapObj.current
      if (!map) return
      if (document.fullscreenElement) {
        map.setZoom(map.getZoom() + 2)
      } else {
        map.setZoom(map.getZoom() - 2)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [])

  // Effect to handle layer changes
  useEffect(() => {
    if (mapObj.current && selectedIntensitas) {
      refreshWmsOverlay(selectedIntensitas)
      updateLegend(selectedIntensitas)
    }
  }, [selectedIntensitas])

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-semibold text-white font-[SF Pro]">
        Peta Bencana di Indonesia
      </h2>
      <div className="flex space-x-4">
        <div className="w-64">
          <Select
            id="bencanaSelect"
            value={selectedBencana}
            onChange={(value) => {
              setSelectedBencana(value)
              setSelectedIntensitas('') // Reset intensitas when bencana changes
            }}
            options={bencanaOptions}
            placeholder="Pilih Bencana"
          />
        </div>
        <div className="w-64">
          <Select
            id="intensitasSelect"
            value={selectedIntensitas}
            onChange={setSelectedIntensitas}
            options={selectedBencana ? intensitasOptions[selectedBencana] : []}
            placeholder="Pilih Return Period"
            disabled={!selectedBencana}
            className={!selectedBencana ? ' cursor-not-allowed' : ''}
          />
        </div>
      </div>
      <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
        <div ref={mapRef} id="map" className="h-full w-full" />
      </div>
      {/* Add custom legend styling here */}
      <style jsx>{`
        .info.legend {
          background: none;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 6px 8px;
          line-height: 18px;
          color: #555;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          border-radius: 4px;
          font-size: 12px;
        }
        .info.legend i {
          width: 18px;
          height: 18px;
          float: left;
          margin-right: 8px;
          opacity: 0.8;
        }
        .info.legend br {
          margin-bottom: 4px;
          display: block;
          content: "";
        }
      `}</style>
    </div>
  )
}
