export type Letter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export type CellSymbol = Letter | '*';

export type Color = 'W' | 'B';

export type Cell = null | { sym: CellSymbol; col: Color };

export type Grid = {
  rows: number;
  cols: number;
  cells: ReadonlyArray<ReadonlyArray<Cell>>;
};

export type Coord = { r: number; c: number };

export type Word = 'LOK' | 'TLAK' | 'TA' | 'BE';

export type Direction = 'N' | 'S' | 'E' | 'W';

export type Move =
  | { word: 'LOK'; route: Coord[]; target: Coord }
  | { word: 'TLAK'; route: Coord[]; first: Coord; direction: 'N' | 'E'; second: Coord }
  | { word: 'TA'; route: Coord[]; symbol: CellSymbol }
  | { word: 'BE'; route: Coord[]; star: Coord; newLetter: Letter };
