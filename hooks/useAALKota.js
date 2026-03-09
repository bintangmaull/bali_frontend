// hooks/useAALKota.js
import { useState, useEffect } from 'react'
import { getAALKota } from '../src/lib/api'

export default function useAALKota() {
    const [geojson, setGeojson] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        getAALKota()
            .then((data) => setGeojson(data))
            .catch((err) => setError(err))
    }, [])

    return { geojson, error }
}
