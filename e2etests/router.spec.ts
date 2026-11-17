import { test, expect } from '@playwright/test';
import { artist, resetDatabase } from './helper';

// Ruteo: atrás / adelante del navegador y recarga (F5) en rutas con parámetros.
test.describe('Navegación', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request, [artist]);
  });

  test('atrás, adelante y recargar en el perfil de un artista', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Artistas', exact: true }).click();
    await expect(page).toHaveURL(/\/artists$/);

    await page.getByRole('link', { name: `Ver perfil de ${artist.name}` }).click();
    await expect(page).toHaveURL(`/artists/${artist.id}`);
    await expect(page.getByRole('heading', { name: artist.name, level: 1 })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/artists$/);
    await expect(page.getByRole('heading', { name: 'Conoce a nuestros queridos artistas!' })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(`/artists/${artist.id}`);
    await expect(page.getByRole('heading', { name: artist.name, level: 1 })).toBeVisible();

    // F5 en una ruta con parámetro: el servidor devuelve la app y React Router muestra el perfil.
    await page.reload();
    await expect(page.getByRole('heading', { name: artist.name, level: 1 })).toBeVisible();
  });

  test('al volver a Artistas la lista sale del store, sin pedirla otra vez al servidor', async ({ page }) => {
    let requests = 0;
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/artists') requests += 1; });

    await page.goto('/artists');
    await expect(page.getByRole('heading', { name: artist.name })).toBeVisible();
    await page.getByRole('link', { name: 'Catálogo' }).click();
    await page.getByRole('link', { name: 'Artistas', exact: true }).click();
    await expect(page.getByRole('heading', { name: artist.name })).toBeVisible();

    expect(requests).toBe(1);
  });

  test('una ruta que no existe muestra "Página no encontrada"', async ({ page }) => {
    await page.goto('/no-existe');
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  });

  test('una obra que no existe muestra su propio aviso', async ({ page }) => {
    await page.goto('/catalog/obra-inexistente');
    await expect(page.getByRole('heading', { name: 'Obra no encontrada' })).toBeVisible();
  });
});
