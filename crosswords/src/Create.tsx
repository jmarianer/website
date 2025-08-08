import { useState } from "react";
import { createPuzzle } from "./create-puzzle";
import { RenderCrossword } from "./RenderCrossword";
import { database } from "./database";
import { push, ref } from "firebase/database";
import { useNavigate } from "react-router";

export function Create() {
  const [crossword, setCrossword] = useState('');
  const navigate = useNavigate();

  function createCrossword() {
    let newCrossword = push(ref(database, 'crosswords'), createPuzzle(crossword));
    navigate('/crossword/' + newCrossword.key);
  }

  return (
    <>
      <h1>Create a new crossword</h1>
      <div className="create-interface">
        <div className="input-section">
          <h2>Template</h2>
          <div className="instructions">
            Enter the crossword template below, using 'x' for white squares and '.' for black squares.
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

      {/* <pre>{JSON.stringify(createPuzzle(crossword), null, 2)}</pre> */}
    </>
  );
}