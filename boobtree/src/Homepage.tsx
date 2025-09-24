import { Link, Navigate } from "react-router";
import cryptoRandomString from "crypto-random-string";
import { DB_PREFIX, useJoinGame } from "./database";
import { useRef } from "react";

export function Homepage() {
  return <div id="homepage">
    <img src={`/${DB_PREFIX}.jpg`} id="homepage-img" alt="" />
    <div>
      <Link to="/new">Start a new game</Link>
      &nbsp;|&nbsp;
      <Link to="/join">Join a game</Link>
    </div>
  </div>;
}

export function JoinWithCode() {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const gameIdRef = useRef<HTMLInputElement | null>(null);
  const joinGame = useJoinGame();

  return <>
    <div>Join a game</div>
    <form onSubmit={(e) => {
      e.preventDefault();
      joinGame(gameIdRef.current!.value, nameRef.current!.value);
    }}>
      <input type="text" placeholder="Game code" maxLength={4} ref={gameIdRef} />
      <input type="text" placeholder="Your name" maxLength={20} ref={nameRef} />
      <button type="submit">Join</button>
    </form>
  </>;
}

export function Start() {
  const id = cryptoRandomString({ length: 4, characters: 'CDEHKMPRTUWXY' });

  return <Navigate to={`/game/${id}/admin`} replace />;
}