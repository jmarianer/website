import { ref, set } from "firebase/database";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { database, useCurrentGame } from "./database";

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
      const dbRef = ref(database, `boobtree/${id}/started`);
      set(dbRef, true);
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