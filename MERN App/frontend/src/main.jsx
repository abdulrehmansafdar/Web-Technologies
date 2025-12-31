/**
 * ===========================================
 * TaskFlow Frontend - Main Entry Point
 * ===========================================
 * 
 * This is the main entry point for the React application.
 * It initializes the root component and renders the app.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
