// --- Interfaces & Types ---
interface Point {
	x: number;
	y: number;
	originX: number;
	originY: number;
	closest: Point[];
	circle?: Circle;
	active: number;
	startX: number;
	startY: number;
	targetX: number;
	targetY: number;
	tweenProgress: number;
	tweenDuration: number;
}

interface Target {
	x: number;
	y: number;
}

// --- Classes ---
class Circle {
	constructor(
		public pos: Point,
		public radius: number,
		public color: string,
	) {}

	draw(ctx: CanvasRenderingContext2D, activeOpacity: number): void {
		if (!activeOpacity) return;
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = `rgba(0,0,0,${activeOpacity})`;
		ctx.fill();
	}
}

export class ParticleNetwork {
	private width!: number;
	private height!: number;
	private canvas: HTMLCanvasElement | null;
	private ctx: CanvasRenderingContext2D | null = null;
	private points: Point[] = [];
	private target: Target = { x: 0, y: 0 };
	private isVisible: boolean = true;
	private animationFrameId: number = 0;
	private lastTime: number = 0;

	// 1. Changed constructor to only expect the canvas ID
	constructor(canvasId: string, root: ShadowRoot | null) {
		this.canvas = root?.getElementById(canvasId) as HTMLCanvasElement;

		if (this.canvas) {
			this.ctx = this.canvas.getContext("2d");
		}

		if (!this.canvas || !this.ctx) {
			console.error("ParticleNetwork: Canvas element or 2D context not found.");
			return;
		}

		this.init();
	}

	private init(): void {
		this.resize();
		this.createPoints();
		this.addListeners();
		this.initObserver();
		this.startAnimation();
	}

	private createPoints(): void {
		this.points = [];
		const xStep = this.width / 20;
		const yStep = this.height / 20;

		for (let x = 0; x < this.width; x += xStep) {
			for (let y = 0; y < this.height; y += yStep) {
				const px = x + Math.random() * xStep;
				const py = y + Math.random() * yStep;
				this.points.push({
					x: px,
					originX: px,
					y: py,
					originY: py,
					closest: [],
					active: 0,
					startX: px,
					startY: py,
					targetX: px,
					targetY: py,
					tweenProgress: 1,
					tweenDuration: 0,
				});
			}
		}

		for (const p1 of this.points) {
			const closestPoints: Point[] = [];

			for (const p2 of this.points) {
				if (p1 === p2) continue;

				if (closestPoints.length < 5) {
					closestPoints.push(p2);
				} else {
					closestPoints.sort(
						(a, b) => this.getDistance(p1, a) - this.getDistance(p1, b),
					);
					if (
						this.getDistance(p1, p2) <
						this.getDistance(p1, closestPoints[4] as Point)
					) {
						closestPoints[4] = p2;
					}
				}
			}
			p1.closest = closestPoints;
			p1.circle = new Circle(p1, 2 + Math.random() * 3, "rgba(0,0,0,0.3)");
		}
	}

	private addListeners(): void {
		if (!("ontouchstart" in window)) {
			window.addEventListener("mousemove", this.mouseMove.bind(this), {
				passive: true,
			});
		}

		let resizeTimeout: number;
		window.addEventListener(
			"resize",
			() => {
				cancelAnimationFrame(resizeTimeout);
				resizeTimeout = requestAnimationFrame(() => this.resize());
			},
			{ passive: true },
		);
	}

	// 2. The IntersectionObserver now targets the canvas directly
	private initObserver(): void {
		if (!this.canvas) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					this.isVisible = entry.isIntersecting;
					if (this.isVisible) this.lastTime = performance.now();
				});
			},
			{ threshold: 0 },
		);

		observer.observe(this.canvas);
	}

	private mouseMove(e: MouseEvent): void {
		this.target.x = e.clientX + window.scrollX;
		this.target.y = e.clientY + window.scrollY;
	}

	// 3. Removed the wrapper style manipulation; resizing only handles viewport calculations and canvas dimensions
	private resize(): void {
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		if (this.canvas) {
			this.canvas.width = this.width;
			this.canvas.height = this.height;
		}

		this.target = { x: this.width / 2, y: this.height / 2 };
	}

	private assignNewTween(p: Point): void {
		p.startX = p.x;
		p.startY = p.y;
		p.targetX = p.originX - 50 + Math.random() * 100;
		p.targetY = p.originY - 50 + Math.random() * 100;
		p.tweenProgress = 0;
		p.tweenDuration = 1000 + Math.random() * 1000;
	}

	private easeInOutCirc(x: number): number {
		return x < 0.5
			? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2
			: (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2;
	}

	private updatePointPositions(deltaTime: number): void {
		for (const p of this.points) {
			if (p.tweenProgress >= 1) {
				this.assignNewTween(p);
			}

			p.tweenProgress += deltaTime / p.tweenDuration;
			if (p.tweenProgress > 1) p.tweenProgress = 1;

			const ease = this.easeInOutCirc(p.tweenProgress);
			p.x = p.startX + (p.targetX - p.startX) * ease;
			p.y = p.startY + (p.targetY - p.startY) * ease;
		}
	}

	private startAnimation(): void {
		this.lastTime = performance.now();
		this.animationFrameId = requestAnimationFrame(this.animate);
	}

	private animate = (currentTime: number): void => {
		const deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		if (this.isVisible && this.ctx && this.canvas) {
			this.ctx.clearRect(0, 0, this.width, this.height);
			this.updatePointPositions(deltaTime);

			for (const p of this.points) {
				const distance = Math.abs(this.getDistance(this.target, p));

				if (distance < 4000) {
					p.active = 0.3;
					p.circle!.draw(this.ctx, 0.6);
				} else if (distance < 20000) {
					p.active = 0.1;
					p.circle!.draw(this.ctx, 0.3);
				} else if (distance < 40000) {
					p.active = 0.02;
					p.circle!.draw(this.ctx, 0.1);
				} else {
					p.active = 0;
				}

				this.drawLines(p);
			}
		}

		this.animationFrameId = requestAnimationFrame(this.animate);
	};

	private drawLines(p: Point): void {
		if (!p.active || !this.ctx) return;

		for (const closest of p.closest) {
			this.ctx.beginPath();
			this.ctx.moveTo(p.x, p.y);
			this.ctx.lineTo(closest.x, closest.y);
			this.ctx.strokeStyle = `rgba(0,0,0,${p.active})`;
			this.ctx.stroke();
		}
	}

	private getDistance(p1: Point | Target, p2: Point | Target): number {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		return dx * dx + dy * dy;
	}

	public destroy(): void {
		cancelAnimationFrame(this.animationFrameId);
	}
}
