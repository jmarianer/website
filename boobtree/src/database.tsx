import { cast } from "@deepkit/type";
import { initializeApp } from "firebase/app";
import { get, getDatabase, onValue, ref, set } from "firebase/database";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

export class Game {
  constructor(
    public id: string,
  ) { }

  public players: string[] = [];
  public archive: Array<Record<number, string | null>> = [];
  public started = false;

  get currentRound(): number {
    for (let round = 0; round < this.players.length; round++) {
      if (Object.keys(this.archive[round] || {}).length < this.players.length) {
        return round;
      }
    }
    return this.players.length;
  }
  get totalRounds(): number {
    return this.players.length % 2 === 0 ? this.players.length - 1 : this.players.length;
  }

  start() {
    set(ref(database, `${DB_PREFIX}/${this.id}/started`), true);
  }

  addResponse(playerIndex: number, response: string) {
    set(ref(database, `${DB_PREFIX}/${this.id}/archive/${this.currentRound}/${playerIndex}`), response);
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyDNY7EWSosnLYffp_zpmySLfF-Ea5YDlFk",
  authDomain: "prefab-conquest-186122.firebaseapp.com",
  databaseURL: "https://prefab-conquest-186122-default-rtdb.firebaseio.com",
  projectId: "prefab-conquest-186122",
  storageBucket: "prefab-conquest-186122.firebasestorage.app",
  messagingSenderId: "712554395291",
  appId: "1:712554395291:web:9b102f226f9ebc135b383e",
};
initializeApp(firebaseConfig);

const database = getDatabase();
export const DB_PREFIX = import.meta.env.VITE_DB_PREFIX;
if (!DB_PREFIX) {
  throw new Error('VITE_DB_PREFIX environment variable must be defined');
}

const DataContext = createContext<Game | null>(null);

export function DataProvider({gameId, children}: {gameId: string, children: React.ReactNode}) {
  const path = `${DB_PREFIX}/${gameId}`;
  const dbRef = useMemo(() => ref(database, path), [path]);
  const [data, setData] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      if (val === null) {
        set(ref(database, `${DB_PREFIX}/${gameId}/id`), gameId);
      } else {
        const game = cast<Game>(snapshot.val());
        while (game.archive.length < game.totalRounds) {
          game.archive.push({});
        }
        setData(game);
      }
      setLoading(false);
    });
  }, [dbRef]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <DataContext.Provider value={data}>
    {children}
  </DataContext.Provider>;
}

export function useCurrentGame() {
  const game = useContext(DataContext);
  if (!game) {
    throw new Error('DataContext not found');
  }
  const { userId } = useParams();
  return { game, userId: +userId! };
}

export function useJoinGame() {
  const navigate = useNavigate();

  return async (id: string, name: string) => {
    const playersRef = ref(database, `${DB_PREFIX}/${id}/players`);
    const playersSnap = await get(playersRef);
    const playersList: string[] = playersSnap.val() || [];

    // If the name already exists, redirect to that player's index instead of adding a duplicate
    const trimmed = name.trim();
    const existingIndex = playersList.indexOf(trimmed);
    if (existingIndex !== -1) {
      navigate(`/game/${id}/player/${existingIndex}`);
      return;
    }

    const newPlayers = [...playersList, trimmed];
    await set(playersRef, newPlayers);
    navigate(`/game/${id}/player/${newPlayers.length - 1}`);
  };
}
