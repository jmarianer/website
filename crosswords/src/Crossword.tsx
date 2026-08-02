import { child, onDisconnect, onValue, ref, remove, set, update } from "firebase/database";
import { useNavigate, useParams } from "react-router"
import { database } from "./database";
import { useEffect, useMemo, useRef, useState } from "react";
import { Position, Puzzle, ClueDirection, Clue, Cell, Cursor } from "./types";
import { RenderCrossword } from "./RenderCrossword";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { ColorPicker } from "./ColorPicker";
import { loadOrAssignColor, saveColor, PaletteColor, clientId } from "./identity";
import { cast } from '@deepkit/type';
import Switch from "react-switch";

// Mirrors the breakpoint in crosswords.scss, where the on-screen keyboard
// appears and vertical space becomes scarce.
const COMPACT = '(max-width: 700px)';

export function Crossword() {
  const {id} = useParams();
  const navigate = useNavigate();
  const dbRef = useMemo(() => ref(database, `crosswords/${id}`), [id]);
  const [crossword, setCrossword] = useState<Puzzle | null>(null);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [currentClue, setCurrentClue] = useState<Clue | undefined>(undefined);
  const [skipFilledCells, setSkipFilledCells] = useState<boolean>(false);
  const [skipFinishedClues, setSkipFinishedClues] = useState<boolean>(false);
  // Local, not synced: whether *you* are pencilling is nobody else's business.
  const [pencil, setPencil] = useState<boolean>(false);
  const [shareLabel, setShareLabel] = useState<string>('Share');
  // Collapsed on small screens, where the settings would otherwise eat the
  // vertical space the grid needs. Controlled rather than left to the DOM so a
  // re-render mid-solve cannot snap it shut again; kept in step with the
  // breakpoint by the matchMedia effect below.
  const [settingsOpen, setSettingsOpen] = useState<boolean>(
    () => !window.matchMedia(COMPACT).matches);
  const [color, setColor] = useState<PaletteColor>(loadOrAssignColor);
  const [presence, setPresence] = useState<Record<string, Cursor>>({});
  const [togetherMode, setTogetherMode] = useState<boolean>(false);
  const [sharedCursor, setSharedCursor] = useState<Cursor | null>(null);
  const me = useMemo(() => clientId(), []);
  const [zoom, setZoom] = useState<number>(1);
  const [fitSize, setFitSize] = useState<number>(40);
  const pinch = useRef<{ distance: number, zoom: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  // Read by the native touch listeners, which are attached once and so cannot
  // close over the current zoom. During a pinch this ref leads and the state
  // follows, so don't overwrite it mid-gesture.
  const zoomRef = useRef<number>(zoom);
  if (!pinch.current) {
    zoomRef.current = zoom;
  }

  const cell = position ? crossword?.cells[position.row][position.col] : null;

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setShareLabel('Copied!');
    setTimeout(() => setShareLabel('Share'), 2000);
  }

  // One update rather than three writes, so a letter never briefly renders in
  // the previous author's colour. Clearing a cell drops the authorship with it.
  function setSolution(key: string, pencil: boolean = false) {
    if (!position || !crossword) {
      return;
    }
    const written = key.trim().length > 0;
    update(child(dbRef, `cells/${position.row}/${position.col}`), {
      solution: key,
      author: written ? color.key : '',
      isPencil: written && pencil,
    });
  }

  // Called only where *we* move the cursor, never when applying someone else's.
  // `using` is explicit because callers may be publishing a colour that state
  // does not know about yet: setColor is asynchronous, so reading `color` here
  // during a colour change would publish the previous one.
  function publishCursor(at: Position, clue: Clue | undefined, using: PaletteColor = color) {
    if (!clue) {
      return;
    }
    const cursor: Cursor = {
      color: using.key,
      row: at.row,
      col: at.col,
      clueNumber: clue.clueNumber,
      direction: clue.direction,
    };
    set(child(dbRef, `presence/${me}`), cursor);
    if (togetherMode) {
      set(child(dbRef, 'sharedCursor'), cursor);
    }
  }

  function setCell(cell: Cell) {
    if (position?.row === cell.position.row && position?.col === cell.position.col) {
      const next = (cell.clues.length > 1 && currentClue?.equals(cell.clues[0]))
        ? cell.clues[1]
        : cell.clues[0];
      setCurrentClue(next);
      publishCursor(cell.position, next);
      return;
    }

    const matching = cell.clues?.filter(clue => clue.direction === currentClue?.direction);
    const next = matching?.length ? matching[0] : cell.clues?.[0];
    setPosition(cell.position);
    setCurrentClue(next);
    publishCursor(cell.position, next);
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

    const [drow, dcol] = (currentClue?.direction === ClueDirection.across) ? [0, 1] : [1, 0];
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

    const clues = [...crossword.clues].sort((a, b) =>
      a.direction - b.direction || a.clueNumber - b.clueNumber);
    let i = clues.findIndex(c => currentClue.equals(c));
    for ( ; ; ) {
      i = (i + (forward ? 1 : -1) + clues.length) % clues.length;
      const newClue = clues[i];
      if (!newClue.isComplete(crossword) || !skipFinishedClues || crossword.isComplete()) {
        setCurrentClue(newClue);
        setPosition(newClue.initialPosition);
        publishCursor(newClue.initialPosition, newClue);
        return;
      }
    }
  }

  function chooseColor(next: PaletteColor) {
    saveColor(next);
    setColor(next);
    if (position && currentClue) {
      publishCursor(position, currentClue, next);
    }
  }

  function toggleTogetherMode(on: boolean) {
    set(child(dbRef, 'togetherMode'), on);
    // Entering adopts whatever the toggler was looking at. Leaving needs
    // nothing: everyone's local cursor is already sitting on the shared one.
    if (on && position && currentClue) {
      set(child(dbRef, 'sharedCursor'), {
        color: color.key,
        row: position.row,
        col: position.col,
        clueNumber: currentClue.clueNumber,
        direction: currentClue.direction,
      });
    }
  }

  // Which cells should show someone else's cursor, and in whose colour. Palette
  // keys rather than colours -- the stylesheet owns the values. Nothing to draw
  // in Together mode: there is one cursor and everybody is already sitting on
  // it, so every client renders it as its own .active cell.
  const cursors = useMemo(() => {
    const byCell: Record<string, string[]> = {};
    if (togetherMode) {
      return byCell;
    }

    for (const [who, cursor] of Object.entries(presence)) {
      if (who !== me) {
        const key = `${cursor.row}-${cursor.col}`;
        (byCell[key] ??= []).push(cursor.color);
      }
    }
    return byCell;
  }, [presence, togetherMode, me]);

  function toggleDirection() {
    if (!cell || cell.clues.length < 2) {
      return;
    }
    const other = cell.clues.find(clue => clue.direction !== currentClue?.direction);
    if (other && position) {
      setCurrentClue(other);
      publishCursor(position, other);
    }
  }

  // Shared by the physical keyboard and the on-screen keyboard. Both guard
  // internally through setSolution and move, so they are safe to call directly.
  function typeLetter(letter: string) {
    setSolution(letter.toUpperCase(), pencil);
    moveToNextSpace();
  }

  function backspace() {
    setSolution(' ');
    if (currentClue?.direction === ClueDirection.across) {
      move(0, -1);
    } else {
      move(-1, 0);
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
      typeLetter(key);
    } else if (key === 'ArrowLeft') {
      move(0, -1);
    } else if (key === 'ArrowRight') {
      move(0, 1);
    } else if (key === 'ArrowUp') {
      move(-1, 0);
    } else if (key === 'ArrowDown') {
      move(1, 0);
    } else if (key === 'Backspace') {
      backspace();
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

      // Presence rides on the same node and the same subscription, so it has to
      // come off the raw snapshot: only cells and clues are handed to the cast.
      setPresence(puzzle.presence ?? {});
      setTogetherMode(puzzle.togetherMode ?? false);
      setSharedCursor(puzzle.sharedCursor ?? null);
      setCrossword(cast<Puzzle>({ cells: puzzle.cells, clues: puzzle.clues }));
    });
  }, [dbRef]);

  useEffect(() => {
    const mine = child(dbRef, `presence/${me}`);
    onDisconnect(mine).remove();
    return () => { remove(mine); };
  }, [dbRef, me]);

  useEffect(() => {
    if (!togetherMode || !sharedCursor || !crossword) {
      return;
    }
    if (position?.row === sharedCursor.row
        && position?.col === sharedCursor.col
        && currentClue?.clueNumber === sharedCursor.clueNumber
        && currentClue?.direction === sharedCursor.direction) {
      return;
    }
    setPosition(new Position(sharedCursor.row, sharedCursor.col));
    setCurrentClue(crossword.clues.find(clue =>
      clue.clueNumber === sharedCursor.clueNumber
      && clue.direction === sharedCursor.direction));
  }, [togetherMode, sharedCursor, crossword, position, currentClue]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  // --zoom is set imperatively rather than through the style prop, so that a
  // re-render mid-pinch cannot stomp on the value the gesture is writing.
  useEffect(() => {
    viewportRef.current?.style.setProperty('--zoom', String(zoom));
  }, [zoom]);

  // Re-sync when the window crosses the breakpoint. Without this, collapsing on
  // a narrow window and then widening it leaves the settings closed with the
  // disclosure control hidden, so there is no way to reopen them. Only fires on
  // a crossing, so a manual toggle survives resizing within one size class.
  useEffect(() => {
    const compact = window.matchMedia(COMPACT);
    const sync = () => setSettingsOpen(!compact.matches);
    compact.addEventListener('change', sync);
    return () => compact.removeEventListener('change', sync);
  }, []);

  const cols = crossword?.cells[0]?.length ?? 0;

  // Fit the puzzle to the available width, so there is never horizontal
  // scrolling at zoom 1. Height is deliberately not fitted: the space left over
  // after the header, settings and keyboard is small enough that fitting it too
  // shrinks the cells much further than it needs to.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !cols) {
      return;
    }

    const measure = () => {
      const holder = viewport.querySelector<HTMLElement>('.crossword-holder');
      const table = viewport.querySelector<HTMLElement>('.crossword');
      if (!holder || !table) {
        return;
      }

      // Measure the chrome rather than hard-coding it: clientWidth includes the
      // viewport's own padding, and the holder adds its border on top. Both are
      // independent of how wide the table currently is.
      const style = getComputedStyle(viewport);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const holderChrome = holder.offsetWidth - table.offsetWidth;
      const available = viewport.clientWidth - padding - holderChrome - 2;

      setFitSize(Math.max(12, Math.min(40, available / cols)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [cols]);

  // Pinch-zoom scales --cell-size rather than transforming the grid, so the
  // scroll container reflows to the real size and panning works natively.
  //
  // These are attached natively rather than as React props because React
  // registers touchmove as passive, which makes preventDefault a no-op -- and
  // without preventDefault, iOS Safari zooms the entire page instead. Safari
  // also needs its own gesture events swallowed for the same reason.
  const hasPuzzle = crossword !== null;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    function touchDistance(touches: TouchList) {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinch.current = { distance: touchDistance(e.touches), zoom: zoomRef.current };
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current) {
        return;
      }
      e.preventDefault();

      const scale = touchDistance(e.touches) / pinch.current.distance;
      const previous = zoomRef.current;
      const next = Math.min(4, Math.max(1, pinch.current.zoom * scale));
      if (next === previous) {
        return;
      }

      // Write the variable straight to the DOM during the gesture. Going
      // through React state here would re-render the whole grid on every
      // touchmove, which is far too slow to pinch against.
      zoomRef.current = next;
      viewport.style.setProperty('--zoom', String(next));

      // Anchor the zoom on the pinch midpoint: whatever content sits under it
      // should stay under it, instead of the grid growing away from its corner.
      // A point at distance d from the scroll origin moves to d * ratio, so the
      // scroll offset has to absorb the difference.
      const bounds = viewport.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - bounds.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - bounds.top;
      const ratio = next / previous;
      viewport.scrollLeft = (viewport.scrollLeft + midX) * ratio - midX;
      viewport.scrollTop = (viewport.scrollTop + midY) * ratio - midY;
    };

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2 && pinch.current) {
        pinch.current = null;
        setZoom(zoomRef.current);  // Commit, so React renders agree with the DOM.
      }
    }

    function preventGesture(e: Event) {
      e.preventDefault();
    }

    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    viewport.addEventListener('touchcancel', onTouchEnd);
    viewport.addEventListener('gesturestart', preventGesture);
    viewport.addEventListener('gesturechange', preventGesture);

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
      viewport.removeEventListener('gesturestart', preventGesture);
      viewport.removeEventListener('gesturechange', preventGesture);
    };
  }, [hasPuzzle]);

  if (!crossword) {
    return <div></div>;
  }
  return <>
    <h1>Joey's awesome crossword app</h1>
    <div className="crossword-and-settings">
      <details className="settings" open={settingsOpen}
               onToggle={e => setSettingsOpen(e.currentTarget.open)}>
        <summary>Settings</summary>
        <div className="actions">
          <button onClick={() => navigate(`/edit/${id}`)}>Edit</button>
          <button onClick={share}>{shareLabel}</button>
        </div>
        <div className="setting">
          <ColorPicker selected={color} onSelect={chooseColor} />
        </div>
        <div className="setting">
          <Switch id="pencil" onChange={setPencil} checked={pencil} aria-label="Pencil" />
          <label htmlFor="pencil">Pencil</label>
        </div>
        <div className="setting">
          <Switch id="together-mode" onChange={toggleTogetherMode} checked={togetherMode} aria-label="Together mode" />
          <label htmlFor="together-mode">Together mode</label>
        </div>
        <div className="setting">
          <Switch id="skip-filled-cells" onChange={setSkipFilledCells} checked={skipFilledCells} aria-label="Skip filled cells" />
          <label htmlFor="skip-filled-cells">Skip filled cells</label>
        </div>
        <div className="setting">
          <Switch id="skip-finished-clues" onChange={setSkipFinishedClues} checked={skipFinishedClues} aria-label="Skip finished clues" />
          <label htmlFor="skip-finished-clues">Skip finished clues</label>
        </div>
      </details>

      <div className="crossword-viewport"
           ref={viewportRef}
           style={{ '--fit-size': `${fitSize}px` } as React.CSSProperties}>
        <div className="crossword-holder">
          <RenderCrossword
            crossword={crossword}
            position={position}
            clue={currentClue}
            cursors={cursors}
            onClick={setCell} />
        </div>
      </div>

      <OnScreenKeyboard
        onLetter={typeLetter}
        onBackspace={backspace}
        onToggleDirection={toggleDirection}
        onMoveClue={moveToNextClue}
        direction={currentClue?.direction} />
    </div>
  </>
}