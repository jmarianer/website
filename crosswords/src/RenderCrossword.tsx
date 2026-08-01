import { Cell, CellType, Clue, Position, Puzzle } from "./types";
import './crosswords.scss';

type Props = {
  crossword: Puzzle;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
}

type CellProps = {
  cell: Cell;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
}

// Declared at module scope on purpose: nesting this inside RenderCrossword makes
// it a new component type on every render, which remounts every cell in the grid.
function RenderCell({ cell, position, clue, onClick }: CellProps) {
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
    <td className={classList.join(' ')} data-testid={`cell-${cell.position.row}-${cell.position.col}`} onClick={() => {if (onClick) onClick(cell)}}>
      {cell.clueNumber === undefined ? '' : <div className='number'>{cell.clueNumber}</div>}
      <span className='solution' data-testid="solution">{cell.solution}</span>
    </td>
  );
}

export function RenderCrossword({crossword, position, clue, onClick}: Props) {
  return (
    <table className='crossword' role='grid'
           style={{ '--cols': crossword.cells[0]?.length || 1 } as React.CSSProperties}>
      <tbody>
        {crossword.cells.map((row, i) =>
          <tr key={i}>
            {row.map((cell, j) =>
              <RenderCell key={j} cell={cell} position={position} clue={clue} onClick={onClick} />
            )}
          </tr>
        )}
      </tbody>
    </table>
  )
}
