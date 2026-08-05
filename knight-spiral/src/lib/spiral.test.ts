import { describe, expect, it } from 'vitest';
import { generateSpiral } from './spiral';

describe('generateSpiral', () => {
	it('returns an empty array for count 0', () => {
		expect(generateSpiral(0)).toEqual([]);
	});

	it('starts at the origin', () => {
		expect(generateSpiral(1)).toEqual([{ x: 0, y: 0 }]);
	});

	it('winds outward counterclockwise, starting one step right', () => {
		expect(generateSpiral(9)).toEqual([
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 1 },
			{ x: -1, y: 0 },
			{ x: -1, y: -1 },
			{ x: 0, y: -1 },
			{ x: 1, y: -1 }
		]);
	});

	it('never visits the same cell twice', () => {
		const points = generateSpiral(2000);
		const seen = new Set(points.map(({ x, y }) => `${x},${y}`));
		expect(seen.size).toBe(points.length);
	});
});
