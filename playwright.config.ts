import { defineConfig, devices } from '@playwright/test';

// Pruebas E2E: Playwright compila el frontend y levanta el backend en el puerto 3002
// con una base de datos en memoria (backend/tests/e2eServer.ts). No toca la base real.
const PORT = 3002;

export default defineConfig({
  testDir: './e2etests',
  // Las pruebas comparten la misma base de datos, así que corren de a una.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build --workspace frontend && npm run start:e2e --workspace backend',
    url: `http://127.0.0.1:${PORT}/api/artists`,
    env: { E2E_PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
