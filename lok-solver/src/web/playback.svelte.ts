import type { Move } from '../core/types.js';
import type { Solution } from './render.js';

const ANIM_MS = 250;

/**
 * Drives stepping through a solution's moves with an animation clock.
 *
 * Owns the move cursor (`step`), the play/pause flag, and a requestAnimationFrame
 * loop that exposes elapsed time so the view can grow the route line and blacken
 * cells. The solution is supplied lazily via `getSolution` so this stays reactive
 * to whatever the host component currently has solved.
 *
 * Instantiate during component init (the constructor registers an `$effect`).
 */
export class Playback {
  /** Number of moves fully applied. While animating move N, this is already N + 1. */
  step = $state(0);
  playing = $state(false);
  /** ms since the current move's animation started, or null when settled. */
  animElapsed = $state<number | null>(null);

  /** Route length of the move currently being animated. */
  #animMoveLength = $state(0);
  #animRAF: number | null = null;
  #getSolution: () => Solution | null;

  constructor(getSolution: () => Solution | null) {
    this.#getSolution = getSolution;

    // Auto-playback: whenever an animation settles and we're still playing,
    // either advance to the next move or stop at the end.
    $effect(() => {
      if (this.animElapsed !== null || !this.playing) return;
      const sol = this.#getSolution();
      if (!sol || this.step >= sol.moves.length) {
        this.playing = false;
        return;
      }
      this.advance();
    });
  }

  get currentMove(): Move | null {
    const sol = this.#getSolution();
    return sol && this.step > 0 ? sol.moves[this.step - 1]! : null;
  }

  // Discrete cell index for darkening (and gating "are we animating?"). null = settled.
  get animProgress(): number | null {
    if (this.animElapsed === null) return null;
    const frac = this.animElapsed / ANIM_MS - 1;
    if (frac < 0) return -1;
    return Math.min(Math.floor(frac), this.#animMoveLength - 1);
  }

  // Continuous progress for line growth; see routePoints() for the semantics.
  // When settled, returns route.length - 1 so the full line stays drawn.
  get lineFraction(): number {
    if (this.animElapsed === null) {
      const move = this.currentMove;
      return move ? move.route.length - 1 : -1;
    }
    return this.animElapsed / ANIM_MS - 1;
  }

  clearAnim(): void {
    if (this.#animRAF !== null) {
      cancelAnimationFrame(this.#animRAF);
      this.#animRAF = null;
    }
    this.animElapsed = null;
  }

  advance(): void {
    const sol = this.#getSolution();
    if (!sol || this.step >= sol.moves.length) return;
    this.clearAnim();
    const move = sol.moves[this.step]!;
    this.step++;
    this.#animMoveLength = move.route.length;
    this.animElapsed = 0;
    // Total duration: one unit of pre-roll wait + one unit per cell visited.
    const totalDuration = (move.route.length + 1) * ANIM_MS;
    const startTime = performance.now();
    const frame = (now: number): void => {
      const elapsed = now - startTime;
      if (elapsed >= totalDuration) {
        this.animElapsed = null;
        this.#animRAF = null;
        return;
      }
      this.animElapsed = elapsed;
      this.#animRAF = requestAnimationFrame(frame);
    };
    this.#animRAF = requestAnimationFrame(frame);
  }

  goBack(): void {
    this.playing = false;
    this.clearAnim();
    if (this.step > 0) this.step--;
  }

  reset(): void {
    this.playing = false;
    this.clearAnim();
    this.step = 0;
  }

  togglePlay(): void {
    const sol = this.#getSolution();
    if (!sol) return;
    if (this.playing) {
      this.playing = false;
      return;
    }
    // If we're at the end, restart from the beginning before playing.
    if (this.step >= sol.moves.length) this.step = 0;
    this.playing = true;
    if (this.animElapsed === null) this.advance();
  }
}
