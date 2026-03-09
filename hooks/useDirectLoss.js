// hooks/useDirectLoss.js
import { useState, useEffect } from 'react'
import { getProvinsi, getKota, getKotaAll, getGedung } from '../src/lib/api'

export default function useDirectLoss() {
  const [provList, setProvList] = useState([])
  const [kotaList, setKotaList] = useState([])
  const [geojson, setGeojson] = useState(null)
  const [selectedProv, setSelectedProv] = useState('')
  const [selectedKota, setSelectedKota] = useState('')
  const [filters, setFilters] = useState({ BMN: true, FS: true, FD: true })
  const [search, setSearch] = useState('')

  // load provinsi
  useEffect(() => {
    getProvinsi().then(list => {
      setProvList(list.map(p => ({ label: p, value: p })))
    })
  }, [])

  // load semua kota langsung
  useEffect(() => {
    getKotaAll().then(list => {
      setKotaList(list.map(k => ({ label: k, value: k })))
    })
  }, [])

  // load gedung when kota set
  useEffect(() => {
    if (selectedKota) {
      getGedung(selectedProv, selectedKota).then(setGeojson)
    } else {
      setGeojson(null)
    }
  }, [selectedKota])

  return {
    provList,
    kotaList,
    geojson,
    selectedProv,
    setSelectedProv,
    selectedKota,
    setSelectedKota,
    filters,
    setFilters,
    search,
    setSearch
  }
}
