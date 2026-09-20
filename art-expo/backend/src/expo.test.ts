import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Expo } from './models/Expo.js';
import { sampleExpo } from './data/sampleExpo.js';

test('sample expo satisfies the Mongoose schema', async () => {
  await new Expo(sampleExpo).validate();
});
test('expo name is required', async () => {
  await assert.rejects(new Expo({ ...sampleExpo, name: '' }).validate());
});
test('FAQ answers are required', async () => {
  await assert.rejects(new Expo({ ...sampleExpo, faqs: [{ question: 'Question' }] }).validate());
});
