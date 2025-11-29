/**
 * Test Setup File
 * 
 * Global test configuration and mocks
 * 
 * Note: This file will be used once vitest is installed:
 * npm install -D vitest @testing-library/jest-dom
 */

// Uncomment when vitest is installed:
// import '@testing-library/jest-dom';
// import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

// Only set up mocks in test environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });
}

// Export for type checking
export { localStorageMock };
