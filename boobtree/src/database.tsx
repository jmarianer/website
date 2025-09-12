import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface Game {
  id: string;
  current_round: number;
  total_rounds: number;
  players: string[];
  archive: string[][];
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

export const DataContext = createContext<any>(null);

export function DataProvider({path, children}: {path: string, children: React.ReactNode}) {
  const dbRef = useMemo(() => ref(database, path), [path]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      setData(snapshot.val());
    });
  }, [dbRef]);

  return <DataContext.Provider value={data}>
    {children}
  </DataContext.Provider>;
}

export function useCurrentGame() {
  // TODO: use deepkit/type to cast this properly
  return useContext(DataContext) as Game;
}