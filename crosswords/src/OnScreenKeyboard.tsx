import { ClueDirection } from './types';

const LETTER_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

type Props = {
  onKey: (key: string) => void;
  onToggleDirection: () => void;
  onMoveClue: (forward: boolean) => void;
  direction?: ClueDirection;
}

export function OnScreenKeyboard({ onKey, onToggleDirection, onMoveClue, direction }: Props) {
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
        <button className='action' tabIndex={-1} aria-label='Previous clue'
                onPointerDown={press(() => onMoveClue(false))}>‹ Clue</button>
        <button className='action' tabIndex={-1} aria-label='Switch direction'
                onPointerDown={press(onToggleDirection)}>
          {direction === ClueDirection.down ? '↓ Down' : '→ Across'}
        </button>
        <button className='action' tabIndex={-1} aria-label='Next clue'
                onPointerDown={press(() => onMoveClue(true))}>Clue ›</button>
      </div>

      {LETTER_ROWS.map(row =>
        <div className='key-row' key={row}>
          {[...row].map(letter =>
            <button key={letter} tabIndex={-1} onPointerDown={press(() => onKey(letter))}>{letter}</button>
          )}
          {row === LETTER_ROWS[LETTER_ROWS.length - 1] &&
            <button className='action' tabIndex={-1} aria-label='Backspace'
                    onPointerDown={press(() => onKey('Backspace'))}>⌫</button>}
        </div>
      )}
    </div>
  );
}
