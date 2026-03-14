import React, { useRef, useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import CrudBuildings from './CrudBuildings'

const icons = {
  FS: L.icon({
    iconUrl: 'icons/healthcare.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
  FD: L.icon({
    iconUrl: 'icons/education.svg',
    iconSize: [20, 20],
    iconAnchor: [6, 20],
    popupAnchor: [0, -20],
    className: 'rounded-icon'
  }),
}

export default function HazardMap({ provinsi, kota, setProvinsi, setKota }) {
  const [selectedBuilding, setSelectedBuilding] = React.useState('')
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const buildingCluster = useRef(null)
  const boundaryLayer = useRef(null)
  const markers = useRef([])

  function handleSearchBuilding({ lat, lon }) {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 18, { animate: true })
    }
  }

  useEffect(() => {
    if (mapRef.current) return
    // Default ke koordinat Bali saat pertama dimuat
    const map = L.map(mapEl.current, { zoomControl: false }).setView([-8.4, 115.2], 9)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      opacity: 0.7,
    }).addTo(map)
    mapRef.current = map



    // Tambahkan legenda jenis bangunan
    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend')
      div.style.background = '#ffffff'
      div.style.padding = '6px 12px'
      div.style.borderRadius = '6px'
      div.style.color = 'black'
      div.style.opacity = '0.8'
      div.style.fontSize = '0.8rem'

      let html = '<h4 class="text-black font-bold mb-1">Jenis Bangunan</h4>'
      html += `
        <div style="display:flex; align-items:center; margin-bottom:4px;">
          <img src="icons/healthcare.svg" style="width:20px; height:20px; margin-right:6px; background:white; padding:2px; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"/>
          <span>Healthcare Facilities</span>
        </div>
        <div style="display:flex; align-items:center;">
          <img src="icons/education.svg" style="width:20px; height:20px; margin-right:6px; background:white; padding:2px; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.2);"/>
          <span>Educational Facilities</span>
        </div>
      `
      div.innerHTML = html
      return div
    }
    legend.addTo(map)

    buildingCluster.current = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      chunkInterval: 100,
      disableClusteringAtZoom: 18,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      animateAddingMarkers: false,
      spiderfyDistanceMultiplier: 1,
    })
    map.addLayer(buildingCluster.current)

    // Set batas zoom maksimum untuk peta
    map.setMaxZoom(19)
  }, [])

  // Handle zoom adjustment on fullscreen
  useEffect(() => {
    const handleFullscreen = () => {
      const map = mapRef.current
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

  useEffect(() => {
    if (!mapRef.current || !buildingCluster.current) return
    const map = mapRef.current
    const cluster = buildingCluster.current

    cluster.clearLayers()
    markers.current = []

    if (!kota) return

    fetch(`/api/gedung?kota=${encodeURIComponent(kota)}`)
      .then(r => r.json())
      .then(data => {
        const markersList = data.features.map(f => {
          const [lon, lat] = f.geometry.coordinates
          const type = (f.properties.id_bangunan || '').split('_')[0]
          const marker = L.marker([lat, lon], {
            icon: icons[type] || icons.FD,
            riseOnHover: true
          })

          marker.bindTooltip(f.properties.nama_gedung, {
            direction: 'top',
            offset: [0, -20],
            className: 'building-tooltip',
            opacity: 0.9
          })

          marker.on('click', () => {
            if (!marker.getPopup()) {
              const popupContent = `
                <div style="min-width:200px">
                  <strong>${f.properties.nama_gedung}</strong><br/>
                  <small>${f.properties.alamat}</small>
                </div>
              `
              marker.bindPopup(popupContent)
            }
            // Update tabel agar menampilkan gedung ini
            setSelectedBuilding(f.properties.nama_gedung)
          })
          return marker
        })

        markers.current = markersList
        cluster.addLayers(markers.current)
        cluster.refreshClusters()

        // Ambil batas kota menggunakan API yang sudah ada
        if (boundaryLayer.current) {
          map.removeLayer(boundaryLayer.current)
          boundaryLayer.current = null
        }

        fetch(`/api/kota-boundary?kota=${encodeURIComponent(kota)}`)
          .then(res => res.json())
          .then(geoJsonData => {
            if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
              boundaryLayer.current = L.geoJSON(geoJsonData, {
                style: {
                  color: '#475569',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: '#94a3b8',
                  fillOpacity: 0.2,
                  dashArray: '5, 5'
                }
              }).addTo(map)

              // Gabungkan bounds cluster dan boundary agar map view pas
              const clusterBounds = cluster.getBounds()
              const boundaryBounds = boundaryLayer.current.getBounds()

              let finalBounds = clusterBounds
              if (boundaryBounds.isValid()) {
                finalBounds = clusterBounds.isValid() ? clusterBounds.extend(boundaryBounds) : boundaryBounds
              }

              if (finalBounds.isValid()) {
                map.fitBounds(finalBounds, {
                  padding: [50, 50],
                  maxZoom: 14
                })
              }
            } else {
              // Jika boundary tidak ada, fall back ke cluster bounds
              const bounds = cluster.getBounds()
              if (bounds.isValid()) {
                map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 14
                })
              }
            }
          })
          .catch(err => {
            console.error('Error fetching city boundary:', err)
            // Fall back ke cluster bounds
            const bounds = cluster.getBounds()
            if (bounds.isValid()) {
              map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 14
              })
            }
          })

      })
      .catch(error => {
        console.error("Error fetching building data:", error)
      })

    return () => {
      if (buildingCluster.current) {
        buildingCluster.current.clearLayers()
      }
      if (boundaryLayer.current && mapRef.current) {
        mapRef.current.removeLayer(boundaryLayer.current)
      }
      markers.current = []
    }
  }, [provinsi, kota])
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start h-[480px]">
      <style>
        {`
          .rounded-icon {
            border-radius: 50%;
            background-color: white;
            padding: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .rounded-icon img {
            border-radius: 50%;
          }
          
          .building-tooltip {
            background-color: rgba(0, 0, 0, 0.75);
            color: #fff;
            border: none;
            box-shadow: none;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            transition: opacity 0.2s;
          }
          .building-tooltip::before {
            display: none;
          }
        `}
      </style>
      <div className="w-full md:w-1/2 flex flex-col">
        <CrudBuildings
          provFilter={provinsi}
          setProvFilter={setProvinsi}
          kotaFilter={kota}
          setKotaFilter={setKota}
          onSearchBuilding={handleSearchBuilding}
          externalSearch={selectedBuilding}
          setExternalSearch={setSelectedBuilding}
        />
      </div>
      <div className="w-full md:w-1/2 h-[480px] rounded-xl overflow-hidden mt-4 md:mt-0">
        <div ref={mapEl} id="map" className="h-full w-full" />
      </div>
    </div>
  )
}
