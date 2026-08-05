export interface Point {
	x: number;
	y: number;
}

interface WalkState {
	x: number;
	y: number;
	dx: number;
	dy: number;
	segmentLength: number;
	segmentPassed: number;
	turns: number;
}

function initialWalkState(): WalkState {
	return { x: 0, y: 0, dx: 1, dy: 0, segmentLength: 1, segmentPassed: 0, turns: 0 };
}

/** Advances the walk by one cell, winding outward counterclockwise. */
function step(state: WalkState): Point {
	state.x += state.dx;
	state.y += state.dy;

	state.segmentPassed++;
	if (state.segmentPassed === state.segmentLength) {
		state.segmentPassed = 0;
		[state.dx, state.dy] = [-state.dy, state.dx]; // rotate 90° counterclockwise
		state.turns++;
		if (state.turns % 2 === 0) state.segmentLength++;
	}

	return { x: state.x, y: state.y };
}

/**
 * The first `count` cells of an Ulam-style square spiral: index 0 at the
 * origin, index 1 one step right, winding outward counterclockwise.
 */
export function generateSpiral(count: number): Point[] {
	if (count <= 0) return [];

	const state = initialWalkState();
	const points: Point[] = [{ x: 0, y: 0 }];
	for (let i = 1; i < count; i++) points.push(step(state));
	return points;
}

/**
 * A spiral that grows on demand instead of being precomputed to a fixed
 * length, so there's no arbitrary cap on how far a search can reach.
 */
export class SpiralCache {
	private points: Point[] = [{ x: 0, y: 0 }];
	private state = initialWalkState();

	at(index: number): Point {
		while (this.points.length <= index) {
			this.points.push(step(this.state));
		}
		return this.points[index];
	}
}
