const LETTER_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

type Props = {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onMoveClue: (forward: boolean) => void;
  onToggleWordBoundary: () => void;
  onTogglePencil: () => void;
  pencil: boolean;
  breakArrow: string;
}

export function OnScreenKeyboard(
  { onLetter, onBackspace, onMoveClue, onToggleWordBoundary, onTogglePencil, pencil, breakArrow }: Props
) {
  // Act on pointer-down and swallow the event: that keeps focus on the document
  // so the physical keydown listener is unaffected, and avoids the double-fire
  // you'd get from handling both pointer and click on touch devices.
  function press(action: () => void) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      action();
    };
  }

  return (
    <div className='on-screen-keyboard' role='group' aria-label='On-screen keyboard'>
      <div className='key-row'>
        <button className='key key-action' tabIndex={-1} aria-label='Previous clue'
                onPointerDown={press(() => onMoveClue(false))}>‹ Clue</button>
        <button className='key key-action' tabIndex={-1} aria-label='Next clue'
                onPointerDown={press(() => onMoveClue(true))}>Clue ›</button>
        <button className='key key-action' tabIndex={-1} aria-label='Toggle word boundary'
                onPointerDown={press(onToggleWordBoundary)}>
          Break <span aria-hidden='true'>{breakArrow}</span>
        </button>
        <button className='key key-action' tabIndex={-1} aria-label='Pencil'
                aria-pressed={pencil} onPointerDown={press(onTogglePencil)}>
          <span aria-hidden='true'>✎</span> Pencil
        </button>
      </div>

      {LETTER_ROWS.map(row =>
        <div className='key-row' key={row}>
          {[...row].map(letter =>
            <button key={letter} className='key' tabIndex={-1}
                    onPointerDown={press(() => onLetter(letter))}>{letter}</button>
          )}
          {row === LETTER_ROWS[LETTER_ROWS.length - 1] &&
            <button className='key key-action' tabIndex={-1} aria-label='Backspace'
                    onPointerDown={press(onBackspace)}>⌫</button>}
        </div>
      )}
    </div>
  );
}
