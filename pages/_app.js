// pages/_app.js
import '../styles/globals.css'
import 'leaflet/dist/leaflet.css'
import { ThemeProvider } from '../context/ThemeContext'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
