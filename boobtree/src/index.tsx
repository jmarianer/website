import React from 'react';
import ReactDOM from 'react-dom/client';
import { Homepage, Start } from './Homepage';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { Game, Join } from './Game';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/newgame" element={<Start />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/game/:id/join" element={<Join />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
