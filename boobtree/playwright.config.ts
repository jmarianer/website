import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  timeout: 120000,
  use: {
    headless: true,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'boobtree',
      testIgnore: '**/passthepic.spec.ts',
      use: { baseURL: 'http://127.0.0.1:4173' },
    },
    {
      name: 'passthepic',
      testMatch: '**/passthepic.spec.ts',
      use: { baseURL: 'http://127.0.0.1:4174' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev-boobtree -- --host 127.0.0.1 --port 4173',
      port: 4173,
      reuseExistingServer: false,
      env: {
        VITE_FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
        VITE_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=boobtree-test',
      },
    },
    {
      command: 'npm run dev-passthepic -- --host 127.0.0.1 --port 4174',
      port: 4174,
      reuseExistingServer: false,
      env: {
        VITE_FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
        VITE_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=passthepic-test',
      },
    },
  ],
});
