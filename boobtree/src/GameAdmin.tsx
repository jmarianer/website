import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCurrentGame } from "./database";

export function GameAdmin() {
  const { id } = useParams();
  const game = useCurrentGame();

  return <>
    <Link to={`/game/${id}/join`}>Join the game</Link>
    <span>({id})</span>
    <div id="sharelink">
      Please share this link or the code with the rest of your party
    </div>
    <div id="player-container">
      The following players have already joined:
      <div id="players">
        { game.players.length === 0 && <i>No players have joined yet</i> }
        { game.players.map((player) => <div key={player}>{player}</div>) }
      </div>
    </div>
    <button onClick={() => {
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