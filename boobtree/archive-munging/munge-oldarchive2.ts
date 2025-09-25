import { deleteApp, initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { promises as fs } from 'fs';

function mungeOldArchive2(oldArchive: {
  archive: Array<Record<string, string>>;
  id: string;
  started: true;
  players: string[];
}): any {
  const newArchive = oldArchive.archive.map(a =>
    oldArchive.players.map(player => a[player])
  );
  return {
    id: oldArchive.id,
    started: oldArchive.started,
    players: oldArchive.players,
    archive: newArchive,
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
const app = initializeApp(firebaseConfig);
const database = getDatabase();

const oldArchive2 = Object.values(JSON.parse(await fs.readFile('oldarchive2.json', 'utf-8')))
  .filter((x: any) => 'archive' in x && !Array.isArray(x.archive[0]));
  
oldArchive2.forEach(async (archive: any) => {
  const id = archive.id;
  await set(ref(database, `boobtree/${id}`), mungeOldArchive2(archive));
})

await deleteApp(app);