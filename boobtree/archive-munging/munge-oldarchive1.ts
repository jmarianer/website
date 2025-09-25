import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { promises as fs } from 'fs';

function mungeOldArchive1(oldArchive: {
  archive: Array<Array<{
    player_name: string;
    phrase_or_drawing: string;
  }>>;
  _id: {$oid: string};
}, newId: string): any {
  const players = [...new Set(oldArchive.archive.flatMap(x => x.flatMap(x => x.player_name)))];
  const rounds = oldArchive.archive[0].length;
  const newArchive: Array<Record<number, string | null>> = [];
  while (newArchive.length < rounds) {
    newArchive.push({});
  }

  for (const oldChain of oldArchive.archive) {
    oldChain.forEach(({player_name, phrase_or_drawing}, round_no) => {
      const player_no = players.findIndex(p => p === player_name);
      newArchive[round_no][player_no] = phrase_or_drawing;
    });
  }

  return {
    id: newId,
    oldId: oldArchive._id.$oid,
    started: true,
    players,
    archive: newArchive,
  };
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

const oldArchive1 = (await fs.readFile('oldarchive1.json', 'utf-8'))
  .split('\n')
  .filter(line => line.trim().length > 0)
  .map(line => JSON.parse(line))
  .filter(x => 'archive' in x);

oldArchive1.forEach(async (archive, idx) => {
  const newId = `old${idx}`;
  await set(ref(database, `boobtree/${newId}`), mungeOldArchive1(archive, newId));
  console.log(idx);
})

