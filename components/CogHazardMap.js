// components/CogHazardMap.js
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Script from 'next/script'
import L from 'leaflet'
import { ChevronRight, Layers } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
// Note: markercluster CSS and JS will be handled via CDN for simplicity or if normally installed
import LayerServices from './LayerServices'
import ReactLegendOverlay from './ReactLegendOverlay'
import Modal from './ui/Modal'
import CrudHSBGN from './CrudHSBGN'
import CrudBuildings from './CrudBuildings'

function jenks(data, n_classes) {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.length <= n_classes) return [...new Set(data)].sort((a, b) => a - b);
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

// ─── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://upcxonhddesvrvttvjjt.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── Constants ──────────────────────────────────────────────────────────────────
const BASE_LAYERS = {
  road: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
}

const EXPOSURE_COLORS = {
  healthcare: '#ef4444',  // Red
  educational: '#3b82f6', // Blue
  electricity: '#f59e0b', // Yellow
  airport: '#8b5cf6',     // Purple
  hotel: '#ec4899'        // Pink
}

const DEFAULT_CURVES = {
  'banjir': {
    '1.0': { x: [0, 0.5, 1, 2, 3, 5], y: [0, 0.1, 0.35, 0.6, 0.8, 0.95] },
    '2.0': { x: [0, 1, 2, 3, 5], y: [0, 0, 0.1, 0.3, 0.6] }
  },
  'gempa': {
    'cr': { x: [0, 0.1, 0.3, 0.5, 0.7, 1.0, 1.2], y: [0, 0, 0.1, 0.45, 0.75, 0.95, 1.0] },
    'mcf': { x: [0, 0.1, 0.3, 0.5, 0.7, 1.0, 1.2], y: [0, 0, 0.05, 0.25, 0.55, 0.85, 1.0] }
  },
  'tsunami': {
    'cr': { x: [0, 0.5, 1, 3, 5, 10], y: [0, 0.2, 0.5, 0.85, 0.95, 1.0] },
    'mcf': { x: [0, 1, 2, 4, 6, 10], y: [0, 0, 0.15, 0.5, 0.75, 0.9] }
  }
}

const HAZARD_INFO = {
  earthquake: {
    label: 'Gempa Bumi (PGA)',
    icon: '🌍',
    colorStops: [
      [0.0, '#3B0764'], [0.15, '#1D4ED8'], [0.35, '#06B6D4'],
      [0.55, '#22C55E'], [0.75, '#EAB308'], [0.90, '#DC2626'], [1.0, '#FFFFFF'],
    ],
    unit: 'g',
  },
  flood: {
    label: 'Banjir (Normal)',
    icon: '🌊',
    colorStops: [
      [0.0, '#EFF6FF'], [0.2, '#93C5FD'], [0.45, '#3B82F6'],
      [0.7, '#1E40AF'], [1.0, '#1E3A5F'],
    ],
    unit: 'm',
  },
  flood_comp: {
    label: 'Banjir Kompensasi',
    icon: '💧',
    colorStops: [
      [0.0, '#ECFDF5'], [0.2, '#6EE7B7'], [0.5, '#10B981'],
      [0.8, '#065F46'], [1.0, '#022C22'],
    ],
    unit: 'm',
  },
  tsunami: {
    label: 'Tsunami',
    icon: '🌏',
    colorStops: [
      [0.0, '#FFF7ED'], [0.25, '#FCA5A5'], [0.55, '#EF4444'],
      [0.80, '#991B1B'], [1.0, '#450A0A'],
    ],
    unit: 'm',
  },
  drought_gpm: {
    label: 'Kekeringan (GPM)',
    icon: '☀️',
    colorStops: [
      [0.0, '#14532D'], [0.25, '#86EFAC'], [0.5, '#FDE68A'],
      [0.75, '#F97316'], [1.0, '#7F1D1D'],
    ],
    unit: '',
  },
  drought_mme: {
    label: 'Kekeringan (MME)',
    icon: '🏜️',
    colorStops: [
      [0.0, '#14532D'], [0.25, '#86EFAC'], [0.5, '#FDE68A'],
      [0.75, '#F97316'], [1.0, '#7F1D1D'],
    ],
    unit: '',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function detectHazard(filename) {
  const f = filename.toLowerCase().replace('cog_', '')
  if (f.startsWith('earthquake')) return 'earthquake'
  if (f.startsWith('flood_depth') && f.includes('_rc')) return 'flood_comp'
  if (f.startsWith('flood_depth')) return 'flood'
  if (f.startsWith('tsunami')) return 'tsunami'
  if (f.startsWith('drought') && f.includes('gpm')) return 'drought_gpm'
  if (f.startsWith('drought') && f.includes('mme')) return 'drought_mme'
  return null
}

function extractRP(filename) {
  // Matches ..._r<num>, ..._rc<num>, ..._rp<num>, ..._PGA_<num>, or just ..._<num> preceding .tif
  const m = filename.match(/_?(?:r|rc|rp|PGA_)?(\d+)(?:\.tif)?$/i) || filename.match(/(\d+)(?:\.tif)?$/i)
  return m ? parseInt(m[1]) : null
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function interpolateColor(colorStops, t) {
  for (let i = 0; i < colorStops.length - 1; i++) {
    const [t0, c0] = colorStops[i]
    const [t1, c1] = colorStops[i + 1]
    if (t >= t0 && t <= t1) {
      const ratio = (t - t0) / (t1 - t0)
      const [r0, g0, b0] = hexToRgb(c0)
      const [r1, g1, b1] = hexToRgb(c1)
      const r = Math.round(r0 + ratio * (r1 - r0))
      const g = Math.round(g0 + ratio * (g1 - g0))
      const b = Math.round(b0 + ratio * (b1 - b0))
      return `rgba(${r},${g},${b},0.85)`
    }
  }
  return null
}

// ─── Main component ──────────────────────────────────────────────────────────────
export default function CogHazardMap() {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const baseTiledLayer = useRef(null)
  const exposureCluster = useRef(null)
  const boundaryLayer = useRef(null)
  const pickMarkerRef = useRef(null)

  // track which CDN scripts are loaded
  const [georasterReady, setGeoRasterReady] = useState(false)
  const [geoLayerReady, setGeoLayerReady] = useState(false)
  const [geoblazeReady, setGeoblazeReady] = useState(false)
  const scriptsReady = georasterReady && geoLayerReady && geoblazeReady
  const geoCache = useRef(new Map()) // Memory cache for parsed georasters
  const [curveData, setCurveData] = useState(DEFAULT_CURVES)

  // Click/Selection State for Legend
  const [selectedData, setSelectedData] = useState({ intensity: null, damageRatio: null })
  const [legendInputMode, setLegendInputMode] = useState('pick') // 'pick' or 'manual'

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeBaseLayer, setActiveBaseLayer] = useState('road')
  const [opacityBasemap, setOpacityBasemap] = useState(1.0)
  const [infraLayers, setInfraLayers] = useState({
    healthcare: false, educational: false, electricity: false, airport: false, hotel: false,
    boundaries: false, aal: false, directLoss: false, modelHazard: false
  })

  // Data States
  const [metadata, setMetadata] = useState({})
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedRpId, setSelectedRpId] = useState('')
  const [exposureData, setExposureData] = useState(null)
  const [boundaryDataAAL, setBoundaryDataAAL] = useState(null)
  const [boundaryDataDL, setBoundaryDataDL] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [error, setError] = useState('')
  const [rasterStats, setRasterStats] = useState(null)
  const [fetchingExposure, setFetchingExposure] = useState(false)
  const [selectedBuildingHtml, setSelectedBuildingHtml] = useState(null)

  // Drag state for Building Detail Panel
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const [panelBuildings, setPanelBuildings] = useState([])

  const [kotaFilter, setKotaFilter] = useState('')

  const handlePointerDown = (e) => {
    // Only drag on the header area or panel itself, not on close button
    if (e.target.closest('.close-btn')) return;
    setIsDragging(true)
    dragStartPos.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPanelPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      })
    }
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Opacity States
  const [opacityHazard, setOpacityHazard] = useState(0.8)
  const [opacityAAL, setOpacityAAL] = useState(0.8)

  // Selected City State (boundary click)
  const [selectedCityFeature, setSelectedCityFeature] = useState(null)

  // Dedicated AAL Exposure State (decoupled from the point layer checkboxes)
  const [activeAalExposure, setActiveAalExposure] = useState('total')

  const [dataVersion, setDataVersion] = useState(0)
  const refreshAALData = useCallback(() => {
    setDataVersion(v => v + 1)
  }, [])

  // HSBGN Floating Panel State
  const [isHSBGNPanelOpen, setIsHSBGNPanelOpen] = useState(false)
  const [hsbgnPanelPos, setHsbgnPanelPos] = useState({ x: 0, y: 0 })
  const [isHsbgnDragging, setIsHsbgnDragging] = useState(false)
  const hsbgnDragStartPos = useRef({ x: 0, y: 0 })

  const handleHsbgnPointerDown = (e) => {
    // Only drag on the header area or panel itself, not on interactive elements
    if (e.target.closest('.no-drag')) return;
    setIsHsbgnDragging(true)
    hsbgnDragStartPos.current = { x: e.clientX - hsbgnPanelPos.x, y: e.clientY - hsbgnPanelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleHsbgnPointerMove = (e) => {
    if (isHsbgnDragging) {
      setHsbgnPanelPos({
        x: e.clientX - hsbgnDragStartPos.current.x,
        y: e.clientY - hsbgnDragStartPos.current.y
      })
    }
  }

  const handleHsbgnPointerUp = (e) => {
    setIsHsbgnDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Bangunan Floating Panel State
  const [isBangunanPanelOpen, setIsBangunanPanelOpen] = useState(false)
  const [bangunanPanelPos, setBangunanPanelPos] = useState({ x: 0, y: 0 })
  const [isBangunanDragging, setIsBangunanDragging] = useState(false)
  const bangunanDragStartPos = useRef({ x: 0, y: 0 })

  const handleBangunanPointerDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsBangunanDragging(true)
    bangunanDragStartPos.current = { x: e.clientX - bangunanPanelPos.x, y: e.clientY - bangunanPanelPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleBangunanPointerMove = (e) => {
    if (isBangunanDragging) {
      setBangunanPanelPos({
        x: e.clientX - bangunanDragStartPos.current.x,
        y: e.clientY - bangunanDragStartPos.current.y
      })
    }
  }

  const handleBangunanPointerUp = (e) => {
    setIsBangunanDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const isExposureActive = useMemo(() => {
    return Object.keys(infraLayers).some(k => k !== 'boundaries' && infraLayers[k])
  }, [infraLayers])

  // ── Handle Base Layer Change ───────────────────────────────────────────────
  const updateBaseLayer = useCallback((layerKey) => {
    if (!mapRef.current) return
    if (baseTiledLayer.current) {
      mapRef.current.removeLayer(baseTiledLayer.current)
    }
    const url = BASE_LAYERS[layerKey]
    baseTiledLayer.current = L.tileLayer(url, {
      attribution: '© OpenStreetMap researchers',
      maxZoom: 19,
    }).addTo(mapRef.current)
    setActiveBaseLayer(layerKey)
  }, [])

  // ── Init Leaflet map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    const map = L.map(mapEl.current, {
      center: [-8.45, 115.05], // Geser sedikit ke barat daya agar pas di tengah karena ada sidebar
      zoom: 9.5,
      zoomSnap: 0.5,
      zoomControl: false,
    })

    // Create specific panes for Z-Index ordering
    map.createPane('boundaryPane') // Below rasters
    map.getPane('boundaryPane').style.zIndex = 300

    map.createPane('rasterPane')   // Above boundary but below UI/Markers
    map.getPane('rasterPane').style.zIndex = 400

    map.createPane('markerPane')   // Above everything
    map.getPane('markerPane').style.zIndex = 500

    // Init with road layer
    baseTiledLayer.current = L.tileLayer(BASE_LAYERS.road, {
      attribution: '© OpenStreetMap developers',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── Apply Transparency to Base Layer ──────────────────────────────────────────
  useEffect(() => {
    if (baseTiledLayer.current && typeof baseTiledLayer.current.setOpacity === 'function') {
      baseTiledLayer.current.setOpacity(opacityBasemap)
    }
  }, [opacityBasemap, activeBaseLayer])


  // ── Fetch metadata from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_KEY) return
    setFetchingMeta(true)
    fetch(
      `${SUPABASE_URL}/rest/v1/raster_metadata?select=filename,public_url&order=filename`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json',
        },
      }
    )
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(rows => {
        const grouped = {}
        rows.forEach(({ filename, public_url }) => {
          if (filename.toLowerCase().includes('drought')) {
            console.log('DROUGHT FILE FOUND:', filename);
          }
          const hazard = detectHazard(filename)
          if (!hazard) return
          if (!grouped[hazard]) grouped[hazard] = []
          grouped[hazard].push({ filename, public_url, rp: extractRP(filename), type: hazard })
        })
        Object.values(grouped).forEach(arr =>
          arr.sort((a, b) => (a.rp || 0) - (b.rp || 0))
        )
        setMetadata(grouped)
      })
      .catch(e => setError('Gagal memuat metadata: ' + e.message))
      .finally(() => setFetchingMeta(false))
  }, [])

  // ── Fetch Disaster Curves ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCurves = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/disaster-curves`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setCurveData(prev => ({ ...prev, ...data }))
      } catch (err) {
        console.warn('Disaster curves unavailable:', err.message)
      }
    }
    fetchCurves()
  }, [])

  // ── Fetch Exposure Data (Background on Mount) ────────────────────────────────
  useEffect(() => {
    const prefetch = async () => {
      const url = `${BACKEND_URL}/api/gedung?provinsi=Bali${dataVersion > 0 ? `&_v=${dataVersion}` : ''}`
      const cacheName = 'exposure-cache-v2'

      try {
        const cache = await caches.open(cacheName)
        const cachedResponse = await cache.match(url)

        if (cachedResponse) {
          // Serve from cache immediately
          const data = await cachedResponse.json()
          setExposureData(data)
        } else {
          setFetchingExposure(true)
        }

        // Freshness check in background
        const head = await fetch(url, { method: 'HEAD' })
        const serverModified = head.headers.get('last-modified')
        const cacheModified = cachedResponse?.headers.get('last-modified')

        if (!cachedResponse || (serverModified && cacheModified && serverModified !== cacheModified)) {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response.clone())
            const data = await response.json()
            setExposureData(data)
          }
        }
      } catch (e) {
        console.error('Exposure fetch failed:', e)
      } finally {
        setFetchingExposure(false)
      }
    }
    prefetch()
  }, [dataVersion]) // Depend on dataVersion to allow refetch Trigger

  // ── Fetch Boundary Data (Background on Mount) ────────────────────────────────
  useEffect(() => {
    const fetchBoundaries = async () => {
      const urlAal = `${BACKEND_URL}/api/aal-kota${dataVersion > 0 ? `?_v=${dataVersion}` : ''}`
      const urlDl = `${BACKEND_URL}/api/rekap-aset-kota${dataVersion > 0 ? `?_v=${dataVersion}` : ''}`
      const cacheName = 'boundary-cache-v4'

      try {
        const cache = await caches.open(cacheName)

        // --- 1. Fetch AAL ---
        let resAal = await cache.match(urlAal)
        if (resAal) {
          const dataAal = await resAal.json()
          setBoundaryDataAAL(dataAal)
        }

        let headAal = await fetch(urlAal, { method: 'HEAD' }).catch(() => null)
        let serverModAal = headAal ? headAal.headers.get('last-modified') : null
        let cacheModAal = resAal ? resAal.headers.get('last-modified') : null

        if (!resAal || (serverModAal && cacheModAal && serverModAal !== cacheModAal)) {
          const respAal = await fetch(urlAal).catch(() => null)
          if (respAal && respAal.ok) {
            await cache.put(urlAal, respAal.clone())
            setBoundaryDataAAL(await respAal.json())
          }
        }

        // --- 2. Fetch Direct Loss ---
        const urlDlFresh = `${urlDl}?t=${Date.now()}`
        try {
          const respDl = await fetch(urlDlFresh)
          if (respDl.ok) {
            await cache.put(urlDl, respDl.clone())
            setBoundaryDataDL(await respDl.json())
          }
        } catch (e) {
          // Fallback to cache
          let resDl = await cache.match(urlDl)
          if (resDl) {
            setBoundaryDataDL(await resDl.json())
          }
        }

      } catch (e) {
        console.error('Boundary fetch failed:', e)
      }
    }
    fetchBoundaries()
  }, [dataVersion])

  // ── Effect to update Exposure Markers ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !exposureData) return

    if (!exposureCluster.current) {
      exposureCluster.current = L.layerGroup().addTo(mapRef.current)
    }

    const activeTypes = Object.keys(infraLayers).filter(k => infraLayers[k])
    exposureCluster.current.clearLayers()

    if (activeTypes.length === 0) return

    const markers = []
    exposureData.features.forEach(f => {
      // Filter by city if Building Management panel is open and a city is selected
      if (isBangunanPanelOpen && kotaFilter) {
        const pCity = (f.properties.kota || '').toUpperCase()
        if (!pCity.includes(kotaFilter.toUpperCase())) return
      }

      const id = (f.properties.id_bangunan || '').toUpperCase()
      let type = null
      if (id.startsWith('FS') && infraLayers.healthcare) type = 'healthcare'
      else if (id.startsWith('FD') && infraLayers.educational) type = 'educational'
      else if (id.startsWith('ELECTRICITY') && infraLayers.electricity) type = 'electricity'
      else if (id.startsWith('AIRPORT') && infraLayers.airport) type = 'airport'
      else if (id.startsWith('HOTEL') && infraLayers.hotel) type = 'hotel'

      if (type) {
        const [lon, lat] = f.geometry.coordinates
        const marker = L.circleMarker([lat, lon], {
          radius: 3,
          fillColor: EXPOSURE_COLORS[type],
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
          pane: 'markerPane'
        })
        marker.bindTooltip(`<strong>${f.properties.nama_gedung || 'Tanpa Nama'}</strong>`, {
          direction: 'top',
          offset: [0, -5],
          opacity: 0.9,
          className: 'exposure-tooltip'
        })
        const p = f.properties

        const luasVal = parseFloat(p.luas) || 0;
        const hsbgnVal = parseFloat(p.hsbgn) || 0;
        const assetValue = luasVal * hsbgnVal;

        const formatNumberWithUnit = (value) => {
          if (value == null || isNaN(value)) return '0'
          if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T'
          if (value >= 1e9) return (value / 1e9).toFixed(2) + ' M'
          if (value >= 1e6) return (value / 1e6).toFixed(2) + ' jt'
          if (value >= 1e3) return (value / 1e3).toFixed(2) + ' rb'
          return value.toString()
        }

        const formatPercent = (loss, totalVal) => {
          if (!totalVal || totalVal === 0 || !loss) return '<span class="text-gray-400 font-normal">(0%)</span>'
          const pct = (loss / totalVal) * 100
          if (pct < 0.1 && pct > 0) return '<span class="text-gray-400 font-normal">(<0.1%)</span>'
          if (pct >= 99.9) return '<span class="text-red-500 font-normal opacity-80">(100%)</span>'
          return `<span class="text-gray-500 font-normal opacity-80">(${pct.toFixed(1)}%)</span>`
        }

        const assetStr = assetValue > 0 ? formatNumberWithUnit(assetValue) : '-';

        const popupHtml = `
          <div class="flex flex-col gap-2 font-[SF Pro] text-left">
            <!-- Header -->
            <div>
              <h3 class="font-bold text-[13px] text-gray-800 leading-tight">${p.nama_gedung || 'Tanpa Nama'}</h3>
              <p class="text-[10px] text-gray-500 italic mt-0.5">${p.taxonomy || '-'} • Lt: ${p.jumlah_lantai || '-'} • ${p.kota || ''}</p>
              <p class="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">${p.alamat || '-'}</p>
            </div>
            
            <!-- Core Attrs -->
            <div class="grid grid-cols-2 gap-1 text-[10px] bg-slate-50 p-1.5 rounded-md border border-slate-100">
              <div class="text-gray-500 flex flex-col leading-tight"><span>Luas</span><span class="font-semibold text-gray-700">${p.luas || '-'} m²</span></div>
              <div class="text-gray-500 flex flex-col leading-tight"><span>Nilai Aset</span><span class="font-semibold text-gray-700">Rp ${assetStr}</span></div>
            </div>

            <!-- Hazards -->
            <div class="space-y-1.5 mt-1 border-t border-gray-100 pt-1.5">
              
              <!-- Gempa -->
              <div class="border-l-2 border-blue-500 pl-1.5">
                <div class="text-[10px] font-bold text-blue-600 leading-none mb-1">Gempa (PGA)</div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-gray-600">
                  <div>1000th: <b>${formatNumberWithUnit(p.direct_loss_pga_1000 || 0)}</b> ${formatPercent(p.direct_loss_pga_1000, assetValue)}</div>
                  <div>500th: <b>${formatNumberWithUnit(p.direct_loss_pga_500 || 0)}</b> ${formatPercent(p.direct_loss_pga_500, assetValue)}</div>
                  <div>250th: <b>${formatNumberWithUnit(p.direct_loss_pga_250 || 0)}</b> ${formatPercent(p.direct_loss_pga_250, assetValue)}</div>
                  <div>200th: <b>${formatNumberWithUnit(p.direct_loss_pga_200 || 0)}</b> ${formatPercent(p.direct_loss_pga_200, assetValue)}</div>
                  <div class="col-span-2">100th: <b>${formatNumberWithUnit(p.direct_loss_pga_100 || 0)}</b> ${formatPercent(p.direct_loss_pga_100, assetValue)}</div>
                </div>
              </div>

              <!-- Banjir R -->
              <div class="border-l-2 border-green-500 pl-1.5">
                <div class="text-[10px] font-bold text-green-600 leading-none mb-1">Banjir (R)</div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-gray-600">
                  <div>250th: <b>${formatNumberWithUnit(p.direct_loss_r_250 || 0)}</b> ${formatPercent(p.direct_loss_r_250, assetValue)}</div>
                  <div>100th: <b>${formatNumberWithUnit(p.direct_loss_r_100 || 0)}</b> ${formatPercent(p.direct_loss_r_100, assetValue)}</div>
                  <div>50th: <b>${formatNumberWithUnit(p.direct_loss_r_50 || 0)}</b> ${formatPercent(p.direct_loss_r_50, assetValue)}</div>
                  <div>25th: <b>${formatNumberWithUnit(p.direct_loss_r_25 || 0)}</b> ${formatPercent(p.direct_loss_r_25, assetValue)}</div>
                  <div>10th: <b>${formatNumberWithUnit(p.direct_loss_r_10 || 0)}</b> ${formatPercent(p.direct_loss_r_10, assetValue)}</div>
                  <div>5th: <b>${formatNumberWithUnit(p.direct_loss_r_5 || 0)}</b> ${formatPercent(p.direct_loss_r_5, assetValue)}</div>
                  <div class="col-span-2">2th: <b>${formatNumberWithUnit(p.direct_loss_r_2 || 0)}</b> ${formatPercent(p.direct_loss_r_2, assetValue)}</div>
                </div>
              </div>

              <!-- Banjir RC -->
              <div class="border-l-2 border-emerald-500 pl-1.5">
                <div class="text-[10px] font-bold text-emerald-600 leading-none mb-1">Banjir (RC)</div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-gray-600">
                  <div>250th: <b>${formatNumberWithUnit(p.direct_loss_rc_250 || 0)}</b> ${formatPercent(p.direct_loss_rc_250, assetValue)}</div>
                  <div>100th: <b>${formatNumberWithUnit(p.direct_loss_rc_100 || 0)}</b> ${formatPercent(p.direct_loss_rc_100, assetValue)}</div>
                  <div>50th: <b>${formatNumberWithUnit(p.direct_loss_rc_50 || 0)}</b> ${formatPercent(p.direct_loss_rc_50, assetValue)}</div>
                  <div>25th: <b>${formatNumberWithUnit(p.direct_loss_rc_25 || 0)}</b> ${formatPercent(p.direct_loss_rc_25, assetValue)}</div>
                  <div>10th: <b>${formatNumberWithUnit(p.direct_loss_rc_10 || 0)}</b> ${formatPercent(p.direct_loss_rc_10, assetValue)}</div>
                  <div>5th: <b>${formatNumberWithUnit(p.direct_loss_rc_5 || 0)}</b> ${formatPercent(p.direct_loss_rc_5, assetValue)}</div>
                  <div class="col-span-2">2th: <b>${formatNumberWithUnit(p.direct_loss_rc_2 || 0)}</b> ${formatPercent(p.direct_loss_rc_2, assetValue)}</div>
                </div>
              </div>

              <!-- Tsunami -->
              <div class="border-l-2 border-cyan-500 pl-1.5">
                <div class="text-[10px] font-bold text-cyan-600 leading-none mb-1">Tsunami (Inundansi)</div>
                <div class="text-[9px] text-gray-600 leading-tight">
                  Total: <b>${formatNumberWithUnit(p.direct_loss_inundansi || 0)}</b> ${formatPercent(p.direct_loss_inundansi, assetValue)}
                </div>
              </div>

            </div>
          </div>
        `;

        marker.on('click', () => {
          // Reset panel position when selecting a new building
          setPanelPos({ x: 0, y: 0 })
          setSelectedBuildingHtml(popupHtml)
        })

        markers.push(marker)
      }
    })
    markers.forEach(m => exposureCluster.current.addLayer(m))
  }, [infraLayers, scriptsReady, exposureData, kotaFilter, isBangunanPanelOpen])

  // ── Effect to update Panel Buildings Zoom Bounds ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    if (!isBangunanPanelOpen || panelBuildings.length === 0) return

    const lats = []
    const lons = []

    panelBuildings.forEach(b => {
      const lat = parseFloat(b.lat)
      const lon = parseFloat(b.lon)
      if (isNaN(lat) || isNaN(lon)) return

      lats.push(lat)
      lons.push(lon)
    })

    if (lats.length > 0 && lons.length > 0) {
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)]
      )
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      }
    }

  }, [panelBuildings, isBangunanPanelOpen])

  // ── Update Boundary Layer ────────────────────────────────────────────────────
  const highlightedBoundaryRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return

    // Choose which boundary data to use based on toggles
    let activeBoundaryData = null;
    if (infraLayers.aal) activeBoundaryData = boundaryDataAAL;
    else if (infraLayers.directLoss) activeBoundaryData = boundaryDataDL;
    else if (infraLayers.boundaries) activeBoundaryData = boundaryDataAAL || boundaryDataDL; // Fallback to either if just boundary is toggled

    if (!activeBoundaryData) {
      if (boundaryLayer.current) {
        mapRef.current.removeLayer(boundaryLayer.current)
        boundaryLayer.current = null
      }
      return;
    }

    if (boundaryLayer.current) {
      mapRef.current.removeLayer(boundaryLayer.current)
      boundaryLayer.current = null
    }

    if (infraLayers.boundaries || infraLayers.aal || infraLayers.directLoss) {
      let activeMetric = null;
      let grades = [];
      const aalColors = ['#1a9850', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027', '#7f0000'];

      if ((infraLayers.aal || infraLayers.directLoss) && selectedGroup) {
        let hazPrefix = '';
        let rp = '';

        if (selectedRpId) {
          const parts = selectedRpId.split('_');
          rp = parts[parts.length - 1];
          if (rp === 'default') rp = '';
        }

        if (infraLayers.directLoss) {
          if (selectedGroup === 'banjir') {
            hazPrefix = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
            if (rp) activeMetric = `dl_sum_${hazPrefix}_${rp}`;
          }
          else if (selectedGroup === 'earthquake') {
            hazPrefix = 'pga';
            if (rp) activeMetric = `dl_sum_${hazPrefix}_${rp}`;
          }
          else if (selectedGroup === 'tsunami') {
            hazPrefix = 'inundansi';
            activeMetric = `dl_sum_${hazPrefix}`;
          }
        }
        else if (infraLayers.aal) {
          if (selectedGroup === 'banjir') hazPrefix = (selectedRpId && selectedRpId.includes('comp')) ? 'rc' : 'r';
          else if (selectedGroup === 'earthquake') hazPrefix = 'pga';
          else if (selectedGroup === 'tsunami') hazPrefix = 'inundansi';
          activeMetric = `aal_${hazPrefix}_${activeAalExposure || 'total'}`;
        }

        if (activeMetric) {
          const vals = activeBoundaryData.features.map(f => f.properties[activeMetric] || 0).filter(v => typeof v === 'number' && !isNaN(v));
          if (vals.length > 0) {
            const nClasses = vals.length > 30 ? 6 : 5;
            grades = jenks(vals, nClasses).sort((a, b) => a - b);
          }
        }
      }

      const getFillColor = (val) => {
        if (!activeMetric || grades.length === 0) return '#f97316';
        if (val === 0) return aalColors[0];
        for (let i = 0; i < grades.length - 1; i++) {
          if (val >= grades[i] && val < grades[i + 1]) return aalColors[i];
        }
        return aalColors[aalColors.length - 1] || aalColors[aalColors.length - 2];
      };

      const defaultStyle = (feature) => {
        const val = activeMetric ? (feature.properties[activeMetric] || 0) : 0;
        return {
          color: activeMetric ? '#ffffff' : '#f97316',
          weight: activeMetric ? 1 : 1.5,
          opacity: activeMetric ? opacityAAL : 0.8,
          fillOpacity: activeMetric ? (opacityAAL * 0.8) : 0,
          fillColor: activeMetric ? getFillColor(val) : 'transparent',
          dashArray: activeMetric ? '' : '4'
        };
      };

      const highlightStyle = (feature) => {
        if (activeMetric) {
          return { weight: 2, color: '#64748b', fillOpacity: opacityAAL, dashArray: '' };
        }
        return { color: '#ea580c', weight: 3, opacity: 1, fillOpacity: 0, fillColor: 'transparent', dashArray: '' };
      };

      const fmtPopup = n => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

      boundaryLayer.current = L.geoJSON(activeBoundaryData, {
        pane: 'boundaryPane',
        style: defaultStyle,
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.id_kota) {
            const val = activeMetric ? (feature.properties[activeMetric] || 0) : null;
            let tooltipLabel = "AAL";
            if (infraLayers.directLoss) tooltipLabel = "Direct Loss";

            const tooltipContent = activeMetric && val > 0
              ? `<strong>${feature.properties.id_kota}</strong><br/>${tooltipLabel}: ${fmtPopup(val)}`
              : `<strong>${feature.properties.id_kota}</strong>`;

            layer.bindTooltip(tooltipContent, {
              sticky: true,
              className: 'boundary-tooltip'
            });

            layer.on('click', (e) => {
              if (highlightedBoundaryRef.current) {
                boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
              }
              layer.setStyle(highlightStyle(feature));
              highlightedBoundaryRef.current = layer;
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
              }

              // Set selected city for chart
              setSelectedCityFeature(feature);

              if (mapRef.current && !activeMetric) {
                mapRef.current.fitBounds(layer.getBounds(), {
                  padding: [20, 20],
                  maxZoom: 12,
                  animate: true
                });
              }

              // NEW: Forward the click event to the map to trigger Pick Point
              if (mapRef.current) {
                mapRef.current.fire('click', { latlng: e.latlng, layerPoint: e.layerPoint, containerPoint: e.containerPoint });
              }
            });
          }
        }
      }).addTo(mapRef.current);
    }
  }, [infraLayers.boundaries, infraLayers.aal, infraLayers.directLoss, selectedGroup, selectedRpId, boundaryDataAAL, boundaryDataDL, opacityAAL, activeAalExposure])

  // ── Grouped Derived Data ────────────────────────────────────────────────────────
  const hazardGroupFiles = useMemo(() => {
    if (!selectedGroup) return []

    let keys = []
    if (selectedGroup === 'banjir') keys = ['flood', 'flood_comp']
    else if (selectedGroup === 'earthquake') keys = ['earthquake']
    else if (selectedGroup === 'tsunami') keys = ['tsunami']
    else if (selectedGroup === 'kekeringan') keys = ['drought_gpm', 'drought_mme']

    let combined = []
    keys.forEach(k => {
      if (metadata[k]) {
        metadata[k].forEach(f => {
          combined.push({
            ...f,
            uniqueId: `${f.type}_${f.rp || 'default'}`,
            displayLabel: k === 'flood_comp' ? `${f.rp} Tahun (Kompensasi)`
              : k === 'flood' ? `${f.rp} Tahun (Normal)`
                : k === 'drought_gpm' ? `GPM ${f.rp} Tahun`
                  : k === 'drought_mme' ? `MME ${f.rp} Tahun`
                    : f.rp ? `${f.rp} Tahun` : 'Default'
          })
        })
      }
    })

    return combined.sort((a, b) => (a.rp || 0) - (b.rp || 0))
  }, [selectedGroup, metadata])

  const isSingleLayer = useMemo(() => {
    return hazardGroupFiles.length === 1 && hazardGroupFiles[0].rp === null
  }, [hazardGroupFiles])

  // Reset selection when group changes
  useEffect(() => {
    setSelectedRpId('')
    if (selectedGroup === null) {
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setRasterStats(null)
    } else {
      // Do not auto-select first RP of new group so 'Pilih Return Period' is shown
    }
  }, [selectedGroup, hazardGroupFiles])

  // ── Damage Calculation Helper ────────────────────────────────────────────────
  const calculateDamage = useCallback((curveKey, intensity) => {
    if (!curveData || !curveData[curveKey] || intensity == null) return null

    let processedIntensity = intensity
    const curves = curveData[curveKey]
    const taxos = (curveKey === 'gempa' || curveKey === 'tsunami') ? ['cr', 'mcf'] : ['1.0', '2.0']

    if (intensity <= 0) {
      const results = {}
      taxos.forEach(t => { results[t] = 0 })
      return results
    }

    // ── PGA to MMI Conversion for Earthquake ─────────────────────────────────
    // If it's gempa and the intensities in the curve look like MMI (e.g. max > 2)
    // and our input looks like PGA (e.g. < 2)
    if (curveKey === 'gempa') {
      const allX = Object.values(curves).flatMap(c => c.x)
      const maxCurveX = Math.max(...allX)
      if (maxCurveX > 3 && processedIntensity < 2) {
        // PGA (g) to MMI conversion (Wald et al. 1999)
        // Convert g to cm/s^2 (gal)
        const pgaGal = processedIntensity * 980
        if (pgaGal < 1) processedIntensity = 1
        else if (pgaGal < 135) {
          processedIntensity = 2 * Math.log10(pgaGal) + 1.15
        } else {
          processedIntensity = 3.66 * Math.log10(pgaGal) - 1.66
        }
        console.log(`Converted PGA ${intensity}g to MMI ${processedIntensity.toFixed(2)}`)
      }
    }

    const results = {}

    taxos.forEach(t => {
      // Find curve with case-insensitive match
      const cKey = Object.keys(curves).find(k => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === (t + '.0'))
      const curve = curves[cKey]

      if (curve && curve.x.length > 0) {
        let damage = 0
        const ptsX = curve.x, ptsY = curve.y
        if (processedIntensity <= ptsX[0]) {
          damage = ptsY[0]
        } else if (processedIntensity >= ptsX[ptsX.length - 1]) {
          if (curveKey === 'tsunami') {
            const n = ptsX.length;
            if (n >= 2) {
              const x0 = ptsX[n - 2], y0 = ptsY[n - 2];
              const x1 = ptsX[n - 1], y1 = ptsY[n - 1];
              const slope = (y1 - y0) / (x1 - x0);
              damage = y1 + slope * (processedIntensity - x1);
              if (damage > 1.0) damage = 1.0;
            } else {
              damage = 1.0;
            }
          } else {
            damage = ptsY[ptsY.length - 1]
          }
        } else {
          for (let i = 1; i < ptsX.length; i++) {
            if (processedIntensity <= ptsX[i]) {
              const x0 = ptsX[i - 1], y0 = ptsY[i - 1]
              const x1 = ptsX[i], y1 = ptsY[i]
              damage = y0 + (y1 - y0) * (processedIntensity - x0) / (x1 - x0)
              break
            }
          }
        }
        results[t] = damage
      }
    })
    return results
  }, [curveData])


  // ── Mouse/Click Interaction Logic ──────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return
    const map = mapRef.current

    const onMapClick = (e) => {
      console.log('Map clicked at:', e.latlng);

      if (pickMarkerRef.current) {
        map.removeLayer(pickMarkerRef.current)
      }
      pickMarkerRef.current = L.circleMarker(e.latlng, {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        pane: 'markerPane'
      }).addTo(map)

      const georaster = layerRef.current?.options?.georaster
      if (!georaster || !window.geoblaze) {
        console.warn('Georaster or geoblaze not ready', { hasGeoraster: !!georaster, hasGeoblaze: !!window.geoblaze });
        return
      }

      try {
        const { lat, lng } = e.latlng
        const result = window.geoblaze.identify(georaster, [lng, lat])
        console.log('Geoblaze identify result:', result);
        let intensity = result ? result[0] : null

        if (intensity == null || intensity === georaster.noDataValue || isNaN(intensity)) {
          intensity = 0
        }

        const curveMap = { flood: 'banjir', flood_comp: 'banjir', earthquake: 'gempa', tsunami: 'tsunami' }
        const currentHazardKey = rasterStats?.hazardKey || layerRef.current.options.hazardKey
        const curveKey = curveMap[currentHazardKey]
        console.log('Calculated Hazard Key:', { currentHazardKey, curveKey, intensity });
        const dmg = calculateDamage(curveKey, intensity)
        console.log('Calculated Damage:', dmg);
        setSelectedData({ intensity, damageRatio: dmg })
      } catch (err) {
        console.error('Error during geoblaze identify:', err);
        setSelectedData({ intensity: 0, damageRatio: null })
      }
    }

    if (legendInputMode === 'pick') {
      map.on('click', onMapClick)
      // Apply crosshair cursor to the map container for visual feedback
      if (mapEl.current) mapEl.current.style.cursor = 'crosshair'

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'none'
    } else {
      map.off('click', onMapClick)
      if (mapEl.current) mapEl.current.style.cursor = ''

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'auto'

      if (pickMarkerRef.current) {
        map.removeLayer(pickMarkerRef.current)
        pickMarkerRef.current = null
      }
    }

    return () => {
      map.off('click', onMapClick)
      if (mapEl.current) mapEl.current.style.cursor = ''

      const boundaryPane = map.getPane('boundaryPane')
      if (boundaryPane) boundaryPane.style.pointerEvents = 'auto'
    }
  }, [rasterStats?.hazardKey, calculateDamage, legendInputMode])


  // ── Search Logic ─────────────────────────────────────────────────────────────
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    if (!query || query.length < 2 || !exposureData) {
      setSearchResults([])
      return
    }

    const activeTypes = Object.keys(infraLayers).filter(k => k !== 'boundaries' && infraLayers[k])
    const results = exposureData.features
      .filter(f => {
        const id = (f.properties.id_bangunan || '').toUpperCase()
        let type = null
        if (id.startsWith('FS') && infraLayers.healthcare) type = 'healthcare'
        else if (id.startsWith('FD') && infraLayers.educational) type = 'educational'
        else if (id.startsWith('ELECTRICITY') && infraLayers.electricity) type = 'electricity'
        else if (id.startsWith('AIRPORT') && infraLayers.airport) type = 'airport'
        else if (id.startsWith('HOTEL') && infraLayers.hotel) type = 'hotel'
        if (!type) return false

        const name = (f.properties.nama_gedung || '').toLowerCase()
        const addr = (f.properties.alamat || '').toLowerCase()
        const q = query.toLowerCase()
        return name.includes(q) || addr.includes(q)
      })
      .slice(0, 5)
    setSearchResults(results)
  }, [exposureData, infraLayers])

  const handleSearchSelect = useCallback((feature) => {
    if (!mapRef.current) return
    const [lon, lat] = feature.geometry.coordinates
    setSearchQuery(feature.properties.nama_gedung || '')
    setSearchResults([])

    mapRef.current.setView([lat, lon], 17, { animate: true })

    // Open popup after a short delay for the zoom animation
    setTimeout(() => {
      L.popup()
        .setLatLng([lat, lon])
        .setContent(`
          <div style="font-family: inherit; min-width: 200px;">
            <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">${feature.properties.nama_gedung || 'Tanpa Nama'}</div>
            <div style="font-size: 11px; color: #6b7280; font-style: italic; margin-bottom: 8px;">${feature.properties.alamat || '-'}</div>
          </div>
        `)
        .openOn(mapRef.current)
    }, 500)
  }, [])

  // Helper to DRY render logic
  const renderLayer = async (georaster, rMin, rMax, hazardKey) => {
    const GeoRasterLayer = window.GeoRasterLayer
    if (layerRef.current && mapRef.current) {
      mapRef.current.removeLayer(layerRef.current)
    }
    const info = HAZARD_INFO[hazardKey]
    const noData = georaster.noDataValue
    const layer = new GeoRasterLayer({
      georaster,
      opacity: opacityHazard,
      resolution: 256,
      pane: 'rasterPane', // Ensure sit on top of AAL boundaries
      pixelValuesToColorFn: (values) => {
        const v = values[0]
        if (v == null || isNaN(v) || v === noData) return null
        // Skip exactly 0 as it usually represents safe/background in integer masks, but allow negative indices for drought.
        if (v === 0 && rMin >= 0) return null

        const t = Math.max(0, Math.min(1, (v - rMin) / (rMax - rMin)))
        return info ? interpolateColor(info.colorStops, t) : null
      },
    })
    layer.addTo(mapRef.current)
    layerRef.current = layer
    mapRef.current.fitBounds(layer.getBounds())
    setRasterStats({ hazardKey, min: rMin, max: rMax })
  }

  // ── Load COG layer ────────────────────────────────────────────────────────────
  const loadCOG = useCallback(async (publicUrl, hazardKey) => {
    const parseGeoraster = window.parseGeoraster
    const GeoRasterLayer = window.GeoRasterLayer

    if (!parseGeoraster || !GeoRasterLayer) {
      setError('Library belum siap.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let georaster = null
      let rMin, rMax

      // 1. Check Memory Cache
      if (geoCache.current.has(publicUrl)) {
        console.log('Serving from memory cache:', publicUrl)
        const cached = geoCache.current.get(publicUrl)
        georaster = cached.georaster
        rMin = cached.rMin
        rMax = cached.rMax
      } else {
        // 2. Check Persistence Cache
        const cacheName = 'cog-cache-v1'
        const cache = await caches.open(cacheName)
        const cachedResponse = await cache.match(publicUrl)

        if (cachedResponse) {
          console.log('Serving from persistent cache (initial):', publicUrl)
          const arrayBuffer = await cachedResponse.clone().arrayBuffer()
          georaster = await parseGeoraster(arrayBuffer)
          rMin = georaster.mins[0]; rMax = georaster.maxs[0];
          if (rMin == null || rMax == null || rMin === rMax) { rMin = 0; rMax = 1; }

          await renderLayer(georaster, rMin, rMax, hazardKey)
          setLoading(false)
          const head = await fetch(publicUrl, { method: 'HEAD' })
          const serverModified = head.headers.get('last-modified')
          const cacheModified = cachedResponse.headers.get('last-modified')

          if (serverModified && cacheModified && serverModified !== cacheModified) {
            console.log('Persistent cache obsolete, updating...')
            const res = await fetch(publicUrl)
            if (res.ok) {
              await cache.put(publicUrl, res.clone())
              const newBuf = await res.arrayBuffer()
              const newGeo = await parseGeoraster(newBuf)
              const nrMin = newGeo.mins[0], nrMax = newGeo.maxs[0]
              await renderLayer(newGeo, nrMin || 0, nrMax || 1, hazardKey)
              geoCache.current.set(publicUrl, { georaster: newGeo, rMin: nrMin || 0, rMax: nrMax || 1 })
            }
          } else {
            geoCache.current.set(publicUrl, { georaster, rMin, rMax })
          }
          return
        }

        // 4. No cache - Full Fetch
        console.log('No cache found. Fetching...')
        const response = await fetch(publicUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        await cache.put(publicUrl, response.clone())
        const arrayBuffer = await response.arrayBuffer()
        georaster = await parseGeoraster(arrayBuffer)
        rMin = georaster.mins[0]; rMax = georaster.maxs[0];
        if (rMin == null || rMax == null || rMin === rMax) { rMin = 0; rMax = 1; }
        geoCache.current.set(publicUrl, { georaster, rMin, rMax })
      }

      await renderLayer(georaster, rMin, rMax, hazardKey)
    } catch (e) {
      setError('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [HAZARD_INFO])

  useEffect(() => {
    if (!infraLayers.modelHazard) {
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setRasterStats(null)
      return
    }

    if (!selectedGroup || hazardGroupFiles.length === 0) {
      return
    }

    let file = isSingleLayer ? hazardGroupFiles[0] : null
    if (!file && selectedRpId) {
      file = hazardGroupFiles.find(f => f.uniqueId === selectedRpId)
    }
    if (!file && hazardGroupFiles.length > 0) {
      file = hazardGroupFiles[0]
    }

    if (file) {
      loadCOG(file.public_url, file.type)
    }
  }, [infraLayers.modelHazard, selectedGroup, hazardGroupFiles, isSingleLayer, selectedRpId, loadCOG])

  // ── Clear COG when selection is removed ──────────────────────────────────────
  useEffect(() => {
    if (!selectedGroup) {
      setSelectedRpId('')
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current)
        layerRef.current = null
      }
      setSelectedData({ intensity: null, damageRatio: null })
      setRasterStats(null)
    }
  }, [selectedGroup])

  // ── Immediate Opacity Update ──────────────────────────────────────────────────
  useEffect(() => {
    if (layerRef.current && typeof layerRef.current.setOpacity === 'function') {
      layerRef.current.setOpacity(opacityHazard)
    }
  }, [opacityHazard])

  // ── Programmatic City Selection (Dropdown) ──────────────────────────────────
  const handleCityDropdownSelect = useCallback((feature) => {
    setSelectedCityFeature(feature);

    if (!feature) {
      // Clear selection
      if (highlightedBoundaryRef.current && boundaryLayer.current) {
        boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
        highlightedBoundaryRef.current = null;
      }
      return;
    }

    // Highlight and zoom to the selected feature
    if (boundaryLayer.current && mapRef.current) {
      let targetLayer = null;
      boundaryLayer.current.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties.id_kota === feature.properties.id_kota) {
          targetLayer = layer;
        }
      });

      if (targetLayer) {
        if (highlightedBoundaryRef.current) {
          boundaryLayer.current.resetStyle(highlightedBoundaryRef.current);
        }

        // Compute style identical to the click handler
        const isAalActive = isExposureActive; // Simplified logic, mimicking click
        targetLayer.setStyle({
          weight: 2, color: '#64748b', fillOpacity: opacityAAL, dashArray: ''
        });

        highlightedBoundaryRef.current = targetLayer;
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          targetLayer.bringToFront();
        }

        mapRef.current.fitBounds(targetLayer.getBounds(), {
          padding: [20, 20],
          maxZoom: 12,
          animate: true
        });
      }
    }
  }, [opacityAAL, isExposureActive]);

  return (
    <>
      <Script id="georaster" src="https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoRasterReady(true)} />
      <Script id="georaster-layer" src="https://cdn.jsdelivr.net/npm/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js" strategy="afterInteractive" onLoad={() => setGeoLayerReady(true)} />
      <Script id="geoblaze" src="https://cdn.jsdelivr.net/npm/geoblaze@2.7.0/dist/geoblaze.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoblazeReady(true)} />

      <style jsx global>{`
        .exposure-icon {
          background: white;
          border-radius: 50%;
          padding: 4px;
          border: 1px solid #f97316;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .exposure-icon:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        .exposure-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        .exposure-tooltip::before {
          border-top-color: white !important;
        }

        .compact-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
        }
        .compact-popup .leaflet-popup-content {
          margin: 10px 12px;
          line-height: 1.2;
        }
      `}</style>

      <div className="relative w-full h-full flex overflow-hidden">
        <LayerServices
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          hazardGroupFiles={hazardGroupFiles}
          isSingleLayer={isSingleLayer}
          selectedRpId={selectedRpId}
          setSelectedRpId={setSelectedRpId}
          infraLayers={infraLayers}
          setInfraLayers={setInfraLayers}
          loading={loading || fetchingMeta}
          fetchingExposure={fetchingExposure}
          scriptsReady={scriptsReady}
          activeBaseLayer={activeBaseLayer}
          updateBaseLayer={updateBaseLayer}
          opacityBasemap={opacityBasemap}
          setOpacityBasemap={setOpacityBasemap}
          opacityHazard={opacityHazard}
          setOpacityHazard={setOpacityHazard}
          opacityAAL={opacityAAL}
          setOpacityAAL={setOpacityAAL}
          activeAalExposure={activeAalExposure}
          setActiveAalExposure={setActiveAalExposure}
          onOpenHSBGN={() => {
            setHsbgnPanelPos({ x: 0, y: 0 }); // reset position if re-opened
            setIsHSBGNPanelOpen(true)
          }}
          onOpenBangunan={() => {
            setBangunanPanelPos({ x: 0, y: 0 }); // reset position if re-opened
            setIsBangunanPanelOpen(true)
            setInfraLayers(prev => ({
              ...prev,
              healthcare: true,
              educational: true,
              electricity: true,
              airport: true,
              hotel: true
            }))
          }}
        />

        {/* ── Map area ── */}
        <div className="flex-1 relative h-full">
          {/* Toggle Sidebar Button */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-4 z-[2002] bg-orange-500 text-white p-2 rounded-r-lg shadow-xl hover:bg-orange-600 transition-all animate-in slide-in-from-left duration-300"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Exposure Search Bar */}
          {isExposureActive && !isBangunanPanelOpen && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2002] w-full max-w-md px-4">
              <div className="bg-white rounded-full shadow-2xl border border-gray-100 flex items-center px-4 py-2 group focus-within:ring-2 focus-within:ring-gray-900/5 transition-all">
                <input
                  type="text"
                  placeholder="Cari gedung, sekolah, atau infrastruktur..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] font-medium outline-none text-gray-800 placeholder:text-gray-400"
                />
                <button className="text-gray-400 group-hover:text-gray-600">
                  <Layers size={16} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  {searchResults.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchSelect(f)}
                      className="w-full h-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50 group flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 flex-shrink-0 transition-colors">
                        <Layers size={14} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[12px] font-bold text-gray-800 truncate">{f.properties.nama_gedung || 'Tanpa Nama'}</div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">{f.properties.alamat || '-'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map canvas */}
          <div ref={mapEl} className="w-full h-full z-0" />

          {/* Building Detail Overlay */}
          {selectedBuildingHtml && (
            <div
              className="absolute top-24 left-[280px] z-[2000] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 w-[240px] border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto cursor-grab active:cursor-grabbing"
              style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="flex justify-end pb-1 mb-1 border-b border-gray-100">
                <button onClick={() => setSelectedBuildingHtml(null)} className="close-btn text-gray-400 hover:text-gray-800 focus:outline-none cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: selectedBuildingHtml }} />
            </div>
          )}

          {/* Overlays */}
          <ReactLegendOverlay
            rasterStats={rasterStats}
            infraLayers={infraLayers}
            selectedData={selectedData}
            curveData={curveData}
            calculateDamage={calculateDamage}
            HAZARD_INFO={HAZARD_INFO}
            EXPOSURE_COLORS={EXPOSURE_COLORS}
            activeAalExposure={activeAalExposure}
            onInputModeChange={(mode) => setLegendInputMode(mode)}
            boundaryDataAAL={boundaryDataAAL}
            boundaryDataDL={boundaryDataDL}
            selectedGroup={selectedGroup}
            selectedRpId={selectedRpId}
            selectedCityFeature={selectedCityFeature}
            onSelectCity={handleCityDropdownSelect}
            onClearCity={() => handleCityDropdownSelect(null)}
          />

          {error && (
            <div className="absolute top-4 right-16 z-[1000] bg-white border border-red-100 text-red-500 px-4 py-2 rounded-full shadow-xl text-[11px] font-bold tracking-wide">
              {error}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/50 backdrop-blur-[4px]">
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                <span className="text-gray-800 text-[11px] font-bold tracking-[0.2em] bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100">LOADING DATA</span>
              </div>
            </div>
          )}

          {/* Draggable HSBGN Floating Panel */}
          {isHSBGNPanelOpen && (
            <div
              className="absolute top-[88px] left-[290px] z-[2000] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-[310px] border border-gray-100 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col overflow-hidden"
              style={{ transform: `translate(${hsbgnPanelPos.x}px, ${hsbgnPanelPos.y}px)` }}
              onPointerDown={handleHsbgnPointerDown}
              onPointerMove={handleHsbgnPointerMove}
              onPointerUp={handleHsbgnPointerUp}
              onPointerCancel={handleHsbgnPointerUp}
            >
              <div className="flex justify-between items-center bg-transparent border-b border-gray-100 px-4 py-3 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-[10px] font-bold text-gray-800 tracking-[0.1em] uppercase">Data HSBGN</h3>
                </div>
                <button
                  onClick={() => setIsHSBGNPanelOpen(false)}
                  className="no-drag text-gray-400 hover:text-gray-800 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="no-drag p-2 max-h-[55vh] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <CrudHSBGN onDataChanged={refreshAALData} />
              </div>
            </div>
          )}

          {/* Draggable Bangunan Floating Panel */}
          {isBangunanPanelOpen && (
            <div
              className="absolute top-[88px] left-[320px] z-[2000] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-[310px] border border-gray-100 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col overflow-hidden"
              style={{ transform: `translate(${bangunanPanelPos.x}px, ${bangunanPanelPos.y}px)` }}
              onPointerDown={handleBangunanPointerDown}
              onPointerMove={handleBangunanPointerMove}
              onPointerUp={handleBangunanPointerUp}
              onPointerCancel={handleBangunanPointerUp}
            >
              <div className="flex justify-between items-center bg-transparent border-b border-gray-100 px-4 py-3 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <Layers size={14} />
                  </div>
                  <h3 className="text-[10px] font-bold text-gray-800 tracking-[0.1em] uppercase">Data Bangunan</h3>
                </div>
                <button
                  onClick={() => setIsBangunanPanelOpen(false)}
                  className="no-drag text-gray-400 hover:text-gray-800 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="no-drag p-0 max-h-[42vh] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex justify-center">
                <CrudBuildings
                  onDataChanged={refreshAALData}
                  kotaFilter={kotaFilter}
                  setKotaFilter={setKotaFilter}
                  infraLayers={infraLayers}
                  onFilteredBuildings={setPanelBuildings}
                  onSearchBuilding={(b) => {
                    if (!mapRef.current) return;
                    const lat = parseFloat(b.lat);
                    const lon = parseFloat(b.lon);
                    if (isNaN(lat) || isNaN(lon)) return;

                    mapRef.current.setView([lat, lon], 18, { animate: true });

                    setTimeout(() => {
                      L.popup({ autoClose: true, closeOnClick: true })
                        .setLatLng([lat, lon])
                        .setContent(`
                            <div style="font-family: inherit; min-width: 200px;">
                              <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px;">${b.name || 'Tanpa Nama'}</div>
                              <div style="font-size: 11px; color: #6b7280; font-style: italic; margin-bottom: 8px;">Tipe: ${b.type || '-'}</div>
                            </div>
                          `)
                        .openOn(mapRef.current)
                    }, 500);
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </div>
      <Script id="script-georaster" src="https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.bundle.min.js" strategy="afterInteractive" onLoad={() => setGeoRasterReady(true)} />
      <Script id="script-georaster-layer" src="https://cdn.jsdelivr.net/npm/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js" strategy="afterInteractive" onLoad={() => setGeoLayerReady(true)} />
      <Script id="script-geoblaze" src="https://unpkg.com/geoblaze@2.7.0/dist/geoblaze.web.min.js" strategy="afterInteractive" onLoad={() => setGeoblazeReady(true)} />
    </>
  )
}
