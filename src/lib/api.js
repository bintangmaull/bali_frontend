/**
 * Fetch JSON from a relative `/api/...` path.
 * Errors if status is not OK.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'


async function fetchJSON(path, opts = {}) {
  const res = await fetch(BASE_URL + path, opts)
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (status ${res.status})`)
  }
  return res.json()
}

// AAL per Provinsi
export function getAALProvinsi() {
  return fetchJSON('/api/aal-provinsi')
}
export function getAALProvinsiList() {
  return fetchJSON('/api/aal-provinsi-list')
}
export function getAALProvinsiData(provinsi) {
  return fetchJSON(
    `/api/aal-provinsi-data?provinsi=${encodeURIComponent(provinsi)}`
  )
}

// AAL per Kota
export function getAALKota() {
  return fetchJSON('/api/aal-kota')
}

// Provinsi & Kota
export function getProvinsi() {
  return fetchJSON('/api/hsbgn/provinsi')
}
export function getKota(provinsi) {
  return fetchJSON(
    `/api/hsbgn/provinsi/${encodeURIComponent(provinsi)}/kota`
  )
}
export function getKotaAll() {
  return fetchJSON('/api/hsbgn/kota')
}
export function getKotaBoundary(kota) {
  return fetchJSON(`/api/kota-boundary?kota=${encodeURIComponent(kota)}`)
}

// Gedung Direct Loss
export function getGedung(provinsi, kota) {
  return fetchJSON(
    `/api/gedung?provinsi=${encodeURIComponent(provinsi)}&kota=${encodeURIComponent(kota)}`
  )
}

// HSBGN CRUD
export function getHSBGN() {
  return fetchJSON('/api/hsbgn')
}
export function updateHSBGN(id, payload) {
  return fetchJSON(`/api/hsbgn/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
export function addHSBGN(payload) {
  return fetchJSON('/api/hsbgn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

// Bangunan CRUD
export function getBuildingProvinsi() {
  return fetchJSON('/api/bangunan/provinsi')
}
export function getBuildingKota(provinsi) {
  return fetchJSON(
    `/api/bangunan/kota?provinsi=${encodeURIComponent(provinsi)}`
  )
}
export function getBuildingAllKota() {
  return fetchJSON('/api/bangunan/kota')
}
export function uploadBuildingsCSV(file) {
  const fd = new FormData()
  fd.append('file', file)
  return fetchJSON('/api/bangunan/upload', { method: 'POST', body: fd })
}
export function getBuildings(params) {
  const qs = new URLSearchParams(params).toString()
  return fetchJSON(`/api/bangunan?${qs}`)
}
export function getNewBuildingId(kode) {
  return fetchJSON(
    `/api/bangunan/new-id?taxonomy=${encodeURIComponent(kode)}`
  )
}
export function addBuilding(payload) {
  return fetchJSON('/api/bangunan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
export function getBuilding(id) {
  return fetchJSON(`/api/bangunan/${id}`)
}
export function updateBuilding(id, payload) {
  return fetchJSON(`/api/bangunan/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
export function deleteBuilding(id, kota) {
  return fetchJSON(`/api/bangunan/${id}/${encodeURIComponent(kota)}`, { method: 'DELETE' })
}

// Recalculate per–building or global.
// Jika bangunanId diberikan: POST /api/bangunan/:id/recalc
// Jika bangunanId == null: GET /process_join
export async function recalc(bangunanId) {
  const url = bangunanId != null
    ? `/api/bangunan/${encodeURIComponent(bangunanId)}/recalc`
    : '/process_join'
  const method = bangunanId != null ? 'POST' : 'GET'

  try {
    return await fetchJSON(url, { method })
  } catch (err) {
    console.warn(`⚠️ recalc error for ${url}:`, err)
    return null
  }
}

// Alias yang jelas: global recalc setelah CSV upload
export async function recalcAll() {
  try {
    return await fetchJSON('/process_join', { method: 'GET' })
  } catch (err) {
    console.warn(`⚠️ recalcAll error:`, err)
    return null
  }
}

// kurva
export function getDisasterCurves() {
  return fetchJSON('/api/disaster-curves')
}

/**
 * Targeted recalculation for a specific city when HSBGN is updated.
 */
export function recalcHSBGN(hsbgnId) {
  return fetchJSON(`/api/hsbgn/${hsbgnId}/recalc`, { method: 'POST' })
}

// Background Processing Endpoints (Admin)
export function processCurveGempa() {
  return fetchJSON('/process_kurva_gempa', { method: 'GET' })
}
export function processCurveTsunami() {
  return fetchJSON('/process_kurva_tsunami', { method: 'GET' })
}
export function processCurveBanjir() {
  return fetchJSON('/process_kurva_banjir', { method: 'GET' })
}
export function processCurveBanjirR() {
  return fetchJSON('/process_kurva_banjir_r', { method: 'GET' })
}
export function processCurveBanjirRC() {
  return fetchJSON('/process_kurva_banjir_rc', { method: 'GET' })
}