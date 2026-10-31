import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { dataCache } from '@/lib/data/swr';

afterEach(() => {
  cleanup();
  dataCache.clear();
  vi.clearAllMocks();
});
