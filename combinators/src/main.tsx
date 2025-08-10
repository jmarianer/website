import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import { BrowserRouter, Routes, Route } from 'react-router'
import Practice from './Practice'
import { Level } from './Level'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Practice />} />
        <Route path="/level/:id" element={<Level />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
