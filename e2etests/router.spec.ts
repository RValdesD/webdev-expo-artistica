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

  test('hacer clic en la foto de un artista abre su perfil', async ({ page }) => {
    await page.goto('/artists');
    // La foto es un atajo solo para el mouse (oculto a lectores de pantalla), así que se busca por clase.
    await page.locator('.artist-card', { hasText: artist.name }).locator('.artist-card__media').click();
    await expect(page).toHaveURL(`/artists/${artist.id}`);
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

// El servidor de producción devuelve index.html para las rutas de la app (SPA fallback),
// pero no para archivos que no existen: esos deben dar 404.
test.describe('Servidor de producción', () => {
  test('abrir directamente una ruta anidada carga la app', async ({ page }) => {
    await resetDatabase(page.request, [artist]);
    await page.goto(`/artists/${artist.id}`);
    await expect(page.getByRole('heading', { name: artist.name, level: 1 })).toBeVisible();
  });

  test('index.html no queda en caché y los assets con hash sí', async ({ page, request }) => {
    const html = await request.get('/catalog/abc123');
    expect(html.status()).toBe(200);
    expect(html.headers()['content-type']).toContain('text/html');
    expect(html.headers()['cache-control']).toBe('no-cache');

    const scripts: string[] = [];
    page.on('response', response => { if (new URL(response.url()).pathname.startsWith('/assets/')) scripts.push(response.url()); });
    await page.goto('/');
    await expect.poll(() => scripts.length).toBeGreaterThan(0);
    const asset = await request.get(scripts[0]);
    expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  for (const path of ['/assets/index-viejo.js', '/images/uploads/no-existe.png', '/favicon-inexistente.ico']) {
    test(`un archivo inexistente (${path}) responde 404 y no la app`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).not.toContain('text/html');
    });
  }
});
