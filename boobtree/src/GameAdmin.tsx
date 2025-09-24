import { useRef } from "react";
import { Link, useParams } from "react-router";
import { useCurrentGame, useJoinGame } from "./database";

export function GameAdmin() {
  const { game } = useCurrentGame();

  if (!game.started) {
    return <GameNotStarted />;
  } else if (game.currentRound < game.totalRounds) {
    return <GameStarted />;
  } else {
    return <GameOver />;
  }
}

function GameStarted() {
  const { game } = useCurrentGame();
  return <div>
    Now playing round {game.currentRound}.
    {game.players.map((player, i) => <div key={i}>{game.archive[game.currentRound][i] ? "✓" : "✗"} {player}</div>)}
  </div>;
}

function GameOver() {
  const { game } = useCurrentGame();
  return <Link to={`/game/${game.id}/archive`}>View the archive</Link>;
}

function GameNotStarted() {
  const { game } = useCurrentGame();

  return <>
    <div id="instructions">
      Please share this <Link to={`/game/${game.id}/join`}>join link</Link> or the code {game.id} with the rest of your party
    </div>
    {game.players.length ? <><div>
      The following players have already joined:
      {game.players.map((player) => <div key={player}>{player}</div>)}
    </div>
    <button id="done" onClick={() => {
      game.start();
    }}>That's everyone!</button>
    </> : <div><i>No players have joined yet</i></div>}
  </>
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
