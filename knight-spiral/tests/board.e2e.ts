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

async function waitForGenerationComplete(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => document.querySelector('.status')?.textContent?.includes('complete'),
    { timeout: 30000 }
  );
}

test('renders the knight spiral and responds to pan/zoom without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(BASE_URL);
  await expect(page.locator('h1')).toHaveText('Knight Spiral');
  await waitForGenerationComplete(page);

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

  // Reconfigure pieces via the notation field and confirm the list follows
  // and the pattern regenerates.
  const notationInput = page.locator('.notation input');
  await notationInput.fill('N,W,F,D,C');
  await expect(page.locator('.piece')).toHaveCount(5);
  await notationInput.blur();
  await waitForGenerationComplete(page);

  const updatedPixels = await canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')!;
    return Array.from(ctx.getImageData(0, 0, el.width, el.height).data);
  });
  expect(countNonBackgroundPixels(Uint8ClampedArray.from(updatedPixels))).toBeGreaterThan(0);

  // Changing a piece via the list updates the notation field to match.
  await page.locator('.piece select').first().selectOption('A');
  await expect(notationInput).toHaveValue('A,W,F,D,C');

  // The URL hash follows the settled config.
  await page.waitForFunction(() => location.hash === '#A,W,F,D,C');

  expect(errors).toEqual([]);
});

test('pinch-to-zoom in and back out with two simulated touch pointers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(BASE_URL);
  await waitForGenerationComplete(page);

  const canvas = page.locator('canvas');

  function scanlineTransitions() {
    return canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d')!;
      const { width, height } = el;
      const y = Math.floor(height / 2);
      const row = ctx.getImageData(0, y, width, 1).data;
      let transitions = 0;
      let last: string | null = null;
      for (let x = 0; x < width; x++) {
        const i = x * 4;
        const color = `${row[i]},${row[i + 1]},${row[i + 2]},${row[i + 3]}`;
        if (last !== null && color !== last) transitions++;
        last = color;
      }
      return transitions;
    });
  }

  function dispatchPointer(type: string, id: number, x: number, y: number) {
    return canvas.evaluate(
      (el, { type, id, x, y }) => {
        const rect = el.getBoundingClientRect();
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
            cancelable: true
          })
        );
      },
      { type, id, x, y }
    );
  }

  const box = (await canvas.boundingBox())!;
  const cx = box.width / 2;
  const cy = box.height / 2;

  const before = await scanlineTransitions();

  // Pinch out (fingers spread apart) should zoom in: fewer, larger cells
  // crossed by the same scanline.
  await dispatchPointer('pointerdown', 1, cx - 20, cy);
  await dispatchPointer('pointerdown', 2, cx + 20, cy);
  for (let d = 20; d <= 200; d += 20) {
    await dispatchPointer('pointermove', 1, cx - d, cy);
    await dispatchPointer('pointermove', 2, cx + d, cy);
  }
  await dispatchPointer('pointerup', 1, cx - 200, cy);
  await dispatchPointer('pointerup', 2, cx + 200, cy);
  const afterZoomIn = await scanlineTransitions();
  expect(afterZoomIn).toBeLessThan(before);

  // Pinch back in (fingers come together) should zoom back out.
  await dispatchPointer('pointerdown', 3, cx - 200, cy);
  await dispatchPointer('pointerdown', 4, cx + 200, cy);
  for (let d = 200; d >= 20; d -= 20) {
    await dispatchPointer('pointermove', 3, cx - d, cy);
    await dispatchPointer('pointermove', 4, cx + d, cy);
  }
  await dispatchPointer('pointerup', 3, cx - 20, cy);
  await dispatchPointer('pointerup', 4, cx + 20, cy);
  const afterZoomOut = await scanlineTransitions();
  expect(afterZoomOut).toBeGreaterThan(afterZoomIn);

  expect(errors).toEqual([]);
});

test('loads piece configuration from the URL hash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${BASE_URL}/#N,(1,4),C,Z`);
  await waitForGenerationComplete(page);
  // (1,4) canonicalizes to the named leaper G (Giraffe).
  await expect(page.locator('.notation input')).toHaveValue('N,G,C,Z');
  await expect(page.locator('.piece')).toHaveCount(4);

  expect(errors).toEqual([]);
});

test('falls back to the default config when the URL hash is invalid', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${BASE_URL}/#garbage,,,nope`);
  await waitForGenerationComplete(page);
  await expect(page.locator('.notation input')).toHaveValue('N,N');
  await page.waitForFunction(() => location.hash === '#N,N');

  expect(errors).toEqual([]);
});
