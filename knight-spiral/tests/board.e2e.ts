import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

function countNonBackgroundPixels(data: Uint8ClampedArray): number {
	let count = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
			count++;
		}
	}
	return count;
}

test('renders the knight spiral and responds to pan/zoom without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));

	await page.goto(BASE_URL);
	await expect(page.locator('h1')).toHaveText('Knight Spiral');

	const canvas = page.locator('canvas');
	await expect(canvas).toBeVisible();

	const box = await canvas.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeGreaterThan(0);
	expect(box!.height).toBeGreaterThan(0);

	const initialPixels = await canvas.evaluate((el: HTMLCanvasElement) => {
		const ctx = el.getContext('2d')!;
		return Array.from(ctx.getImageData(0, 0, el.width, el.height).data);
	});
	expect(countNonBackgroundPixels(Uint8ClampedArray.from(initialPixels))).toBeGreaterThan(0);

	// Pan by dragging.
	const cx = box!.x + box!.width / 2;
	const cy = box!.y + box!.height / 2;
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 60, cy + 40, { steps: 5 });
	await page.mouse.up();

	// Zoom by scrolling.
	await page.mouse.wheel(0, -200);
	await page.waitForTimeout(50);

	// Increase the color count and confirm the pattern regenerates.
	const slider = page.locator('input[type="range"]');
	await slider.fill('5');
	await expect(page.locator('.value')).toHaveText('5');
	await page.waitForTimeout(300); // debounce

	const updatedPixels = await canvas.evaluate((el: HTMLCanvasElement) => {
		const ctx = el.getContext('2d')!;
		return Array.from(ctx.getImageData(0, 0, el.width, el.height).data);
	});
	expect(countNonBackgroundPixels(Uint8ClampedArray.from(updatedPixels))).toBeGreaterThan(0);

	expect(errors).toEqual([]);
});
