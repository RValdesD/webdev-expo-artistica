import { test, expect } from '@playwright/test';
import { loginWith, resetDatabase, visitor } from './helper';

// Caso 1: login + acceso a una ruta protegida.
test.describe('Login y rutas protegidas', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('sin sesión, /mi-visita redirige al login', async ({ page }) => {
    await page.goto('/mi-visita');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('después del login vuelve a /mi-visita y la sesión sigue al recargar', async ({ page }) => {
    await page.goto('/mi-visita');
    await loginWith(page, visitor.username, visitor.password);

    await expect(page).toHaveURL(/\/mi-visita$/);
    await expect(page.getByRole('heading', { name: `Tu recorrido, ${visitor.name}.` })).toBeVisible();

    // F5: la sesión se restaura desde la cookie (store de autenticación).
    await page.reload();
    await expect(page.getByRole('heading', { name: `Tu recorrido, ${visitor.name}.` })).toBeVisible();

    // Al cerrar sesión, la ruta protegida vuelve a pedir login.
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
    await page.goto('/mi-visita');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('con una contraseña incorrecta no entra', async ({ page }) => {
    await page.goto('/login');
    await loginWith(page, visitor.username, 'clave-equivocada');

    await expect(page.getByText('Usuario, correo o contraseña incorrectos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0);
  });

  test('un visitante no puede entrar a gestión', async ({ page }) => {
    await page.goto('/gestion');
    await loginWith(page, visitor.username, visitor.password);

    await expect(page).toHaveURL(/\/gestion$/);
    await expect(page.getByRole('heading', { name: 'Acceso restringido' })).toBeVisible();
  });
});
