import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AuthGuard from '../../components/shared/AuthGuard';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockUseUserStore = vi.fn();
vi.mock('../../store/useUserStore', () => ({
  useUserStore: (selector: any) => selector({ user: mockUseUserStore() })
}));

describe('AuthFlow Integration', () => {
  it('renders children if user is staff', () => {
    mockUseUserStore.mockReturnValue({ role: 'staff' });
    const { getByText } = render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(getByText('Protected Content')).toBeDefined();
  });

  it('redirects to login if user is attendee', () => {
    mockUseUserStore.mockReturnValue({ role: 'attendee' });
    const { queryByText, getByText } = render(
      <MemoryRouter initialEntries={['/staff']}>
        <Routes>
          <Route path="/staff" element={<AuthGuard><div>Protected Content</div></AuthGuard>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(queryByText('Protected Content')).toBeNull();
    expect(getByText('Login Page')).toBeDefined();
  });
});
