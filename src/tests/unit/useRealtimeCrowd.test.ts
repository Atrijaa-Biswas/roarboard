import { describe, it, expect, vi } from 'vitest';
import { useRealtimeCrowd } from '../../hooks/useRealtimeCrowd';
import { renderHook } from '@testing-library/react';

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn((_ref, callback) => {
    callback({ val: () => ({ n1: { density: 50 } }) });
    return vi.fn(); // unsubscribe mock
  })
}));

vi.mock('../../services/firebase', () => ({
  rtdb: {}
}));

const mockSetSections = vi.fn();
vi.mock('../../store/useVenueStore', () => ({
  useVenueStore: (selector: any) => selector({ setSections: mockSetSections }),
}));

describe('useRealtimeCrowd', () => {
  it('subscribes to firebase and updates store on mount', () => {
    renderHook(() => useRealtimeCrowd());
    expect(mockSetSections).toHaveBeenCalledWith({ n1: { density: 50 } });
  });
});
