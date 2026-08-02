import { Cell, CellType, Clue, Position, Puzzle } from "./types";
import { findColor } from "./identity";
import './crosswords.scss';

type Props = {
  crossword: Puzzle;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
  cursorRings?: Record<string, string[]>;
}

type CellProps = {
  cell: Cell;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
  rings?: string[];
}

// Other people's cursors are drawn as inset rings rather than a background,
// because the background is already spent on .active and .active-word. Concentric
// so that two people on one cell both stay visible; beyond two it is unreadable,
// so the rest are dropped.
function ringShadow(rings: string[]): string {
  return rings
    .slice(0, 2)
    .map((hex, i) => `inset 0 0 0 ${(i + 1) * 3}px ${hex}`)
    .join(', ');
}

// Declared at module scope on purpose: nesting this inside RenderCrossword makes
// it a new component type on every render, which remounts every cell in the grid.
function RenderCell({ cell, position, clue, onClick, rings }: CellProps) {
  if (cell.type === CellType.black) {
    return <td className='black' />;
  }
  if (cell.type === CellType.outside) {
    return <td className='outside' />;
  }

  const classList = ['empty'];
  if (cell.wordBoundaryAcross) {
    classList.push('word-boundary-across');
  }
  if (cell.wordBoundaryDown) {
    classList.push('word-boundary-down');
  }

  if (position?.col === cell.position.col && position?.row === cell.position.row) {
    classList.push('active');
  }

  if (cell.clues?.some(it => clue?.equals(it))) {
    classList.push('active-word')
  }

  return (
    <td className={classList.join(' ')}
        data-testid={`cell-${cell.position.row}-${cell.position.col}`}
        style={rings?.length ? { boxShadow: ringShadow(rings) } : undefined}
        onClick={() => {if (onClick) onClick(cell)}}>
      {cell.clueNumber === undefined ? '' : <div className='number'>{cell.clueNumber}</div>}
      <span className={cell.isPencil ? 'solution pencil' : 'solution'}
            data-testid="solution"
            style={cell.author ? { color: findColor(cell.author).hex } : undefined}>
        {cell.solution}
      </span>
    </td>
  );
}

export function RenderCrossword({crossword, position, clue, onClick, cursorRings}: Props) {
  return (
    <table className='crossword' role='grid'
           style={{ '--cols': crossword.cells[0]?.length || 1 } as React.CSSProperties}>
      <tbody>
        {crossword.cells.map((row, i) =>
          <tr key={i}>
            {row.map((cell, j) =>
              <RenderCell key={j} cell={cell} position={position} clue={clue} onClick={onClick}
                          rings={cursorRings?.[`${cell.position.row}-${cell.position.col}`]} />
            )}
          </tr>
        )}
      </tbody>
    </table>
  )
}
