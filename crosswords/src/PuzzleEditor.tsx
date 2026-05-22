import { useEffect, useMemo, useState } from "react";
import { createPuzzle } from "./create-puzzle";
import { RenderCrossword } from "./RenderCrossword";
import { Puzzle } from "./types";
import { isConnected, isPuzzleEmpty, isRotationallySymmetric } from "./validation";

type Props = {
  initialTemplate: string;
  onSubmit: (puzzle: Puzzle) => void;
};

export function PuzzleEditor({ initialTemplate, onSubmit }: Props) {
  const [template, setTemplate] = useState(initialTemplate);

  useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);

  const puzzle = useMemo(() => createPuzzle(template), [template]);
  const empty = isPuzzleEmpty(puzzle);
  const noClues = puzzle.clues.length === 0;
  const symmetric = isRotationallySymmetric(puzzle);
  const connected = isConnected(puzzle);

  const statusTable = [
    { testId: 'empty-grid', condition: !empty, isHard: true, messageGood: 'Grid is not empty', messageBad: 'Grid is empty' },
    { testId: 'no-clues', condition: !noClues, isHard: true, messageGood: 'Clues found', messageBad: 'No clues found' },
    { testId: 'symmetric', condition: symmetric, isHard: false, messageGood: 'Rotationally symmetric', messageBad: 'Not rotationally symmetric' },
    { testId: 'connected', condition: connected, isHard: false, messageGood: 'White cells form a single connected region', messageBad: 'White cells form multiple disconnected regions' },
  ];

  const hardFail = statusTable.some(status => status.condition === false && status.isHard);

  const statusElements = statusTable.map((status) => {
    const isGood = status.condition;
    const icon = isGood ? '✓' : (status.isHard ? '❌' : '⚠️');
    const message = isGood ? status.messageGood : status.messageBad;
    return (
      <tr key={status.testId} data-testid={status.testId}>
        <td data-testid={`${status.testId}-icon`}>{icon}</td>
        <td data-testid={`${status.testId}-message`}>{message}</td>
      </tr>
    );
  });

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
          <div>
            <RenderCrossword crossword={puzzle} />
            <table className="puzzle-status">
              <tbody>
                {statusElements}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <button className="create-button" onClick={() => onSubmit(puzzle)} disabled={hardFail}>Done</button>
    </>
  );
}
