import { useRef } from "react";
import { Link, useParams } from "react-router";
import { useCurrentGame, useJoinGame } from "./database";

export function GameAdmin() {
  const { gameId } = useParams();
  const { game } = useCurrentGame();

  return <>
    <div id="instructions">
      Please share this <Link to={`/game/${gameId}/join`}>join link</Link> or the code {gameId} with the rest of your party
    </div>

    {game.started ? <GameStarted /> : <GameNotStarted />}
  </>;
}

function GameStarted() {
  return <div>
    The game has started! You can close this tab now.
  </div>;
}

function GameNotStarted() {
  const { game } = useCurrentGame();

  if (game.players.length === 0) {
    return <div><i>No players have joined yet</i></div>;
  }

  return <>
    <div>
      The following players have already joined:
      {game.players.map((player) => <div key={player}>{player}</div>)}
    </div>
    <button id="done" onClick={() => {
      game.start();
    }}>That's everyone!</button>
  </>;
}

export function Join() {
  const joinGame = useJoinGame();
  const { gameId } = useParams();
  const nameRef = useRef<HTMLInputElement | null>(null);

  return <>
    <div>Join game {gameId}</div>
    <form onSubmit={(e) => {
      e.preventDefault();
      joinGame(gameId!, nameRef.current!.value);
    }}>
      <input type="text" placeholder="Your name" maxLength={20} ref={nameRef} />
      <button type="submit">Join</button>
    </form>
  </>;
}