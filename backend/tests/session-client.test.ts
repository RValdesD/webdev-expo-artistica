import test from 'node:test';
import assert from 'node:assert/strict';
import axiosSecure, { CSRF_STORAGE_KEY } from '../../frontend/src/utils/axiosSecure';
import { logout } from '../../frontend/src/services/login';

for (const status of [undefined, 500, 401, 204]) {
  test(`logout preserves retry credentials on failure (${status ?? 'network'})`, async () => {
    const values = new Map([[CSRF_STORAGE_KEY, 'csrf']]);
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    } });
    const post = axiosSecure.post;
    axiosSecure.post = (async () => {
      if (status !== 204) throw { isAxiosError: true, response: status ? { status } : undefined };
      return { status: 204 };
    }) as typeof post;
    try {
      if (status === 401 || status === 204) {
        await logout();
        assert.equal(values.has(CSRF_STORAGE_KEY), false);
      } else {
        await assert.rejects(logout());
        assert.equal(values.get(CSRF_STORAGE_KEY), 'csrf');
      }
    } finally {
      axiosSecure.post = post;
      if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
}
