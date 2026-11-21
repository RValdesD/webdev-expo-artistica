import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { artistUser, chooseAccountMenu, loginWith, organizer, resetDatabase } from './helper';

// Una imagen PNG de un color, para subirla como si fuera una foto de la obra.
async function photo(name: string, color: string) {
  const buffer = await sharp({ create: { width: 320, height: 240, channels: 3, background: color } }).png().toBuffer();
  return { name, mimeType: 'image/png', buffer };
}

// Varias imágenes por obra: el artista sube la principal y otras distintas, el organizador
// aprueba el envío y la galería de la obra muestra todas.
test('un artista envía una obra con varias imágenes y se publican en su galería', async ({ browser, request }) => {
  await resetDatabase(request);

  const artistPage = await (await browser.newContext()).newPage();
  await artistPage.goto('/mi-perfil');
  await loginWith(artistPage, artistUser.username, artistUser.password);
  await expect(artistPage.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible();

  await artistPage.getByLabel('Nombre público').fill(artistUser.name);
  await artistPage.getByLabel('Disciplina').fill('Pintura');
  await artistPage.getByLabel('Descripción personal').fill('Pinto el mar de Valparaíso.');
  await artistPage.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(artistPage.getByText('Perfil guardado.')).toBeVisible();

  // El envío de obras está en "Publicar", dentro del menú del avatar.
  await chooseAccountMenu(artistPage, 'Publicar');
  await expect(artistPage).toHaveURL('/publicar');
  await expect(artistPage.getByRole('heading', { name: 'Publicar una obra', level: 1 })).toBeVisible();

  await artistPage.getByLabel('Imagen principal de la obra').setInputFiles(await photo('principal.png', '#1d4e89'));
  await expect(artistPage.getByRole('img', { name: 'Imagen principal de la obra' })).toBeVisible();
  await artistPage.getByLabel('Imágenes adicionales').setInputFiles([await photo('detalle.png', '#c5a059'), await photo('montaje.png', '#52b788')]);
  await expect(artistPage.getByRole('img', { name: /^Imagen adicional \d$/ })).toHaveCount(2);
  await expect(artistPage.getByText('Imágenes adicionales (2 de 10)')).toBeVisible();

  // Quitar una y volver a agregarla.
  await artistPage.getByRole('button', { name: 'Quitar imagen adicional 2' }).click();
  await expect(artistPage.getByRole('img', { name: /^Imagen adicional \d$/ })).toHaveCount(1);
  await artistPage.getByLabel('Imágenes adicionales').setInputFiles(await photo('montaje.png', '#e05d5d'));
  await expect(artistPage.getByRole('img', { name: /^Imagen adicional \d$/ })).toHaveCount(2);

  await artistPage.getByLabel('Título').fill('Marea alta');
  await artistPage.getByLabel('Técnica').fill('Óleo');
  await artistPage.getByRole('button', { name: 'Enviar a revisión' }).click();
  await expect(artistPage.getByText('Obra enviada.', { exact: false })).toBeVisible();
  await expect(artistPage.getByText('3 imágenes en la galería')).toBeVisible();

  const organizerPage = await (await browser.newContext()).newPage();
  await organizerPage.goto('/gestion/envios');
  await loginWith(organizerPage, organizer.username, organizer.password);
  const submission = organizerPage.locator('.submission-card', { hasText: 'Marea alta' });
  await expect(submission.getByText('2 imágenes adicionales:')).toBeVisible();
  await submission.getByRole('button', { name: 'Aprobar y publicar' }).click();
  await expect(submission.getByText('Publicada')).toBeVisible();

  await organizerPage.goto('/catalog');
  await organizerPage.getByRole('link', { name: 'Marea alta' }).first().click();
  const gallery = organizerPage.getByRole('region', { name: 'Imágenes de Marea alta' });
  await expect(gallery.getByText('Imagen 1 de 3')).toBeVisible();
  await gallery.getByRole('button', { name: 'Imagen siguiente' }).click();
  await expect(gallery.getByText('Imagen 2 de 3')).toBeVisible();
  // Son tres archivos distintos, no la misma imagen repetida.
  const sources = await gallery.locator('.gallery__thumb img').evaluateAll(images => images.map(img => (img as HTMLImageElement).getAttribute('src')));
  expect(new Set(sources).size).toBe(3);

  // Al hacer clic en la imagen se abre en grande y las flechas del teclado siguen funcionando.
  await gallery.getByRole('button', { name: /^Ampliar / }).click();
  const lightbox = organizerPage.getByRole('dialog', { name: 'Marea alta ampliada' });
  await expect(lightbox.getByText('Imagen 2 de 3')).toBeVisible();
  await organizerPage.keyboard.press('ArrowRight');
  await expect(lightbox.getByText('Imagen 3 de 3')).toBeVisible();
  await organizerPage.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
  await expect(gallery.getByText('Imagen 3 de 3')).toBeVisible();
});

test('sin perfil guardado, Publicar pide completar Mi perfil primero', async ({ page, request }) => {
  await resetDatabase(request);
  await page.goto('/publicar');
  await loginWith(page, artistUser.username, artistUser.password);
  await expect(page.getByText('Antes de publicar, completa y guarda tu perfil de artista.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar a revisión' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Ir a Mi perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible();
});
