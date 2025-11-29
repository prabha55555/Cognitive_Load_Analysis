/**
 * Vitest Configuration
 * 
 * Test framework setup for unit and component testing
 * 
 * Note: Install vitest to use this config:
 * npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
 * 
 * Related Flaw: Module 6 - No Unit Tests (LOW)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Uncomment when vitest is installed:
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  //   setupFiles: ['./src/__tests__/setup.ts'],
  //   include: ['src/**/*.{test,spec}.{ts,tsx}'],
  //   coverage: {
  //     provider: 'v8',
  //     reporter: ['text', 'json', 'html'],
  //     exclude: [
  //       'node_modules/',
  //       'src/__tests__/',
  //       '**/*.d.ts',
  //     ],
  //   },
  // },
});
