import { child, onValue, ref, set } from "firebase/database";
import { useParams } from "react-router"
import { database } from "./database";
import { useEffect, useMemo, useState } from "react";
import { Position, Puzzle, ClueDirection, Clue } from "./types";
import { RenderCrossword } from "./RenderCrossword";
import { cast } from '@deepkit/type';

export function Crossword() {
  const {id} = useParams();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  const [crossword, setCrossword] = useState<Puzzle | null>(null);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [currentClue, setCurrentClue] = useState<Clue | undefined>(undefined);

  function setSolution(key: string) {
    if (!position || !crossword) {
      return;
    }
    set(child(dbRef, `cells/${position.row}/${position.col}/solution`), key);
  }
  function move(drow: number, dcol: number) {
    if (!position || !crossword) {
      return;
    }

    let { row, col } = position;

    for (; ;) {
      row += drow;
      col += dcol;

      if (
        row < 0 ||
        row >= crossword.cells.length ||
        col < 0 ||
        col >= crossword.cells[row].length) {
        return;
      }

      const cell = crossword.cells[row][col];
      if (cell.isFillable()) {
        setPosition(new Position(row, col));

        let clue;
        if (cell.clues?.some(clue => clue.direction === currentClue?.direction)) {
          clue = cell.clues.filter(clue => clue.direction === currentClue?.direction)[0];
        } else {
          clue = cell.clues?.[0];
        }
        setCurrentClue(clue);
        return;
      }
    }
  }
  function handleKeyDown({ key }: KeyboardEvent) {
    if (!position || !crossword) {
      return;
    }
    if (key.length === 1) {
      setSolution(key.toUpperCase());
      if (currentClue?.direction === ClueDirection.across) {
        move(0, 1);
      } else {
        move(1, 0);
      }
    } else if (key === 'ArrowLeft') {
      move(0, -1);
    } else if (key === 'ArrowRight') {
      move(0, 1);
    } else if (key === 'ArrowUp') {
      move(-1, 0);
    } else if (key === 'ArrowDown') {
      move(1, 0);
    } else if (key === 'Backspace') {
      setSolution(' ');
      if (currentClue?.direction === ClueDirection.across) {
        move(0, -1);
      } else {
        move(-1, 0);
      }
    }
  }

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      const puzzle = snapshot.val();
      for (const row of puzzle.cells) {
        for (const cell of row) {
          for (const clue of cell.clues || []) {
            if (!clue.initialPosition) {
              clue.initialPosition = { row: -1, col: -1 };
            }
          }
        }
      }
      setCrossword(cast<Puzzle>(puzzle));
    });
  }, [dbRef]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  if (!crossword) {
    return <div></div>;
  }
  return <>
    <h1>Joey's awesome crossword app</h1>
    <div className="crossword-holder">
      <RenderCrossword
        crossword={crossword}
        position={position}
        clue={currentClue}
        onClick={cell => {
          setPosition(cell.position);
          setCurrentClue(cell.clues[0]);
        }} />
    </div>
  </>
}