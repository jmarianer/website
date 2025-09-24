import React from 'react';
import ReactDOM from 'react-dom/client';
import { Homepage, Start, JoinWithCode } from './Homepage';
import { BrowserRouter as Router, Routes, Route, useParams, Outlet } from 'react-router';
import { GameAdmin, Join } from './GameAdmin';
import { DataProvider } from './database';
import { GameInProgress } from './GameInProgress';
import "./style.scss";
import { GameArchive } from './GameArchive';

function Game() {
  return <DataProvider gameId={useParams().gameId!}>
    <Outlet />
  </DataProvider>;
}

const reactRoot = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
);
reactRoot.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/new" element={<Start />} />
        <Route path="/join" element={<JoinWithCode />} />
        <Route path="/game/:gameId" element={<Game />}>
          <Route path="admin" element={<GameAdmin />} />
          <Route path="join" element={<Join />} />
          <Route path="player/:userId" element={<GameInProgress />} />
          <Route path="archive" element={<GameArchive />} />
        </Route>
      </Routes>
    </Router>
  </React.StrictMode>
);
