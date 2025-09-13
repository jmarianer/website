import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface Game {
  id: string;
  current_round: number;
  total_rounds: number;
  players: string[];
  previous_player: Record<string, string>;
  archive: Array<Record<string, string>>;
  started: boolean;
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

export const database = getDatabase();

export const DataContext = createContext<Game | null>(null);

export function DataProvider({path, children}: {path: string, children: React.ReactNode}) {
  const dbRef = useMemo(() => ref(database, path), [path]);
  const [data, setData] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      const archive = val.archive || [];
      while (archive.length < val.total_rounds) {
        archive.push({});
      }
      setData({
        id: val.id,
        current_round: val.current_round,
        total_rounds: val.total_rounds,
        players: val.players,
        previous_player: val.previous_player,
        archive: archive,
        started: val.started || false,
      });
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