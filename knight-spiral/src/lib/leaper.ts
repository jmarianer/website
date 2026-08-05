export interface Offset {
	a: number;
	b: number;
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
