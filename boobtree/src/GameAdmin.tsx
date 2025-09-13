import { ref, set } from "firebase/database";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { database, useCurrentGame, type Game } from "./database";

export function GameAdmin() {
  const { id } = useParams();
  const { players } = useCurrentGame();

  return <>
    <Link to='join'>Join the game</Link>
    <span>({id})</span>
    <div id="sharelink">
      Please share this link or the code with the rest of your party
    </div>
    <div id="player-container">
      The following players have already joined:
      <div id="players">
        {players.length === 0 && <i>No players have joined yet</i>}
        {players.map((player) => <div key={player}>{player}</div>)}
      </div>
    </div>
    <button onClick={() => {
      // Create previous_player mapping: each player maps to the previous one in the array (circular)
      const previous_player = Object.fromEntries(
        players.map((player, i) => [player, players[(i - 1 + players.length) % players.length]])
      );
      const game: Game = {
        id: id!,
        current_round: 0,
        total_rounds: players.length % 2 === 0 ? players.length - 1 : players.length,
        players,
        previous_player,
        archive: Array(players.length).fill(0).map(() => ({})),
        started: true,
      };
      set(ref(database, `boobtree/${id}`), game);
    }}>That's everyone!</button>
  </>;
}

export function Join() {
  const { id } = useParams();
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { players } = useCurrentGame();

  return <>
    <div>Join game {id}</div>
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!players.includes(name)) {
        players.push(name);
        set(ref(database, `boobtree/${id}/players`), players).then(() => {
          navigate(`/game/${id}/user/${name}`);
        });
      }
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