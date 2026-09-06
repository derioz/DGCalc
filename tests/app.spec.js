const { test, expect } = require('@playwright/test');
const path = require('path');

const filePath = `file://${path.resolve(__dirname, '..', 'index.html')}`;

test.describe('Damon\'s Glizzy\'s Calculator Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(filePath);
    });

    test('Initial state: zero items and stats', async ({ page }) => {
        await expect(page.locator('#stat-items')).toHaveText('0');
        await expect(page.locator('#stat-unique')).toHaveText('0');
        await expect(page.locator('#stat-total')).toHaveText('$0');
        await expect(page.locator('#total-amount')).toHaveText('$0');
        await expect(page.locator('#order-footer')).not.toHaveClass(/visible/);
    });

    test('Clicking + / - buttons updates quantity and totals', async ({ page }) => {
        const frozenFrankCard = page.locator('#card-frozen-frank');
        const plusBtn = frozenFrankCard.locator('.plus');
        const minusBtn = frozenFrankCard.locator('.minus');
        const qtyInput = frozenFrankCard.locator('.qty-display');

        // Click + button twice
        await plusBtn.click();
        await plusBtn.click();

        await expect(qtyInput).toHaveValue('2');
        await expect(page.locator('#stat-items')).toHaveText('2');
        await expect(page.locator('#stat-unique')).toHaveText('1');
        await expect(page.locator('#stat-total')).toHaveText('$1,500'); // 750 * 2 = 1500
        await expect(page.locator('#order-footer')).toHaveClass(/visible/);

        // Click - button once
        await minusBtn.click();
        await expect(qtyInput).toHaveValue('1');
        await expect(page.locator('#stat-total')).toHaveText('$750');
    });

    test('Direct typing in quantity input updates order properly', async ({ page }) => {
        const frozenFrankCard = page.locator('#card-frozen-frank');
        const qtyInput = frozenFrankCard.locator('.qty-display');

        // Type 12 directly
        await qtyInput.focus();
        await qtyInput.fill('12');

        await expect(page.locator('#stat-items')).toHaveText('12');
        await expect(page.locator('#stat-total')).toHaveText('$9,000'); // 750 * 12 = 9000

        // Float indicator should show +12
        const floatIndicator = frozenFrankCard.locator('.float-indicator');
        await expect(floatIndicator).toHaveText('+12');

        // Clear input field and blur -> should reset to 0
        await qtyInput.focus();
        await qtyInput.fill('');
        await qtyInput.blur();

        await expect(qtyInput).toHaveValue('0');
        await expect(page.locator('#stat-items')).toHaveText('0');
        await expect(page.locator('#stat-total')).toHaveText('$0');
    });

    test('Tapping card body (quick-add) increments count without triggering controls conflict', async ({ page }) => {
        const frozenFrankCard = page.locator('#card-frozen-frank');

        // Click on the top section of card
        await frozenFrankCard.locator('.card-top').click();
        await expect(frozenFrankCard.locator('.qty-display')).toHaveValue('1');

        // Click on minus button -> should decrement, NOT increment from card body click
        await frozenFrankCard.locator('.minus').click();
        await expect(frozenFrankCard.locator('.qty-display')).toHaveValue('0');
    });

    test('Clear All resets all state', async ({ page }) => {
        await page.locator('#card-frozen-frank .plus').click();
        await page.locator('#card-dessert-disaster .plus').click();

        await expect(page.locator('#stat-items')).toHaveText('2');

        await page.locator('#clear-all-btn').click();

        await expect(page.locator('#stat-items')).toHaveText('0');
        await expect(page.locator('#stat-total')).toHaveText('$0');
        await expect(page.locator('#order-footer')).not.toHaveClass(/visible/);
    });

    test('Receipt modal opens with correct itemized receipt', async ({ page }) => {
        await page.locator('#card-frozen-frank .plus').click(); // $750
        await page.locator('#card-dessert-disaster .plus').click(); // $600

        await page.locator('#receipt-btn').click();

        const modal = page.locator('#receipt-modal');
        await expect(modal).toHaveClass(/open/);
        await expect(page.locator('#modal-total-amount')).toHaveText('$1,350');

        const receiptItems = modal.locator('.receipt-item');
        await expect(receiptItems).toHaveCount(2);

        await page.locator('#modal-close').click();
        await expect(modal).not.toHaveClass(/open/);
    });

    test('Credit pill is hidden when footer is visible', async ({ page }) => {
        const creditPill = page.locator('#credit-pill');
        await expect(creditPill).toBeVisible();

        // Add item to show order footer
        await page.locator('#card-frozen-frank .plus').click();

        await expect(creditPill).not.toBeVisible();
    });
});
