import { defineConfig } from 'vitest/config';

// Motor testleri saf TS; Cloudflare eklentisi gerekmez
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
