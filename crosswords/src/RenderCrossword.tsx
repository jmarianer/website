import { Cell, CellType, Clue, Position, Puzzle } from "./types";
import './crosswords.scss';

type Props = {
  crossword: Puzzle;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
  // Palette keys, not colours: `row-col` to the people whose cursors are there.
  cursors?: Record<string, string[]>;
}

type CellProps = {
  cell: Cell;
  position?: Position;
  clue?: Clue;
  onClick?: (cell: Cell) => void;
  cursors?: string[];
}

// One corner each, so two people on a cell never stack or need ordering rules.
// Raising this needs a matching .flourish-N rule in the stylesheet to place it.
const MAX_CURSORS = 2;

// Declared at module scope on purpose: nesting this inside RenderCrossword makes
// it a new component type on every render, which remounts every cell in the grid.
function RenderCell({ cell, position, clue, onClick, cursors }: CellProps) {
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

  // Hue says who wrote it, shade and typeface say how sure they were. The colour
  // class supplies both --ink and --pencil; a letter with no author carries no
  // class and so inherits the default colour.
  const solutionClass = ['solution'];
  if (cell.isPencil) {
    solutionClass.push('pencil');
  }
  if (cell.author) {
    solutionClass.push(`color-${cell.author}`);
  }

  return (
    <td className={classList.join(' ')}
        data-testid={`cell-${cell.position.row}-${cell.position.col}`}
        onClick={() => {if (onClick) onClick(cell)}}>
      {cell.clueNumber === undefined ? '' : <div className='number'>{cell.clueNumber}</div>}
      {cursors?.slice(0, MAX_CURSORS).map((who, i) =>
        <span key={i} className={`flourish flourish-${i + 1} color-${who}`} data-testid='flourish' />
      )}
      <span className={solutionClass.join(' ')} data-testid="solution">
        {cell.solution}
      </span>
    </td>
  );
}

export function RenderCrossword({crossword, position, clue, onClick, cursors}: Props) {
  return (
    <table className='crossword' role='grid'
           style={{ '--cols': crossword.cells[0]?.length || 1 } as React.CSSProperties}>
      <tbody>
        {crossword.cells.map((row, i) =>
          <tr key={i}>
            {row.map((cell, j) =>
              <RenderCell key={j} cell={cell} position={position} clue={clue} onClick={onClick}
                          cursors={cursors?.[`${cell.position.row}-${cell.position.col}`]} />
            )}
          </tr>
        )}
      </tbody>
    </table>
  )
}
