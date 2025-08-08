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
  public clueNumber: number;
  public direction: ClueDirection;
  public initialPosition: Position;
  public clue: string | null = null;

  constructor(clueNumber: number, direction: ClueDirection, row: number, col: number) {
    this.clueNumber = clueNumber;
    this.direction = direction;
    this.initialPosition = new Position(row, col);
  }
}

export class Position {
  public row: number;
  public col: number;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }
}

export class Cell {
  public solution: string = '';
  public type: CellType = CellType.empty;
  public clueNumber: number | null = null;
  public clues: Array<{ clueNumber: number; direction: ClueDirection }> | null = null;
  public position: Position;
  public wordBoundaryAcross: boolean = false;
  public wordBoundaryDown: boolean = false;

  constructor(row: number, col: number) {
    this.position = new Position(row, col);
  }
  public isFillable() { return this.type === CellType.empty; }
}

export class Puzzle {
  public cells: Cell[][] = [];
  public clues: Clue[] = [];
}
