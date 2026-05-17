import { useEffect, useMemo, useState } from "react";
import { PuzzleEditor } from "./PuzzleEditor";
import { database } from "./database";
import { get, ref, set } from "firebase/database";
import { useNavigate, useParams } from "react-router";
import { Puzzle } from "./types";
import { cast } from "@deepkit/type";

export function Edit() {
  const { id } = useParams();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  const navigate = useNavigate();
  const [initialTemplate, setInitialTemplate] = useState('');

  useEffect(() => {
    get(dbRef).then((snapshot) => {
      const crossword = cast<Puzzle>(snapshot.val());
      setInitialTemplate(
        crossword.cells.slice(1, -1).map(row =>
          row.slice(1, -1).map(cell => cell.isFillable() ? '.' : 'x').join('')
        ).join('\n')
      );
    });
  }, [dbRef]);

  return (
    <PuzzleEditor
      initialTemplate={initialTemplate}
      onSubmit={puzzle => {
        set(dbRef, puzzle);
        navigate(`/crossword/${id}`);
      }}
    />
  );
}
