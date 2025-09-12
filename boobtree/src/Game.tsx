import { onValue, ref, set } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { database } from "./database";

export function Game() {
  const {id} = useParams();
  const dbRef = useMemo(() => ref(database, `boobtree/${id}`), [id]);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      setPlayers(snapshot.val().players || []);
    });
  }, [dbRef]);

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
      const dbRef = ref(database, `boobtree/${id}`);
      set(dbRef, {started: true});
    }}>That's everyone!</button>
  </>;
}

export function Join() {
  const {id} = useParams();
  const [name, setName] = useState('');
  const navigate = useNavigate();

  return <>
    <div>Join game {id}</div>
    <form onSubmit={(e) => {
      e.preventDefault();
      const dbRef = ref(database, `boobtree/${id}`);
      console.log('Submitting', name);
      onValue(dbRef, async (snapshot) => {
        const game = snapshot.val() || {};
        const players = game.players || [];
        if (!players.includes(name)) {
          players.push(name);
          await set(ref(database, `boobtree/${id}/players`), players);
          navigate(`/game/${id}/user/${name}`);
        }
      }, {onlyOnce: true});
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