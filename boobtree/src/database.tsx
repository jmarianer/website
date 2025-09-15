import { cast } from "@deepkit/type";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, set } from "firebase/database";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export class Game {
  constructor(
    public id: string,
  ) {
    console.log(this.id);
  }

  public players: string[] = [];
  public archive: Array<Record<string, string>> = [];
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
    set(ref(database, `boobtree/${this.id}/started`), true);
  }

  addPlayer(playerName: string) {
    if (this.players.includes(playerName)) {
      return;
    }
    set(ref(database, `boobtree/${this.id}/players`), [...this.players, playerName]);
  }

  addResponse(playerName: string, response: string) {
    set(ref(database, `boobtree/${this.id}/archive/${this.currentRound}/${playerName}`), response);
  }

  previousPlayer(playerName: string): string {
    const index = this.players.indexOf(playerName);
    if (index === -1) {
      throw new Error(`Player ${playerName} not found`);
    }
    return this.players[(index - 1 + this.players.length) % this.players.length];
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

const DataContext = createContext<Game | null>(null);

export function DataProvider({gameId, children}: {gameId: string, children: React.ReactNode}) {
  const path = `boobtree/${gameId}`;
  const dbRef = useMemo(() => ref(database, path), [path]);
  const [data, setData] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      if (val === null) {
        set(ref(database, `boobtree/${gameId}/id`), gameId);
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

export function useCurrentGame(): Game {
  const game = useContext(DataContext);
  if (!game) {
    throw new Error('DataContext not found');
  }
  console.log(game);
  return game;
}