export interface Point {
	x: number;
	y: number;
}

/**
 * The first `count` cells of an Ulam-style square spiral: index 0 at the
 * origin, index 1 one step right, winding outward counterclockwise.
 */
export function generateSpiral(count: number): Point[] {
	if (count <= 0) return [];

	const points: Point[] = [{ x: 0, y: 0 }];
	let x = 0;
	let y = 0;
	let dx = 1;
	let dy = 0;
	let segmentLength = 1;
	let segmentPassed = 0;
	let turns = 0;

	for (let i = 1; i < count; i++) {
		x += dx;
		y += dy;
		points.push({ x, y });

		segmentPassed++;
		if (segmentPassed === segmentLength) {
			segmentPassed = 0;
			[dx, dy] = [-dy, dx]; // rotate 90° counterclockwise
			turns++;
			if (turns % 2 === 0) segmentLength++;
		}
	}

	return points;
}
