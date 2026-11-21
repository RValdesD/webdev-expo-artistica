import { test, expect } from '@playwright/test';
import { chooseAccountMenu, exhibition, guidedTour, loginWith, organizer, resetDatabase, visitor } from './helper';

// Planifica tu visita: información por exposición y reserva de visitas guiadas.
test.describe('Visitas', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request, [], { exhibitions: [exhibition], guidedTours: [guidedTour] });
  });

  test('desde el inicio se llega a la visita de esa exposición', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Planifica tu visita' }).last().click();

    await expect(page).toHaveURL(`/visitas/${exhibition.id}`);
    await expect(page.getByRole('heading', { name: exhibition.title, level: 1 })).toBeVisible();
    await expect(page.getByText(exhibition.room)).toBeVisible();
    await expect(page.getByText(exhibition.visitHours)).toBeVisible();
    await expect(page.getByText(exhibition.visitNotes)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Visitas guiadas' })).toBeVisible();
    await expect(page.getByText('2 de 2 cupos disponibles')).toBeVisible();
  });

  test('el índice muestra cada exposición con sus visitas guiadas', async ({ page }) => {
    await page.goto('/visitas');
    const card = page.locator('.visit-expo', { hasText: exhibition.title });
    await expect(card.getByText('1 visita guiada · próxima el', { exact: false })).toBeVisible();
    await card.getByRole('link', { name: exhibition.title }).click();
    await expect(page).toHaveURL(`/visitas/${exhibition.id}`);
  });

  test('reservar una visita guiada, verla en Mi visita y cancelarla', async ({ page }) => {
    await page.goto(`/visitas/${exhibition.id}`);
    await page.getByRole('link', { name: 'Inicia sesión para reservar' }).click();
    await loginWith(page, visitor.username, visitor.password);

    // Después del login vuelve a la misma visita.
    await expect(page).toHaveURL(`/visitas/${exhibition.id}`);
    await page.getByRole('button', { name: 'Reservar cupo' }).click();
    await expect(page.getByText(`Reservar un cupo a nombre de ${visitor.name}.`)).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.getByText('Reserva confirmada. La encontrarás en Mi visita.')).toBeVisible();
    await expect(page.getByText('Reservada', { exact: true })).toBeVisible();
    await expect(page.getByText('1 de 2 cupos disponibles')).toBeVisible();

    // La reserva se mantiene al recargar.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toBeVisible();

    await chooseAccountMenu(page, 'Mi visita');
    await expect(page.getByRole('heading', { name: 'Visitas guiadas' })).toBeVisible();
    const booking = page.locator('.visit-registration', { hasText: `Visita guiada: ${exhibition.title}` });
    await expect(booking).toBeVisible();
    await booking.getByRole('button', { name: 'Cancelar reserva' }).click();
    await expect(page.getByRole('heading', { name: 'Aún no tienes reservas.' })).toBeVisible();

    await page.goto(`/visitas/${exhibition.id}`);
    await expect(page.getByText('2 de 2 cupos disponibles')).toBeVisible();
  });

  test('el organizador programa una visita guiada desde Gestión', async ({ page }) => {
    await page.goto('/gestion');
    await loginWith(page, organizer.username, organizer.password);
    await page.getByRole('tab', { name: 'Visitas guiadas' }).click();

    await page.getByLabel('Exposición').selectOption(exhibition.id);
    await page.getByLabel('Fecha y hora').fill('2099-07-01T11:30');
    await page.getByLabel('Guía (opcional)').fill('Rayén Huenchumilla');
    await page.getByLabel('Idioma').fill('Inglés');
    await page.getByLabel('Punto de encuentro').fill('Entrada norte');
    await page.getByLabel('Cupos').fill('8');
    await page.getByRole('button', { name: 'Crear visita guiada' }).click();
    await expect(page.getByText('Visita guiada creada.')).toBeVisible();
    await expect(page.locator('.management-item', { hasText: 'Rayén Huenchumilla' })).toBeVisible();

    await page.goto(`/visitas/${exhibition.id}`);
    const card = page.locator('.tour-card', { hasText: 'Rayén Huenchumilla' });
    await expect(card.getByText('Inglés')).toBeVisible();
    await expect(card.getByText('Entrada norte')).toBeVisible();
    await expect(card.getByText('8 de 8 cupos disponibles')).toBeVisible();
  });
});
