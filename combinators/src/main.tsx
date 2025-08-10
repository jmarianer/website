import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './App'
import { Level1 } from './Level1'
import { Level2 } from './Level2'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/level/1" element={<Level1 />} />
        <Route path="/level/2" element={<Level2 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
