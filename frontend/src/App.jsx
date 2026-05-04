import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ResultPage from './pages/ResultPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{
        flex: 1, minWidth: 0, overflowY: 'auto',
        padding: '56px 64px',
        background: 'var(--ink)',
        position: 'relative',
      }}>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/upload"     element={<UploadPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/history"    element={<HistoryPage />} />
        </Routes>
      </main>
    </>
  )
}
