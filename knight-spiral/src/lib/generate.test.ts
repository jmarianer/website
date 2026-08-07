import { describe, expect, it } from 'vitest';
import { generatePlacements } from './generate';
import { generateSpiral } from './spiral';
import { leaperAttackOffsets, type Offset } from './leaper';
import { KNIGHT_OFFSET } from './constants';

function knights(colorCount: number): Offset[] {
  return Array.from({ length: colorCount }, () => KNIGHT_OFFSET);
}

describe('generatePlacements', () => {
  it('starts with color 0 at the origin', () => {
    const placements = generatePlacements(knights(2), 1);
    expect(placements).toEqual([{ index: 0, x: 0, y: 0, color: 0 }]);
  });

  it('streams the same pieces via onBatch, in order, as it returns directly', () => {
    const batches: ReturnType<typeof generatePlacements>[] = [];
    const placements = generatePlacements(knights(3), 137, (batch) => batches.push(batch), 10);

    expect(batches.flat()).toEqual(placements);
    // All batches but the last should be exactly batchSize.
    for (const batch of batches.slice(0, -1)) {
      expect(batch).toHaveLength(10);
    }
    expect(batches.at(-1)!.length).toBe(137 % 10);
  });

  it('cycles through colors round-robin', () => {
    const placements = generatePlacements(knights(3), 7);
    expect(placements.map((p) => p.color)).toEqual([0, 1, 2, 0, 1, 2, 0]);
  });

  it('matches the hand-verified opening for two knights', () => {
    const placements = generatePlacements(knights(2), 4);
    expect(placements).toEqual([
      { index: 0, x: 0, y: 0, color: 0 },
      { index: 1, x: 1, y: 0, color: 1 },
      { index: 2, x: 1, y: 1, color: 0 },
      { index: 3, x: 0, y: 1, color: 1 }
    ]);
  });

  const scenarios: [label: string, offsetsByColor: Offset[]][] = [
    ['2 knights', knights(2)],
    ['3 knights', knights(3)],
    ['5 knights', knights(5)],
    ['8 knights', knights(8)],
    [
      'mixed pieces (wazir, ferz, knight, dabbaba)',
      [{ a: 0, b: 1 }, { a: 1, b: 1 }, KNIGHT_OFFSET, { a: 0, b: 2 }]
    ]
  ];

  for (const [label, offsetsByColor] of scenarios) {
    it(`places ${label} on distinct cells, none attacking a different color, each at the lowest legal spiral index at the time it was placed`, () => {
      const pieceCount = 80;
      const colorCount = offsetsByColor.length;
      const placements = generatePlacements(offsetsByColor, pieceCount);
      const attackVectorsByColor = offsetsByColor.map(leaperAttackOffsets);
      const spiral = generateSpiral(20000);

      expect(placements).toHaveLength(pieceCount);

      const occupied = new Set<string>();
      const attackedByColor: Set<string>[] = Array.from({ length: colorCount }, () => new Set());

      for (const piece of placements) {
        const key = `${piece.x},${piece.y}`;

        // Cell is free at the moment this piece is placed.
        expect(occupied.has(key)).toBe(false);
        for (let c = 0; c < colorCount; c++) {
          if (c !== piece.color) {
            expect(attackedByColor[c].has(key)).toBe(false);
          }
        }

        // No earlier spiral cell was a legal alternative.
        for (let n = 0; n < piece.index; n++) {
          const candidate = spiral[n];
          const candidateKey = `${candidate.x},${candidate.y}`;
          const isOccupied = occupied.has(candidateKey);
          const isAttacked = Array.from({ length: colorCount }, (_, c) => c).some(
            (c) => c !== piece.color && attackedByColor[c].has(candidateKey)
          );
          expect(isOccupied || isAttacked).toBe(true);
        }

        occupied.add(key);
        for (const { a, b } of attackVectorsByColor[piece.color]) {
          attackedByColor[piece.color].add(`${piece.x + a},${piece.y + b}`);
        }
      }
    });
  }
});
