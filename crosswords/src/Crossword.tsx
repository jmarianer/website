import { child, onValue, ref, set } from "firebase/database";
import { useParams } from "react-router"
import { database } from "./database";
import { useEffect, useMemo, useState } from "react";
import { Position, Puzzle, ClueDirection, CellType } from "./types";
import { RenderCrossword } from "./RenderCrossword";

export function Crossword() {
  const {id} = useParams();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  const [crossword, setCrossword] = useState<Puzzle | null>(null);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [currentClueNumber, setCurrentClueNumber] = useState<number | undefined>(undefined);
  const [currentClueDirection, setCurrentClueDirection] = useState<ClueDirection | undefined>(undefined);

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
      if (cell.type === CellType.empty) {
        setPosition(new Position(row, col));

        let clue;
        if (cell.clues?.some(clue => clue.direction === currentClueDirection)) {
          clue = cell.clues.filter(clue => clue.direction === currentClueDirection)[0];
        } else {
          clue = cell.clues?.[0];
        }
        setCurrentClueNumber(clue?.clueNumber);
        setCurrentClueDirection(clue?.direction);
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
      if (currentClueDirection === ClueDirection.across) {
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
      if (currentClueDirection === ClueDirection.across) {
        move(0, -1);
      } else {
        move(-1, 0);
      }
    }
  }

  useEffect(() => {
    onValue(dbRef, (snapshot) => {
      setCrossword(snapshot.val());
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
        clueNumber={currentClueNumber}
        clueDirection={currentClueDirection}
        onClick={cell => {
          setPosition(cell.position);
          setCurrentClueNumber(cell.clues?.[0].clueNumber);
          setCurrentClueDirection(cell.clues?.[0].direction);
        }} />
    </div>
  </>
}