/// <reference types="vitest" />
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '../useSubscription';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        single: vi.fn().mockResolvedValue({ data: { max_invoices: 50 } }),
      }),
    }),
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

vi.mock('../../contexts/AuthContext');

describe('useSubscription', () => {
  it('should allow a Free Tier user with no usage data to create an invoice', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.canCreateInvoice()).toBe(true);
    });
  });
});
