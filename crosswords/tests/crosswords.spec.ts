import { test, PUZZLE_TEMPLATE, openCrossword } from './fixtures';
import { PALETTE } from '../src/identity';
import { expect } from '@playwright/test';

test('Crosswords creation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Create new crossword' }).click();
  await expect(page).toHaveURL('/create');

  await page.getByRole('textbox').fill(PUZZLE_TEMPLATE);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/crossword\/(.+)$/);
  await expect(page.getByRole('grid')).toBeVisible();
});

test('Crosswords real-time sync', async ({ browser, crossword }) => {
  const secondCrossword = await openCrossword(browser, crossword.id);
  await expect(secondCrossword.page.getByRole('grid')).toBeVisible();

  await crossword.cell(1, 1).click();
  await crossword.press('A');
  await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
  await expect(secondCrossword.cell(1, 1).getByTestId('solution')).toHaveText('A');

  // Test that lowercase input gets uppercased.
  await crossword.press('b');
  await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('B');
  await expect(secondCrossword.cell(1, 2).getByTestId('solution')).toHaveText('B');

  // Test that changes made in the second window also sync back to the first window.
  await secondCrossword.cell(5, 1).click();
  await secondCrossword.press('c');
  await expect(secondCrossword.cell(5, 1).getByTestId('solution')).toHaveText('C');
  await expect(crossword.cell(5, 1).getByTestId('solution')).toHaveText('C');
});

test.describe('Creation validation', () => {
  test('Rejects empty grids', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('empty-grid').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('empty-grid').getByTestId('message')).toHaveText('Grid is empty');
  });

  test('Rejects grids where no fillable cells exist', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx\nxx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
  });

  test('Rejects grids where no two-cell words exist', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('x.\n.x');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
  });

  test('Warns about non-rotational symmetry', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx.\nxx.\nxxx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('symmetric').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('symmetric').getByTestId('message')).toHaveText('Not rotationally symmetric');
  });

  test('Two different warnings', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx.\n.xx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
        await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form multiple disconnected regions');
  });

  test('Warns about disconnected components', async ({ page }) => {
    await page.goto("/create");
    await page.getByRole('textbox').fill('..\nxx\n..');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form multiple disconnected regions');
  });

  test('All good conditions', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('x.x\n...\nx.x');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('empty-grid').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('empty-grid').getByTestId('message')).toHaveText('Grid is not empty');
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('Clues found');
    await expect(page.getByTestId('symmetric').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('symmetric').getByTestId('message')).toHaveText('Rotationally symmetric');
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form a single connected region');
  });
});

// `active` on its own -- /active/ would also match `active-word`.
const ACTIVE = /(?:^|\s)active(?:\s|$)/;

test.describe('Presence', () => {
  test("Another solver's cursor shows a flourish, and ours does not", async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);

    await crossword.cell(1, 1).click();
    await second.cell(1, 3).click();

    await expect(crossword.cell(1, 3).getByTestId('flourish')).toHaveCount(1);
    // Our own position is already shown by .active, so it gets no flourish.
    await expect(crossword.cell(1, 1).getByTestId('flourish')).toHaveCount(0);
  });

  test('Changing colour recolours the flourish others see, on the first click', async ({ browser, crossword }) => {
    const red = 'rgb(211, 47, 47)';     // #d32f2f
    const purple = 'rgb(106, 27, 154)'; // #6a1b9a
    const second = await openCrossword(browser, crossword.id);

    // Establish a known colour rather than relying on the random initial one,
    // so a stale publish cannot pass by coincidence.
    await second.openMenu();
    await second.page.getByTestId('color-red').click();
    await second.closeMenu();
    await second.cell(1, 3).click();
    await expect(crossword.cell(1, 3).getByTestId('flourish'))
      .toHaveCSS('background-color', red);

    // One click, not two: publishing must use the colour just chosen rather
    // than whatever React state still holds.
    await second.openMenu();
    await second.page.getByTestId('color-purple').click();
    await expect(crossword.cell(1, 3).getByTestId('flourish'))
      .toHaveCSS('background-color', purple);
  });

  test('Together mode moves everyone to the same cell', async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);
    await crossword.openMenu();
    await crossword.toggle('Together mode').click();

    await crossword.closeMenu();

    await crossword.cell(1, 1).click();
    await expect(second.cell(1, 1)).toHaveClass(ACTIVE);
    // No flourish: everyone is on the cell already, so .active says it.
    await expect(second.cell(1, 1).getByTestId('flourish')).toHaveCount(0);

    // And it is genuinely shared, not one-way.
    await second.cell(1, 3).click();
    await expect(crossword.cell(1, 3)).toHaveClass(ACTIVE);
  });

  test('Leaving Together mode lets cursors move independently again', async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);

    await crossword.openMenu();
    await crossword.toggle('Together mode').click();
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await expect(second.cell(1, 1)).toHaveClass(ACTIVE);

    await crossword.openMenu();
    await crossword.toggle('Together mode').click();
    await crossword.closeMenu();
    await second.cell(1, 3).click();
    await expect(second.cell(1, 3)).toHaveClass(ACTIVE);
    await expect(crossword.cell(1, 1)).toHaveClass(ACTIVE);
  });
});

test.describe('Pencil marks', () => {
  test('Pencilled letters use the script face, inked ones do not', async ({ crossword }) => {
    const page = crossword.page;
    await crossword.cell(1, 1).click();
    await crossword.press('A');

    await page.getByRole('button', { name: 'Pencil' }).click();
    await crossword.press('B');

    await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveCSS('font-family', /cursive/);
    await expect(crossword.cell(1, 1).getByTestId('solution')).not.toHaveCSS('font-family', /cursive/);
  });

  test('Letters are tinted with their author, and others see it', async ({ browser, crossword }) => {
    const purple = 'rgb(106, 27, 154)';  // #6a1b9a
    const second = await openCrossword(browser, crossword.id);

    await second.openMenu();
    await second.page.getByTestId('color-purple').click();
    await second.closeMenu();
    await second.cell(1, 1).click();
    await second.press('A');

    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveCSS('color', purple);
  });

  test('Pencil uses the lighter shade of the author colour', async ({ crossword }) => {
    const page = crossword.page;
    await crossword.openMenu();
    await page.getByTestId('color-purple').click();
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await crossword.press('A');
    await expect(crossword.cell(1, 1).getByTestId('solution'))
      .toHaveCSS('color', 'rgb(106, 27, 154)');   // #6a1b9a, ink

    await page.getByRole('button', { name: 'Pencil' }).click();
    await crossword.press('B');
    await expect(crossword.cell(1, 2).getByTestId('solution'))
      .toHaveCSS('color', 'rgb(179, 139, 203)');  // #b38bcb, pencil
    // Faded by colour, not by opacity, so nothing gets a compositing layer.
    await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveCSS('opacity', '1');
  });

  test('Clearing a cell drops its authorship and pencil mark', async ({ crossword }) => {
    const page = crossword.page;
    await page.getByRole('button', { name: 'Pencil' }).click();
    await crossword.cell(1, 1).click();
    await crossword.press('A');
    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveCSS('font-family', /cursive/);

    // Back onto the letter, then delete it.
    await crossword.cell(1, 1).click();
    await crossword.press('Backspace');
    await expect(crossword.cell(1, 1).getByTestId('solution')).not.toHaveCSS('font-family', /cursive/);
  });
});

test.describe('Colour selection', () => {
  test('Colours are handed out without collisions until the palette runs out', async ({ browser, crossword }) => {
    // Enough solvers to use up the palette exactly. Asserting against one other
    // client would be a weak test: picking at random would avoid a single taken
    // colour six times in seven anyway, so only filling the palette shows that
    // the choice is actually informed by who is already here.
    const chosen = new Set<string>();
    let client = crossword;

    for (let i = 0; i < PALETTE.length; i++) {
      // Each context has its own storage, so every one of them has to choose.
      if (i > 0) {
        client = await openCrossword(browser, crossword.id);
      }
      await client.openMenu();
      const selected = await client.page.locator('.swatch.selected').getAttribute('data-testid');
      chosen.add(selected!);
      await client.closeMenu();
    }

    expect(chosen.size).toBe(PALETTE.length);
  });

  test('Claiming a colour needs no cursor movement', async ({ browser, crossword }) => {
    await crossword.openMenu();
    await crossword.page.getByTestId('color-blue').click();
    await crossword.closeMenu();

    // Neither side has touched a cell, so this only passes if presence carries
    // the colour before any cursor exists.
    const second = await openCrossword(browser, crossword.id);
    await second.openMenu();
    await expect(second.page.getByTestId('color-blue')).toHaveClass(/taken/);
  });

  test('Picking a colour survives a reload', async ({ crossword }) => {
    const page = crossword.page;
    await crossword.openMenu();
    await page.getByTestId('color-purple').click();
    await expect(page.getByTestId('color-purple')).toHaveClass(/selected/);

    await page.reload();
    await expect(page.getByRole('grid')).toBeVisible();
    await crossword.openMenu();
    await expect(page.getByTestId('color-purple')).toHaveClass(/selected/);
  });

  test('Exactly one colour is selected at a time', async ({ crossword }) => {
    const page = crossword.page;
    await crossword.openMenu();
    await page.getByTestId('color-green').click();
    await expect(page.locator('.swatch.selected')).toHaveCount(1);
    await page.getByTestId('color-red').click();
    await expect(page.locator('.swatch.selected')).toHaveCount(1);
    await expect(page.getByTestId('color-red')).toHaveClass(/selected/);
  });
});

test.describe('Basic keyboard interactions', () => {
  test('Arrow keys move selection', async ({ crossword }) => {
    await crossword.cell(1, 1).click();
    await crossword.press('ArrowRight');
    await expect(crossword.cell(1, 2)).toHaveClass(/active/);
    await crossword.press('ArrowDown');
    await expect(crossword.cell(5, 2)).toHaveClass(/active/);
    await crossword.press('ArrowLeft');
    await expect(crossword.cell(5, 1)).toHaveClass(/active/);
    await crossword.press('ArrowUp');
    await expect(crossword.cell(4, 1)).toHaveClass(/active/);
  });

  test.describe('Horizontal clue typing', () => {
    test('Typing a letter moves right', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.press('A');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(1, 2)).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.press('A', 'B');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('B');
      await expect(crossword.cell(1, 3)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(1, 2)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('');
      await expect(crossword.cell(1, 1)).toHaveClass(/active/);
    });
  });

  test.describe('Vertical clue typing', () => {
    test('Typing a letter moves down', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.cell(1, 1).click();  // Second click to switch to vertical clue.
      await crossword.press('A');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(2, 1)).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.cell(1, 1).click(); // Second click to switch to vertical clue.
      await crossword.press('A', 'B');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(2, 1).getByTestId('solution')).toHaveText('B');
      await expect(crossword.cell(3, 1)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(2, 1)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(2, 1).getByTestId('solution')).toHaveText('');
      await expect(crossword.cell(1, 1)).toHaveClass(/active/);
    });
  });
});

test.describe('Toggles', () => {
  test('Skip filled cells off', async ({ crossword }) => {
    await crossword.openMenu();
    await expect(crossword.toggle('Skip filled cells')).toHaveAttribute('aria-checked', 'false');
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B');
    await crossword.cell(1, 4).click();
    await crossword.press('D');
    await crossword.cell(1, 3).click();
    await crossword.press('C');
    await expect(crossword.cell(1, 4)).toHaveClass(/active/);
  });

  test('Skip filled cells on', async ({ crossword }) => {
    await crossword.openMenu();
    await crossword.toggle('Skip filled cells').click();
    await expect(crossword.toggle('Skip filled cells')).toHaveAttribute('aria-checked', 'true');
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B');
    await crossword.cell(1, 4).click();
    await crossword.press('D');
    await crossword.cell(1, 3).click();
    await crossword.press('C');
    await expect(crossword.cell(1, 5)).toHaveClass(/active/);
  });

  test('Skip finished clues off', async ({ crossword }) => {
    await crossword.openMenu();
    await expect(crossword.toggle('Skip finished clues')).toHaveAttribute('aria-checked', 'false');
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B', 'C', 'D', 'E', 'Tab', 'Tab', 'Tab');
    await expect(crossword.cell(1, 1)).toHaveClass(/active/);
  });

  test('Skip finished clues on', async ({ crossword }) => {
    await crossword.openMenu();
    await crossword.toggle('Skip finished clues').click();
    await expect(crossword.toggle('Skip finished clues')).toHaveAttribute('aria-checked', 'true');
    await crossword.closeMenu();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B', 'C', 'D', 'E', 'Tab', 'Tab', 'Tab');
    await expect(crossword.cell(5, 1)).toHaveClass(/active/);
  });

  test('The Break button marks a boundary without a physical keyboard', async ({ crossword }) => {
    const button = crossword.page.getByRole('button', { name: 'Toggle word boundary' });

    // (1,1) is in both an across and a down clue, so the direction can be
    // flipped by clicking it twice.
    await crossword.cell(1, 1).click();
    await button.click();
    await expect(crossword.cell(1, 1)).toHaveClass(/word-boundary-across/);

    // Same button, and it follows the clue you are on rather than offering a
    // choice, so it marks the other edge once the direction flips.
    await crossword.cell(1, 1).click();
    await button.click();
    await expect(crossword.cell(1, 1)).toHaveClass(/word-boundary-down/);
    await expect(crossword.cell(1, 1)).toHaveClass(/word-boundary-across/);

    // And it is a toggle, not a one-way set.
    await button.click();
    await expect(crossword.cell(1, 1)).not.toHaveClass(/word-boundary-down/);
  });

  test('Space toggles word boundary across', async ({ crossword }) => {
    await crossword.cell(1, 2).click();
    await crossword.press(' ');
    await expect(crossword.cell(1, 2)).toHaveClass(/word-boundary-across/);
  });

  test('Space toggles word boundary down', async ({ crossword }) => {
    await crossword.cell(2, 1).click();
    await crossword.press(' ');
    await expect(crossword.cell(2, 1)).toHaveClass(/word-boundary-down/);
  });
});