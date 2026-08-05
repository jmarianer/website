import { describe, expect, it } from 'vitest';
import {
	leaperAttackOffsets,
	normalizeOffset,
	letterForOffset,
	formatOffset,
	formatNotation,
	parseNotation,
	type Offset
} from './leaper';

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

describe('normalizeOffset', () => {
	it('sorts a and b so a <= b', () => {
		expect(normalizeOffset({ a: 2, b: 1 })).toEqual({ a: 1, b: 2 });
		expect(normalizeOffset({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it('takes absolute values', () => {
		expect(normalizeOffset({ a: -2, b: 1 })).toEqual({ a: 1, b: 2 });
	});
});

describe('letterForOffset / formatOffset', () => {
	it('finds the letter for a named leaper regardless of argument order', () => {
		expect(letterForOffset({ a: 1, b: 2 })).toBe('N');
		expect(letterForOffset({ a: 2, b: 1 })).toBe('N');
		expect(letterForOffset({ a: 1, b: 4 })).toBe('G');
	});

	it('has no letter for an offset outside the named set', () => {
		expect(letterForOffset({ a: 5, b: 9 })).toBeUndefined();
	});

	it('formats named leapers as their letter and others as (a,b)', () => {
		expect(formatOffset({ a: 1, b: 2 })).toBe('N');
		expect(formatOffset({ a: 5, b: 9 })).toBe('(5,9)');
		expect(formatOffset({ a: 9, b: 5 })).toBe('(5,9)'); // canonicalized
	});
});

describe('formatNotation / parseNotation round-trip', () => {
	it('formats a list of offsets as comma-separated tokens', () => {
		expect(
			formatNotation([
				{ a: 1, b: 2 },
				{ a: 5, b: 9 }
			])
		).toBe('N,(5,9)');
	});

	it('parses named letters case-insensitively and trims whitespace', () => {
		const result = parseNotation('n, W , f');
		expect(result).toEqual({
			ok: true,
			offsets: [
				{ a: 1, b: 2 },
				{ a: 0, b: 1 },
				{ a: 1, b: 1 }
			]
		});
	});

	it('parses numeric (a,b) tokens and canonicalizes them', () => {
		expect(parseNotation('N,(1,4),(9,5)')).toEqual({
			ok: true,
			offsets: [
				{ a: 1, b: 2 },
				{ a: 1, b: 4 },
				{ a: 5, b: 9 }
			]
		});
	});

	it('round-trips formatNotation -> parseNotation -> formatNotation', () => {
		const offsets: Offset[] = [
			{ a: 1, b: 2 },
			{ a: 5, b: 9 },
			{ a: 0, b: 1 }
		];
		const notation = formatNotation(offsets);
		const parsed = parseNotation(notation);
		expect(parsed.ok).toBe(true);
		expect(parsed.ok && formatNotation(parsed.offsets)).toBe(notation);
	});

	it('rejects an unknown letter', () => {
		expect(parseNotation('N,X')).toEqual({
			ok: false,
			error: `"X" isn't a known piece or an (a,b) leaper.`
		});
	});

	it('rejects a malformed numeric token', () => {
		expect(parseNotation('N,(1,)')).toEqual({
			ok: false,
			error: `"(1,)" isn't a known piece or an (a,b) leaper.`
		});
	});

	it('rejects a (0,0) leaper', () => {
		expect(parseNotation('(0,0)')).toEqual({
			ok: false,
			error: `"(0,0)" doesn't move anywhere.`
		});
	});

	it('rejects empty input', () => {
		expect(parseNotation('')).toEqual({ ok: false, error: 'Enter at least one piece.' });
		expect(parseNotation('  ,  ')).toEqual({ ok: false, error: 'Enter at least one piece.' });
	});
});
