import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['prisma/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
