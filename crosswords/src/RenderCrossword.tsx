import { Cell, CellType, ClueDirection, Position, Puzzle } from "./types";
import './crosswords.scss';

type Props = {
  crossword: Puzzle;
  position?: Position;
  clueNumber?: number;
  clueDirection?: ClueDirection;
  onClick?: (cell: Cell) => void;
}

export function RenderCrossword({crossword, position, clueNumber, clueDirection, onClick}: Props) {
  function RenderCell(cell: Cell) {
    if (cell.type === CellType.black) {
      return <td className='black' />;
    }
    if (cell.type === CellType.outside) {
      return <td className='outside' />;
    }

    let classList = ['empty'];
    if (cell.wordBoundaryAcross) {
      classList.push('word-boundary-across');
    }
    if (cell.wordBoundaryDown) {
      classList.push('word-boundary-down');
    }

    if (position?.col === cell.position.col && position?.row === cell.position.row) {
      classList.push('active');
    }

    if (cell.clues?.some((clue) => clue.clueNumber === clueNumber && clue.direction === clueDirection)) {
      classList.push('active-word')
    }

    return (
      <td className={classList.join(' ')} onClick={() => {if (onClick) onClick(cell)}}>
        {cell.clueNumber === undefined ? '' : <div className='number'>{cell.clueNumber}</div>}
        <span className='solution'>{cell.solution}</span>
      </td>
    );
  }

  return (
    <table className='crossword'>
    { crossword.cells.map((row) =>
      <tr>
        { row.map(RenderCell) }
      </tr>
    )}
  </table>
  )
}