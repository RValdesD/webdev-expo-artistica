import { expect, type APIRequestContext, type Page } from '@playwright/test';

// Usuarios de prueba: solo existen en la base de datos en memoria de las pruebas E2E.
export const visitor = { username: 'visitante', email: 'visitante@correo.cl', name: 'Ana Visitante', password: 'clave-visitante-123' };
export const organizer = { username: 'organizador', email: 'organizador@admin.expo.cl', name: 'Olga Organizadora', password: 'clave-organizador-123', role: 'organizador' };
export const artistUser = { username: 'artista', email: 'artista@artista.cl', name: 'Pablo Artista', password: 'clave-artista-123', role: 'artista' };

export const artist = {
  id: 'luz-araya', name: 'Luz Araya', discipline: 'Grabado', bio: 'Grabadora chilena que trabaja con agua y sal.', imageUrl: '',
};

export const exhibition = {
  id: 'grandes-mares', title: 'Los Grandes Mares', heading: 'Un viaje inagualable', description: 'Peces y mareas.',
  theme: 'sea', order: 0, room: 'Sala Azul', visitHours: 'Martes a domingo, 10:00 a 19:00',
  visitNotes: 'El recorrido toma unos 40 minutos.',
};

// Visita guiada a `exhibition`, en el futuro y con 2 cupos.
export const guidedTour = {
  id: 'visita-mares', exhibitionId: exhibition.id, date: '2099-06-12T15:00:00.000Z', durationMinutes: 45,
  capacity: 2, guide: 'Camila Soto', language: 'Español', meetingPoint: 'Hall de acceso',
};

// Deja la base de datos solo con los usuarios (y artistas, exposiciones y visitas) que necesita la prueba.
export async function resetDatabase(request: APIRequestContext, artists: object[] = [], extra: { exhibitions?: object[]; guidedTours?: object[] } = {}) {
  const response = await request.post('/api/testing/reset', { data: { users: [visitor, organizer, artistUser], artists, ...extra } });
  expect(response.ok()).toBeTruthy();
}

// Inicia sesión desde el formulario y espera a que el menú muestre "Cerrar sesión".
export async function loginWith(page: Page, username: string, password: string) {
  await page.getByLabel('Usuario o correo').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}
