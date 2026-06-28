/**
 * Payload emitted each frame by {@link LerpScroll}.
 */
type ScrollEvent = {
	/** Smoothed scroll position in virtual pixels. */
	scroll: number;
	/** Frame-over-frame delta of the smoothed position (pixels/frame). */
	velocity: number;
};

/**
 * Callback signature for {@link LerpScroll} scroll events.
 */
type ScrollCallback = (event: ScrollEvent) => void;

/**
 * CSP-compliant lerp-based virtual scroll driver.
 *
 * Accumulates `wheel` and touch-drag input into a virtual `#targetY` counter,
 * then lerps `#currentY` toward it each RAF frame, firing registered callbacks
 * with the smooth position and per-frame velocity. Makes NO DOM mutations —
 * fully safe under strict `style-src 'self'` CSP.
 *
 * @remarks
 * Drop-in replacement for the scroll-value consumer API of Lenis 1.x:
 * `on('scroll', cb)`, `start()`, `stop()`, `raf(time)` (no-op), `destroy()`.
 *
 * Unlike Lenis, this class does not apply any CSS transforms to the page.
 * Unlike the previous `window.scrollY` approach, this works correctly when
 * `body { overflow: hidden }` prevents native document scroll.
 *
 * Wheel `deltaMode` handling:
 * - `0` (DOM_DELTA_PIXEL, trackpad): `deltaY` used as-is
 * - `1` (DOM_DELTA_LINE, mouse wheel): multiplied by `20` (≈ 1 line)
 * - `2` (DOM_DELTA_PAGE): multiplied by `window.innerHeight`
 */
class LerpScroll {
	/** Linear interpolation factor per frame (0 < lerp < 1). */
	readonly #lerp: number;

	/**
	 * Upper bound on `#targetY`. Wheel and touch deltas are clamped here so
	 * the user cannot scroll past the last scene item.
	 */
	readonly #maxScroll: number;

	/** Whether scroll callbacks should fire this tick. */
	#running = true;

	/** Smoothed virtual scroll position, updated each RAF. */
	#currentY = 0;

	/** Virtual scroll target accumulated from wheel / touch input. */
	#targetY = 0;

	/** Y coordinate of the most-recent touchstart contact point. */
	#lastTouchY = 0;

	/** Active `requestAnimationFrame` handle; `null` when destroyed. */
	#rafId: number | null = null;

	/** Registered scroll callbacks. */
	readonly #callbacks: ScrollCallback[] = [];

	/**
	 * Creates a `LerpScroll` and starts its internal RAF loop.
	 *
	 * @param lerp - Interpolation factor per frame. `0.08` matches the default
	 *   feel of Lenis 1.x.
	 * @param maxScroll - Maximum virtual scroll position in pixels. Defaults to
	 *   `Infinity` (unbounded). Pass the scene end position to prevent scrolling
	 *   past the last item.
	 */
	constructor(lerp = 0.08, maxScroll = Infinity) {
		this.#lerp = lerp;
		this.#maxScroll = maxScroll;
		window.addEventListener("wheel", this.#onWheel, { passive: true });
		window.addEventListener("touchstart", this.#onTouchStart, {
			passive: true,
		});
		window.addEventListener("touchmove", this.#onTouchMove, { passive: true });
		this.#rafId = requestAnimationFrame(this.#tick);
	}

	/** @internal */
	readonly #onWheel = (e: WheelEvent): void => {
		if (!this.#running) return;
		let delta = e.deltaY;
		if (e.deltaMode === 1) delta *= 20;
		else if (e.deltaMode === 2) delta *= window.innerHeight;
		this.#targetY += delta;
		if (this.#targetY < 0) this.#targetY = 0;
		if (this.#targetY > this.#maxScroll) this.#targetY = this.#maxScroll;
	};

	/** @internal */
	readonly #onTouchStart = (e: TouchEvent): void => {
		this.#lastTouchY = e.touches[0]?.clientY ?? 0;
	};

	/** @internal */
	readonly #onTouchMove = (e: TouchEvent): void => {
		if (!this.#running) return;
		const y = e.touches[0]?.clientY ?? 0;
		const delta = this.#lastTouchY - y;
		this.#lastTouchY = y;
		this.#targetY += delta;
		if (this.#targetY < 0) this.#targetY = 0;
		if (this.#targetY > this.#maxScroll) this.#targetY = this.#maxScroll;
	};

	/** @internal */
	readonly #tick = (): void => {
		const prev = this.#currentY;
		this.#currentY += (this.#targetY - this.#currentY) * this.#lerp;
		const velocity = this.#currentY - prev;
		if (this.#running) {
			const event: ScrollEvent = { scroll: this.#currentY, velocity };
			for (const cb of this.#callbacks) cb(event);
		}
		this.#rafId = requestAnimationFrame(this.#tick);
	};

	/**
	 * Resumes firing scroll callbacks and accepting wheel/touch input after {@link stop}.
	 */
	start(): void {
		this.#running = true;
	}

	/**
	 * Pauses scroll callbacks and ignores wheel/touch input without halting the
	 * internal RAF. Interpolation continues so the position is current on {@link start}.
	 */
	stop(): void {
		this.#running = false;
	}

	/**
	 * No-op compatibility shim matching `lenis.raf(time)` call sites.
	 *
	 * @param _time - DOMHighResTimeStamp from the RAF callback (unused).
	 */
	raf(_time: number): void {}

	/**
	 * Registers a callback invoked each frame while the instance is running.
	 *
	 * @param _event - Event name; always `'scroll'` (matches the Lenis 1.x API).
	 * @param cb - Callback receiving a {@link ScrollEvent}.
	 */
	on(_event: "scroll", cb: ScrollCallback): void {
		this.#callbacks.push(cb);
	}

	/**
	 * Removes all input listeners and cancels the RAF loop.
	 * Call when the host component disconnects to prevent memory leaks.
	 */
	destroy(): void {
		window.removeEventListener("wheel", this.#onWheel);
		window.removeEventListener("touchstart", this.#onTouchStart);
		window.removeEventListener("touchmove", this.#onTouchMove);
		if (this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
		}
	}
}

export type { ScrollCallback, ScrollEvent };
export { LerpScroll };
