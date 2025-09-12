import React from 'react';
import ReactDOM from 'react-dom/client';
import { Homepage, Start } from './Homepage';
import { BrowserRouter as Router, Routes, Route, useParams, Outlet } from 'react-router';
import { GameAdmin, Join } from './GameAdmin';
import { DataProvider } from './database';

function Game() {
  return <DataProvider path={`boobtree/${useParams().id}`}>
    <Outlet />
  </DataProvider>;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/newgame" element={<Start />} />
        <Route path="/game/:id" element={<Game />}>
          <Route path="admin" element={<GameAdmin />} />
          <Route path="join" element={<Join />} />
        </Route>
      </Routes>
    </Router>
  </React.StrictMode>
);
