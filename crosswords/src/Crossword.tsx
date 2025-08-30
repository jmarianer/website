import { child, onValue, ref, set } from "firebase/database";
import { useParams } from "react-router"
import { database } from "./database";
import { useEffect, useMemo, useState } from "react";
import { Position, Puzzle, ClueDirection, Clue, Cell } from "./types";
import { RenderCrossword } from "./RenderCrossword";
import { cast } from '@deepkit/type';
import { sortBy } from "lodash";
import Switch from "react-switch";

export function Crossword() {
  const {id} = useParams();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  const [crossword, setCrossword] = useState<Puzzle | null>(null);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [currentClue, setCurrentClue] = useState<Clue | undefined>(undefined);
  const [skipFilledCells, setSkipFilledCells] = useState<boolean>(false);
  const [skipFinishedClues, setSkipFinishedClues] = useState<boolean>(false);

  const cell = position ? crossword?.cells[position.row][position.col] : null;

  function setSolution(key: string) {
    if (!position || !crossword) {
      return;
    }
    set(child(dbRef, `cells/${position.row}/${position.col}/solution`), key);
  }

  function setCell(cell: Cell) {
    if (position === cell.position) {
      if (cell.clues.length > 1 && currentClue?.equals(cell.clues[0])) {
        setCurrentClue(cell.clues[1]);
      } else {
        setCurrentClue(cell.clues[0]);
      }
      return;
    }

    setPosition(cell.position);
    if (cell.clues?.some(clue => clue.direction === currentClue?.direction)) {
      setCurrentClue(cell.clues.filter(clue => clue.direction === currentClue?.direction)[0]);
    } else {
      setCurrentClue(cell.clues?.[0]);
    }
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
        setCell(cell);
        return;
      }
    }
  }

  function moveToNextSpace() {
    if (!position || !crossword) {
      return;
    }

    let [drow, dcol] = (currentClue?.direction === ClueDirection.across) ? [0, 1] : [1, 0];
    let { row, col } = position;

    for (; ;) {
      row += drow;
      col += dcol;

      const cell = crossword.cells[row][col];
      if (!cell.isFillable()) {
        moveToNextClue();
        return;
      }
      if (cell.isEmpty() || !skipFilledCells || (currentClue?.isComplete(crossword))) {
        setCell(cell);
        return;
      }
    }
  }

  function moveToNextClue(forward: boolean = true) {
    if (!currentClue || !crossword) {
      return;
    }

    const clues = sortBy(crossword?.clues, 'direction', 'clueNumber');
    let i = clues.findIndex(c => currentClue.equals(c));
    for ( ; ; ) {
      i = (i + (forward ? 1 : -1) + clues.length) % clues.length;
      const newClue = clues[i];
      if (!newClue.isComplete(crossword) || !skipFinishedClues || crossword.isComplete()) {
        setCurrentClue(newClue);
        setPosition(newClue.initialPosition);
        return;
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!position || !crossword) {
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    e.preventDefault();
    const key = e.key;
    if (key === ' ') {
      if (currentClue?.direction === ClueDirection.across) {
        set(child(dbRef, `cells/${position.row}/${position.col}/wordBoundaryAcross`), !cell?.wordBoundaryAcross);
      } else {
        set(child(dbRef, `cells/${position.row}/${position.col}/wordBoundaryDown`), !cell?.wordBoundaryDown);
      }
    }
    else if (key.length === 1) {
      setSolution(key.toUpperCase());
      moveToNextSpace();
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
    } else if (key === 'Tab' || key === 'Enter') {
      moveToNextClue(!e.shiftKey);
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
    <div className="settings">
    <label>
      <Switch onChange={setSkipFilledCells} checked={skipFilledCells} />
      <span>Skip filled cells</span>
    </label>
    <label>
      <Switch onChange={setSkipFinishedClues} checked={skipFinishedClues} />
      <span>Skip finished clues</span>
    </label>
    </div>

    <div className="crossword-holder">
      <RenderCrossword
        crossword={crossword}
        position={position}
        clue={currentClue}
        onClick={setCell} />
    </div>
  </>
}