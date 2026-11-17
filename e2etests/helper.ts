import { expect, type APIRequestContext, type Page } from '@playwright/test';

// Usuarios de prueba: solo existen en la base de datos en memoria de las pruebas E2E.
export const visitor = { username: 'visitante', email: 'visitante@correo.cl', name: 'Ana Visitante', password: 'clave-visitante-123' };
export const organizer = { username: 'organizador', email: 'organizador@admin.expo.cl', name: 'Olga Organizadora', password: 'clave-organizador-123', role: 'organizador' };

export const artist = {
  id: 'luz-araya', name: 'Luz Araya', discipline: 'Grabado', bio: 'Grabadora chilena que trabaja con agua y sal.', imageUrl: '',
};

// Deja la base de datos solo con los usuarios (y artistas) que necesita la prueba.
export async function resetDatabase(request: APIRequestContext, artists: object[] = []) {
  const response = await request.post('/api/testing/reset', { data: { users: [visitor, organizer], artists } });
  expect(response.ok()).toBeTruthy();
}

// Inicia sesión desde el formulario y espera a que el menú muestre "Cerrar sesión".
export async function loginWith(page: Page, username: string, password: string) {
  await page.getByLabel('Usuario o correo').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}
