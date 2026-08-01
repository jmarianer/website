// The archive is rendered as one flat list of slides, but its URLs are semantic:
//
//   /game/ABCD/archive              chain 1 title (alias for /archive/1)
//   /game/ABCD/archive/3            "Chain 3" title
//   /game/ABCD/archive/3/2          2nd panel in chain 3
//   /game/ABCD/archive/3/summary    chain 3 "started with / ended with"
//   /game/ABCD/archive/end          "The end"
//
// Chains and pictures are 1-based in the URL to match the on-screen "Chain 3"
// labelling, and 0-based everywhere else. There is no chain entity in the
// database: a chain is just the walk that starts at a given player index, and a
// picture is a round index, so these identifiers are minted here.

import { Game } from './database';

export type SlideAddress =
  | { kind: 'title'; chain: number }
  | { kind: 'picture'; chain: number; round: number }
  | { kind: 'summary'; chain: number }
  | { kind: 'end' };

// Each chain contributes a title slide, one slide per round, and a summary.
function slidesPerChain(totalRounds: number) {
  return totalRounds + 2;
}

export function slideCount({
  totalRounds,
  players: { length: playerCount },
}: Game) {
  return playerCount * slidesPerChain(totalRounds) + 1;
}

export function slideIndex(
  address: SlideAddress,
  { totalRounds, players: { length: playerCount } }: Game,
): number {
  const perChain = slidesPerChain(totalRounds);
  switch (address.kind) {
    case 'title':
      return address.chain * perChain;
    case 'picture':
      return address.chain * perChain + 1 + address.round;
    case 'summary':
      return address.chain * perChain + 1 + totalRounds;
    case 'end':
      return playerCount * perChain;
  }
}

export function addressAtIndex(
  index: number,
  { totalRounds, players: { length: playerCount } }: Game,
): SlideAddress {
  const perChain = slidesPerChain(totalRounds);
  if (index >= playerCount * perChain) {
    return { kind: 'end' };
  }

  const chain = Math.floor(index / perChain);
  const offset = index % perChain;
  if (offset === 0) {
    return { kind: 'title', chain };
  }
  if (offset === perChain - 1) {
    return { kind: 'summary', chain };
  }
  return { kind: 'picture', chain, round: offset - 1 };
}

export function formatPath(address: SlideAddress): string {
  switch (address.kind) {
    case 'title':
      return `${address.chain + 1}`;
    case 'picture':
      return `${address.chain + 1}/${address.round + 1}`;
    case 'summary':
      return `${address.chain + 1}/summary`;
    case 'end':
      return 'end';
  }
}

/** Returns null for anything that doesn't name a slide of this game. */
export function parsePath(
  path: string,
  { totalRounds, players: { length: playerCount } }: Game,
): SlideAddress | null {
  const address = parseSegments(
    path.split('/').filter((segment) => segment !== ''),
  );
  if (!address || address.kind === 'end') {
    return address;
  }
  if (address.chain < 0 || address.chain >= playerCount) {
    return null;
  }
  if (
    address.kind === 'picture' &&
    (address.round < 0 || address.round >= totalRounds)
  ) {
    return null;
  }
  return address;
}

function parseSegments(segments: string[]): SlideAddress | null {
  if (segments.length === 0) {
    return { kind: 'title', chain: 0 };
  }
  if (segments.length === 1 && segments[0] === 'end') {
    return { kind: 'end' };
  }

  const chainNo = Number(segments[0]);
  if (!Number.isInteger(chainNo)) {
    return null;
  }

  if (segments.length === 1) {
    return { kind: 'title', chain: chainNo - 1 };
  }
  if (segments.length === 2 && segments[1] === 'summary') {
    return { kind: 'summary', chain: chainNo - 1 };
  }
  if (segments.length === 2) {
    const pictureNo = Number(segments[1]);
    if (!Number.isInteger(pictureNo)) {
      return null;
    }
    return { kind: 'picture', chain: chainNo - 1, round: pictureNo - 1 };
  }
  return null;
}
