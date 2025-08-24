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
}

export class Puzzle {
  constructor(
    public cells: Cell[][] = [],
    public clues: Clue[] = []
  ) {}
}
