// pages/_app.js
import '../styles/globals.css'
import 'leaflet/dist/leaflet.css'
import { ThemeProvider } from '../context/ThemeContext'

import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Head>
        <link rel="icon" href="/logoitb.png" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
