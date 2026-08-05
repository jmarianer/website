import { describe, expect, it } from 'vitest';
import { leaperAttackOffsets, type Offset } from './leaper';

function sorted(offsets: Offset[]): string[] {
	return offsets.map(({ a, b }) => `${a},${b}`).sort();
}

describe('leaperAttackOffsets', () => {
	it('gives a knight (1,2) its 8 classic moves', () => {
		expect(sorted(leaperAttackOffsets({ a: 1, b: 2 }))).toEqual(
			sorted([
				{ a: 1, b: 2 },
				{ a: 1, b: -2 },
				{ a: -1, b: 2 },
				{ a: -1, b: -2 },
				{ a: 2, b: 1 },
				{ a: 2, b: -1 },
				{ a: -2, b: 1 },
				{ a: -2, b: -1 }
			])
		);
	});

	it('gives a wazir (1,0) its 4 orthogonal neighbors', () => {
		expect(sorted(leaperAttackOffsets({ a: 1, b: 0 }))).toEqual(
			sorted([
				{ a: 1, b: 0 },
				{ a: -1, b: 0 },
				{ a: 0, b: 1 },
				{ a: 0, b: -1 }
			])
		);
	});

	it('gives a ferz (1,1) its 4 diagonal neighbors', () => {
		expect(sorted(leaperAttackOffsets({ a: 1, b: 1 }))).toEqual(
			sorted([
				{ a: 1, b: 1 },
				{ a: 1, b: -1 },
				{ a: -1, b: 1 },
				{ a: -1, b: -1 }
			])
		);
	});
});
