import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App'
import { Level } from './Level'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/level/:id" element={<Level />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
