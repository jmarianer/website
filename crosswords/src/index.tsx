import React from 'react';
import ReactDOM from 'react-dom/client';
import { Homepage } from './Homepage';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { Create } from './Create';
import { Crossword } from './Crossword';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create" element={<Create />} />
        <Route path="/crossword/:id" element={<Crossword />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
