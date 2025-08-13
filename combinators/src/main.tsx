import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import Practice from './Practice'
import { Level } from './Level'
import { levels } from './levels'

function Home() {
  return (
    <div className='levels'>
      <Link className='practice' to="/practice">Practice</Link>
      {levels.map((_, i) => <Link key={i} to={`/level/${i+1}`}>Level {i+1}</Link>)}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/level/:id" element={<Level />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
