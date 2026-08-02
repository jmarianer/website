export type PaletteColor = {
  key: string;
  name: string;
  hex: string;
}

// Your colour is your identity: there is no auth and no display name, and two
// devices that pick the same colour are deliberately the same person.
//
// Deliberately no blue in the palette. The current cell is #4a90e2 and the
// current word is #b3d0ff, so a blue letter would vanish into the highlight.
// Every entry is dark enough to stay legible on white once pencil marks draw it
// at reduced opacity.
export const PALETTE: PaletteColor[] = [
  { key: 'slate',   name: 'Slate',   hex: '#2c3e50' },
  { key: 'crimson', name: 'Crimson', hex: '#a11d2e' },
  { key: 'amber',   name: 'Amber',   hex: '#9a5b00' },
  { key: 'olive',   name: 'Olive',   hex: '#4f6b12' },
  { key: 'forest',  name: 'Forest',  hex: '#15662f' },
  { key: 'teal',    name: 'Teal',    hex: '#0a5f5c' },
  { key: 'violet',  name: 'Violet',  hex: '#5b2d8e' },
  { key: 'magenta', name: 'Magenta', hex: '#8e1f63' },
];

const COLOR_STORAGE_KEY = 'crosswords:color';
const CLIENT_STORAGE_KEY = 'crosswords:client-id';

export function findColor(key: string | null | undefined): PaletteColor {
  return PALETTE.find(color => color.key === key) ?? PALETTE[0];
}

// Stores the palette key rather than the hex, so restyling a swatch carries over
// to people who already picked it.
export function saveColor(color: PaletteColor) {
  localStorage.setItem(COLOR_STORAGE_KEY, color.key);
}

// Picks at random on a first visit rather than defaulting everyone to the same
// swatch. Once presence exists this should prefer a colour nobody is using.
export function loadOrAssignColor(): PaletteColor {
  const stored = localStorage.getItem(COLOR_STORAGE_KEY);
  const existing = PALETTE.find(color => color.key === stored);
  if (existing) {
    return existing;
  }

  const assigned = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  saveColor(assigned);
  return assigned;
}

// Per tab, not per browser: this identifies a presence slot, not a person. Two
// tabs on one machine are legitimately two cursors, both wearing the same colour.
export function clientId(): string {
  let id = sessionStorage.getItem(CLIENT_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CLIENT_STORAGE_KEY, id);
  }
  return id;
}
