import { Link, Navigate, useNavigate } from "react-router";
import cryptoRandomString from "crypto-random-string";
import { useState } from "react";
import Modal from 'react-modal';

export function Homepage() {
  return <div id="homepage">
    <img src="/boobtrees.jpg" id="treeofboobs" alt="Trees of boobs" />
    <div>
      <Link to="/new">Start a new game</Link>
      &nbsp;|&nbsp;
      <Link to="/join">Join a game</Link>
    </div>
  </div>;
}

export function JoinWithCode() {
  const navigate = useNavigate();

  return <>
    Join a game
    <input id="gameid" type="text" placeholder="Game code" maxLength={4} />
    <input id="playername" type="text" placeholder="Your name" maxLength={20} />
    <button onClick={() => {
      const gameid = (document.getElementById("gameid") as HTMLInputElement).value.toUpperCase();
      const playername = (document.getElementById("playername") as HTMLInputElement).value;
      navigate(`/game/${gameid}/user/${playername}`);
    }}>Join</button>
  </>;
}

export function Start() {
  const id = cryptoRandomString({ length: 4, characters: 'CDEHKMPRTUWXY' });

  return <Navigate to={`/game/${id}/admin`} replace />;
}