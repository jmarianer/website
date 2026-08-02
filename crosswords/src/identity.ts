export type PaletteColor = {
  // Also the CSS class: `color-${key}` carries the actual values.
  key: string;
  name: string;
}

// Your colour is your identity: there is no auth and no display name, and two
// devices that pick the same colour are deliberately the same person.
//
// This list is only the roster -- which colours exist, in what order, and what
// to call them for a screen reader. The key doubles as the CSS class name. The
// actual values live in the $palette map in crosswords.scss, along with the
// reasoning about why they are what they are: a colour is a styling decision,
// and keeping the hexes here would mean every visual change had to touch two
// languages.
export const PALETTE: PaletteColor[] = [
  { key: 'black',  name: 'Black'  },
  { key: 'red',    name: 'Red'    },
  { key: 'orange', name: 'Orange' },
  { key: 'green',  name: 'Green'  },
  { key: 'blue',   name: 'Blue'   },
  { key: 'purple', name: 'Purple' },
  { key: 'pink',   name: 'Pink'   },
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

// Not crypto.randomUUID: that is only exposed in a secure context, so it is
// missing when the dev server is reached over plain HTTP from a phone on the
// LAN. getRandomValues carries no such restriction, and this is an opaque key
// rather than something that needs to be a well-formed UUID.
function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Per tab, not per browser: this identifies a presence slot, not a person. Two
// tabs on one machine are legitimately two cursors, both wearing the same colour.
export function clientId(): string {
  let id = sessionStorage.getItem(CLIENT_STORAGE_KEY);
  if (!id) {
    id = randomId();
    sessionStorage.setItem(CLIENT_STORAGE_KEY, id);
  }
  return id;
}
