import { test, expect, type Page } from '@playwright/test';
import { artistUser, loginWith, organizer, resetDatabase } from './helper';

// Caso 2: CRUD de artistas desde el panel de gestión (como organizador).
// Solo la lista de fichas de artista (no la de cuentas de artista sin perfil).
const registeredArtists = (page: Page) =>
  page.locator('.management-list', { has: page.getByRole('heading', { name: /^Artistas registrados/ }) }).locator(':scope > .management-item');

async function openArtistsTab(page: Page) {
  await page.getByRole('link', { name: 'Gestión', exact: true }).click();
  await page.getByRole('tab', { name: 'Artistas y Redes' }).click();
}

test.describe('CRUD de artistas', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request);
    await page.goto('/gestion');
    await loginWith(page, organizer.username, organizer.password);
    await expect(page.getByRole('heading', { name: 'Panel de gestión' })).toBeVisible();
    await page.getByRole('tab', { name: 'Artistas y Redes' }).click();
  });

  test('crear, ver, editar y eliminar un artista', async ({ page }) => {
    // Crear
    await page.getByLabel('Identificador único (slug)').fill('marta-rojas');
    await page.getByLabel('Nombre del artista').fill('Marta Rojas');
    await page.getByLabel('Disciplina principal').fill('Escultura');
    await page.getByLabel('Biografía').fill('Escultora que trabaja con madera recuperada.');
    await page.getByRole('button', { name: 'Crear artista' }).click();

    await expect(page.getByText('Artista "Marta Rojas" creado con éxito.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marta Rojas', level: 3 })).toBeVisible();

    // Ver: aparece en la página pública de artistas (navegando dentro de la app, usa el store).
    await page.getByRole('link', { name: 'Artistas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Marta Rojas' })).toBeVisible();

    // Editar
    await openArtistsTab(page);
    await page.locator('.management-item', { hasText: 'Marta Rojas' }).getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Nombre del artista').fill('Marta Rojas Soto');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Artista "Marta Rojas Soto" actualizado correctamente.')).toBeVisible();
    await page.getByRole('link', { name: 'Artistas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Marta Rojas Soto' })).toBeVisible();

    // Eliminar (acepta el confirm del navegador)
    await openArtistsTab(page);
    page.once('dialog', dialog => void dialog.accept());
    await page.locator('.management-item', { hasText: 'Marta Rojas Soto' }).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByText('Artista eliminado.')).toBeVisible();
    await expect(registeredArtists(page)).toHaveCount(0);
    await page.getByRole('link', { name: 'Artistas', exact: true }).click();
    await expect(page.getByText('Aún no hay artistas publicados.')).toBeVisible();
  });

  test('el enlace de Pixiv se guarda y aparece en el perfil público', async ({ page }) => {
    await page.getByLabel('Identificador único (slug)').fill('aki-mori');
    await page.getByLabel('Nombre del artista').fill('Aki Mori');
    await page.getByLabel('Disciplina principal').fill('Ilustración');
    await page.getByLabel('Biografía').fill('Ilustradora digital.');
    await page.getByLabel('Pixiv URL').fill('https://www.pixiv.net/users/123');
    await page.getByRole('button', { name: 'Crear artista' }).click();
    await expect(page.getByText('Artista "Aki Mori" creado con éxito.')).toBeVisible();

    await page.goto('/artists/aki-mori');
    const pixiv = page.getByRole('link', { name: 'Pixiv de Aki Mori (abre en otra pestaña)' });
    await expect(pixiv).toHaveAttribute('href', 'https://www.pixiv.net/users/123');
    // Las redes sin enlace se muestran, pero no son clickeables.
    await expect(page.locator('.artist-social-link--empty', { hasText: 'Behance' })).toBeVisible();
  });

  test('una cuenta de artista sin perfil se lista aparte hasta que guarda su perfil', async ({ page, browser }) => {
    const pending = page.getByRole('region', { name: /Cuentas de artista sin perfil/ });
    await expect(pending.getByRole('heading', { name: artistUser.name })).toBeVisible();
    await expect(registeredArtists(page)).toHaveCount(0);

    const artistPage = await (await browser.newContext()).newPage();
    await artistPage.goto('/mi-perfil');
    await loginWith(artistPage, artistUser.username, artistUser.password);
    await artistPage.getByLabel('Disciplina').fill('Pintura');
    await artistPage.getByLabel('Descripción personal').fill('Pinto el mar.');
    await artistPage.getByRole('button', { name: 'Guardar perfil' }).click();
    await expect(artistPage.getByText('Perfil guardado.')).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Artistas y Redes' }).click();
    await expect(registeredArtists(page).getByRole('heading', { name: artistUser.name })).toBeVisible();
    await expect(page.getByRole('region', { name: /Cuentas de artista sin perfil/ })).toHaveCount(0);
  });

  test('un artista sin datos obligatorios no se crea', async ({ page }) => {
    await page.getByLabel('Identificador único (slug)').fill('sin-nombre');
    await page.getByRole('button', { name: 'Crear artista' }).click();

    // El navegador bloquea el envío por los campos "required"; la lista sigue vacía.
    await expect(page.getByText('Artistas registrados (0)')).toBeVisible();
    await expect(registeredArtists(page)).toHaveCount(0);
  });
});
