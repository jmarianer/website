import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCurrentGame } from "./database";

export function GameAdmin() {
  const { id } = useParams();
  const game = useCurrentGame();

  return <>
    <div id="instructions">
      Please share this <Link to={`/game/${id}/join`}>join link</Link> or the code {id} with the rest of your party
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
  const game = useCurrentGame();

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
  const { id } = useParams();
  const [name, setName] = useState('');
  const navigate = useNavigate();

  return <>
    <div>Join game {id}</div>
    <form onSubmit={(e) => {
      e.preventDefault();
      navigate(`/game/${id}/user/${name}`);
    }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button type="submit">Join</button>
    </form>
  </>;
}