import { test, expect } from '@playwright/test';
import { exhibition, loginWith, organizer, resetDatabase } from './helper';

// Portadas: el organizador elige una imagen de frontend/public/images/ y se ve en el inicio y en Visitas.
test.describe('Portadas de exposiciones', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request, [], { exhibitions: [exhibition] });
    await page.goto('/gestion/exposiciones');
    await loginWith(page, organizer.username, organizer.password);
    await expect(page.getByRole('heading', { name: 'Gestionar exposiciones' })).toBeVisible();
  });

  test('elegir una portada de public/images y verla en el inicio', async ({ page }) => {
    await page.locator('.expo-editor__list li', { hasText: exhibition.title }).getByRole('button', { name: 'Editar' }).click();

    const covers = page.getByRole('group', { name: 'Portada' });
    await expect(covers.getByRole('radio', { name: 'Sin portada' })).toBeChecked();
    // Sin portada no se pide la descripción de la imagen.
    await expect(page.getByLabel('Descripción de la portada (para lectores de pantalla)')).toHaveCount(0);

    await covers.getByRole('radio', { name: 'FISH.png' }).check();
    await page.getByLabel('Descripción de la portada (para lectores de pantalla)').fill('Peces dibujados a mano');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Exposición guardada en la página de inicio.')).toBeVisible();

    await page.goto('/');
    const cover = page.getByRole('img', { name: 'Peces dibujados a mano' });
    await expect(cover).toHaveAttribute('src', '/images/FISH.png');
    // La imagen carga de verdad (no es un enlace roto).
    await expect.poll(() => cover.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    await page.goto('/visitas');
    await expect(page.locator('.visit-expo', { hasText: exhibition.title }).getByRole('img', { name: 'Peces dibujados a mano' })).toBeVisible();
  });

  test('cambiar el tema de una exposición cambia sus colores en el inicio y en Visitas', async ({ page }) => {
    await page.locator('.expo-editor__list li', { hasText: exhibition.title }).getByRole('button', { name: 'Editar' }).click();
    const theme = page.getByLabel('Tema');
    await expect(theme.locator('option')).toHaveCount(8);
    await theme.selectOption({ label: 'Violeta' });
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Exposición guardada en la página de inicio.')).toBeVisible();

    await page.goto('/');
    const block = page.locator('.expo-item', { hasText: exhibition.heading });
    await expect(block).toHaveClass(/theme--violet/);
    // El acento del tema llega al botón de la exposición.
    await expect(block.getByRole('link', { name: 'Planifica tu visita' })).toHaveCSS('background-color', 'rgb(167, 139, 250)');

    await page.goto('/visitas');
    await expect(page.locator('.visit-expo', { hasText: exhibition.title })).toHaveClass(/theme--violet/);
  });
});
