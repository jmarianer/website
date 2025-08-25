// tslint:disable:max-classes-per-file

export enum CellType {
  black,
  empty,
  outside,
}

export enum ClueDirection {
  across,
  down,
}

export class Clue {
  public initialPosition: Position;

  constructor(
    public clueNumber: number,
    public direction: ClueDirection,
    row: number,
    col: number,
  ) {
    this.initialPosition = new Position(row, col);
  }

  equals(other: Clue): boolean {
    return this.clueNumber === other.clueNumber && this.direction === other.direction;
  }

  isComplete(puzzle: Puzzle): boolean {
    const cells = puzzle.cells.flat().filter(cell => 
      cell.clues.some(clue => clue.equals(this))
    );
    return cells.every(cell => !cell.isEmpty());
  }
}

export class Position {
  constructor(public row: number, public col: number) {
    this.row = row;
    this.col = col;
  }
}

export class Cell {
  public solution: string = '';
  public type: CellType = CellType.empty;
  public clueNumber: number | null = null;
  public clues: Array<Clue> = [];
  public position: Position;
  public wordBoundaryAcross: boolean = false;
  public wordBoundaryDown: boolean = false;

  constructor(row: number, col: number) {
    this.position = new Position(row, col);
  }
  public isFillable() { return this.type === CellType.empty; }
  public isEmpty()    { return this.solution == '' || this.solution == ' '; }
  public isComplete() { return !this.isFillable() || !this.isEmpty(); }
}

export class Puzzle {
  constructor(
    public cells: Cell[][] = [],
    public clues: Clue[] = []
  ) {}

  isComplete(): boolean {
    return this.cells.flat().every(cell => cell.isComplete());
  }
}
