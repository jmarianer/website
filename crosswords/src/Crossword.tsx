import { child, onDisconnect, onValue, ref, remove, set, update } from "firebase/database";
import { useNavigate, useParams } from "react-router"
import { database } from "./database";
import { useEffect, useMemo, useRef, useState } from "react";
import { Position, Puzzle, ClueDirection, Clue, Cell, Cursor } from "./types";
import { RenderCrossword } from "./RenderCrossword";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { SettingsMenu } from "./SettingsMenu";
import { loadColor, pickColor, saveColor, PaletteColor, clientId } from "./identity";
import { cast } from '@deepkit/type';

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
  // A popover on desktop, a bottom sheet on mobile, closed by default on both.
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const menuAnchor = useRef<HTMLDivElement>(null);
  // A first visit wears a provisional colour until the first snapshot says which
  // ones are free; only then is one chosen and persisted. That cannot happen in
  // this initialiser, which runs before any presence data exists.
  const storedColor = useMemo(() => loadColor(), []);
  const [color, setColor] = useState<PaletteColor>(() => storedColor ?? pickColor(new Set()));
  const colorSettled = useRef<boolean>(storedColor !== null);
  const claimedColor = useRef<string | null>(null);
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

  // Editing rebuilds the puzzle from its template, which drops every answer, so
  // it asks first rather than being a direct action.
  function editPuzzle() {
    const filled = crossword?.cells.flat().some(cell => cell.isFillable() && !cell.isEmpty());
    if (filled && !window.confirm(
      'Editing the grid clears every answer in this puzzle. Continue?')) {
      return;
    }
    navigate(`/edit/${id}`);
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
      // Somebody who has opened the puzzle but not yet moved has claimed a
      // colour without having a position, so there is nothing to draw for them.
      if (who !== me && cursor.row !== undefined && cursor.col !== undefined) {
        const key = `${cursor.row}-${cursor.col}`;
        (byCell[key] ??= []).push(cursor.color);
      }
    }
    return byCell;
  }, [presence, togetherMode, me]);

  // Colours other people are wearing, so the picker can show them as spoken for.
  const takenColors = useMemo(
    () => new Set(Object.entries(presence)
      .filter(([who]) => who !== me)
      .map(([, cursor]) => cursor.color)),
    [presence, me]);

  // Settle on a colour once the first snapshot has told us what is free. Guarded
  // by a ref rather than by state so it happens exactly once: an existing choice
  // is never revised, even if somebody else is already wearing it.
  useEffect(() => {
    if (colorSettled.current || !crossword) {
      return;
    }
    colorSettled.current = true;
    const chosen = pickColor(takenColors);
    saveColor(chosen);
    setColor(chosen);
  }, [crossword, takenColors]);

  // Claim the colour in presence straight away, rather than waiting for the
  // first cursor move to publish it. Otherwise everyone who has opened the
  // puzzle but not yet started solving is invisible to the picker, and two
  // people arriving together would both see a free palette.
  useEffect(() => {
    if (!crossword || claimedColor.current === color.key) {
      return;
    }
    claimedColor.current = color.key;
    update(child(dbRef, `presence/${me}`), { color: color.key });
  }, [crossword, color, dbRef, me]);

  // Which edge gets marked follows from the clue you are on, so this needs no
  // direction of its own -- exactly how the space bar has always behaved.
  function toggleWordBoundary() {
    if (!position || !cell) {
      return;
    }
    const edge = currentClue?.direction === ClueDirection.across
      ? 'wordBoundaryAcross'
      : 'wordBoundaryDown';
    const current = currentClue?.direction === ClueDirection.across
      ? cell.wordBoundaryAcross
      : cell.wordBoundaryDown;
    set(child(dbRef, `cells/${position.row}/${position.col}/${edge}`), !current);
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
    // While the menu is open it owns the keyboard -- otherwise typing would fill
    // in letters behind it, and Escape would be swallowed before closing it.
    if (!position || !crossword || settingsOpen) {
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    e.preventDefault();
    const key = e.key;
    if (key === ' ') {
      toggleWordBoundary();
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

  // The menu closes on an outside click and on Escape, per its interaction
  // contract. Escape is handled here rather than in handleKeyDown because that
  // one bails out entirely while the menu is open.
  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    function onPointerDown(e: PointerEvent) {
      if (!menuAnchor.current?.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [settingsOpen]);

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
  const breakArrow = currentClue?.direction === ClueDirection.down ? '↓' : '→';

  return <>
    <div className="title-bar" ref={menuAnchor}>
      <h1>Joey's awesome crossword app</h1>
      <button type="button" className="menu-trigger" aria-haspopup="menu"
              aria-expanded={settingsOpen} aria-label="Puzzle settings"
              onClick={() => setSettingsOpen(!settingsOpen)}>⋯</button>

      <SettingsMenu
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          color={color}
          taken={takenColors}
          onSelectColor={chooseColor}
          skipFilledCells={skipFilledCells}
          onSkipFilledCells={setSkipFilledCells}
          skipFinishedClues={skipFinishedClues}
          onSkipFinishedClues={setSkipFinishedClues}
          togetherMode={togetherMode}
          onTogetherMode={toggleTogetherMode}
          shareLabel={shareLabel}
          onShare={share}
          onEdit={editPuzzle} />
    </div>

    <div className="crossword-and-settings">
      {/* Hidden on mobile, where the on-screen keyboard carries them instead. */}
      <div className="puzzle-bar">
        <button type="button" className="key key-action" aria-pressed={pencil}
                onClick={() => setPencil(!pencil)}>
          <span aria-hidden="true">✎</span> Pencil
        </button>
        <button type="button" className="key key-action" aria-label="Toggle word boundary"
                onClick={toggleWordBoundary}>
          Break <span aria-hidden="true">{breakArrow}</span>
        </button>
      </div>

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
        onMoveClue={moveToNextClue}
        onToggleWordBoundary={toggleWordBoundary}
        onTogglePencil={() => setPencil(!pencil)}
        pencil={pencil}
        breakArrow={breakArrow} />
    </div>
  </>
}