import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './styles/tiling.css'

// Sin StrictMode: en Electron los effects con recursos nativos (PTY, WebContentsView)
// no deben ejecutarse dos veces
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
