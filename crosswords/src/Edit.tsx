import { useEffect, useMemo, useState } from "react";
import { createPuzzle } from "./create-puzzle";
import { RenderCrossword } from "./RenderCrossword";
import { database } from "./database";
import { get, ref, set } from "firebase/database";
import { useNavigate, useParams } from "react-router";
import { Puzzle } from "./types";
import { cast } from "@deepkit/type";

export function Edit() {
  const [crossword, setCrossword] = useState('');
  const navigate = useNavigate();

  const {id} = useParams();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  useEffect(() => {
    get(dbRef).then((snapshot) => {
      const crossword = cast<Puzzle>(snapshot.val());
      setCrossword(
        crossword.cells.slice(1, -1).map(row =>
          row.slice(1, -1).map(cell => cell.isFillable() ? '.' : 'x').join('')
        ).join('\n')
      );
    })
  }, [id]);

  function createCrossword() {
    set(dbRef, createPuzzle(crossword));
    navigate(`/crossword/${id}`);
  }

  return (
    <>
      <h1>Create a new crossword</h1>
      <div className="create-interface">
        <div className="input-section">
          <h2>Template</h2>
          <div className="instructions">
            Enter the crossword template below, using '.' for white squares and 'x' for black squares.
          </div>
          <textarea
            rows={25}
            value={crossword}
            onChange={e => setCrossword(e.target.value)}
          />
        </div>
        <div className="preview-section">
          <h2>Preview</h2>
          <RenderCrossword crossword={createPuzzle(crossword)} />
        </div>
      </div>
      <button className="create-button" onClick={createCrossword}>Done</button>
    </>
  );
}