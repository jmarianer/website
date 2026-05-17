import { useEffect, useState } from "react";
import { createPuzzle } from "./create-puzzle";
import { RenderCrossword } from "./RenderCrossword";
import { Puzzle } from "./types";

type Props = {
  initialTemplate: string;
  onSubmit: (puzzle: Puzzle) => void;
};

export function PuzzleEditor({ initialTemplate, onSubmit }: Props) {
  const [template, setTemplate] = useState(initialTemplate);

  useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);

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
            value={template}
            onChange={e => setTemplate(e.target.value)}
          />
        </div>
        <div className="preview-section">
          <h2>Preview</h2>
          <RenderCrossword crossword={createPuzzle(template)} />
        </div>
      </div>
      <button className="create-button" onClick={() => onSubmit(createPuzzle(template))}>Done</button>
    </>
  );
}
