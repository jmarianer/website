export interface Offset {
	a: number;
	b: number;
}

/**
 * Standard Betza "funny notation" letters for the common leapers, in
 * canonical (a,b) form with a <= b. Order here is display order (roughly
 * increasing range) for pickers.
 */
export const NAMED_LEAPERS: [letter: string, offset: Offset][] = [
	['W', { a: 0, b: 1 }], // Wazir
	['F', { a: 1, b: 1 }], // Ferz
	['D', { a: 0, b: 2 }], // Dabbaba
	['N', { a: 1, b: 2 }], // Knight
	['A', { a: 2, b: 2 }], // Alfil
	['H', { a: 0, b: 3 }], // Threeleaper
	['C', { a: 1, b: 3 }], // Camel
	['Z', { a: 2, b: 3 }], // Zebra
	['G', { a: 1, b: 4 }] // Giraffe
];

const NAMED_LEAPERS_BY_LETTER = new Map(NAMED_LEAPERS.map(([letter, offset]) => [letter, offset]));
const NAMED_LEAPERS_BY_OFFSET = new Map(
	NAMED_LEAPERS.map(([letter, offset]) => [offsetKey(offset), letter])
);

function offsetKey({ a, b }: Offset): string {
	return `${a},${b}`;
}

/** Leapers (a,b) and (b,a) are the same piece; canonical form has a <= b. */
export function normalizeOffset({ a, b }: Offset): Offset {
	const x = Math.abs(a);
	const y = Math.abs(b);
	return x <= y ? { a: x, b: y } : { a: y, b: x };
}

/** The Betza letter for this offset, if it's one of the named leapers. */
export function letterForOffset(offset: Offset): string | undefined {
	return NAMED_LEAPERS_BY_OFFSET.get(offsetKey(normalizeOffset(offset)));
}

/** A named letter if there is one, otherwise a numeric "(a,b)" fallback. */
export function formatOffset(offset: Offset): string {
	const letter = letterForOffset(offset);
	if (letter) return letter;
	const { a, b } = normalizeOffset(offset);
	return `(${a},${b})`;
}

export function formatNotation(offsets: Offset[]): string {
	return offsets.map(formatOffset).join(',');
}

const NUMERIC_TOKEN = /^\((\d+),(\d+)\)$/;

/** Splits on commas, except commas inside a (a,b) token's parentheses. */
function splitTokens(text: string): string[] {
	const tokens: string[] = [];
	let depth = 0;
	let current = '';
	for (const ch of text) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) {
			tokens.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	tokens.push(current.trim());
	return tokens.filter((token) => token.length > 0);
}

export type ParseNotationResult = { ok: true; offsets: Offset[] } | { ok: false; error: string };

/**
 * Parses comma-separated Betza-style tokens ("N,N" or "N,(1,4),W") into
 * offsets. Pure syntax parsing only — piece-count bounds (min/max colors)
 * are a product rule, not a notation rule, so callers check those
 * separately.
 */
export function parseNotation(text: string): ParseNotationResult {
	const tokens = splitTokens(text);

	if (tokens.length === 0) {
		return { ok: false, error: 'Enter at least one piece.' };
	}

	const offsets: Offset[] = [];
	for (const token of tokens) {
		const letterOffset = NAMED_LEAPERS_BY_LETTER.get(token.toUpperCase());
		if (letterOffset) {
			offsets.push(letterOffset);
			continue;
		}

		const numericMatch = NUMERIC_TOKEN.exec(token);
		if (numericMatch) {
			const a = Number(numericMatch[1]);
			const b = Number(numericMatch[2]);
			if (a === 0 && b === 0) {
				return { ok: false, error: `"${token}" doesn't move anywhere.` };
			}
			offsets.push(normalizeOffset({ a, b }));
			continue;
		}

		return { ok: false, error: `"${token}" isn't a known piece or an (a,b) leaper.` };
	}

	return { ok: true, offsets };
}

/**
 * All squares a leaper defined by offset (a,b) attacks: every sign/order
 * variant of (a,b), deduplicated. E.g. (1,2) -> the 8 knight-move cells,
 * (1,1) -> the 4 diagonal neighbors (ferz), (1,0) -> the 4 orthogonal
 * neighbors (wazir).
 */
export function leaperAttackOffsets({ a, b }: Offset): Offset[] {
	const seen = new Set<string>();
	const result: Offset[] = [];

	for (const [da, db] of [
		[a, b],
		[b, a]
	]) {
		for (const sa of [1, -1]) {
			for (const sb of [1, -1]) {
				const x = da * sa;
				const y = db * sb;
				if (x === 0 && y === 0) continue;

				const key = `${x},${y}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({ a: x, b: y });
			}
		}
	}

	return result;
}
