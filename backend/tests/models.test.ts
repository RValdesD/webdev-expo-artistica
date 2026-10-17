import test from 'node:test';
import assert from 'node:assert/strict';
import { Expo } from '../src/models/Expo.js';
import { User } from '../src/models/User.js';
import { sampleExpo } from '../src/data/sampleExpo.js';

test('la exposición de muestra satisface el esquema', async () => {
  await new Expo(sampleExpo).validate();
});

test('el nombre de la exposición es obligatorio', async () => {
  await assert.rejects(new Expo({ ...sampleExpo, name: '' }).validate());
});

test('el hash de contraseña no aparece en JSON', () => {
  const result = new User({ username: 'ana', name: 'Ana', passwordHash: 'secret-hash' }).toJSON();
  assert.equal('passwordHash' in result, false);
  assert.equal(typeof result.id, 'string');
});
