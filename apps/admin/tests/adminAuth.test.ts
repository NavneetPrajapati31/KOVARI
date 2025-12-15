import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/admin-lib/adminAuth';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createRouteHandlerSupabaseClient: vi.fn(),
}));

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-authenticated user (no userId)', async () => {
    // Mock auth to return no userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    await expect(requireAdmin()).rejects.toBeInstanceOf(NextResponse);

    try {
      await requireAdmin();
    } catch (error) {
      expect(error).toBeInstanceOf(NextResponse);
      const response = error as NextResponse;
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('throws error for non-admin user (not in admins table)', async () => {
    const mockUserId = 'user_123';
    const mockEmail = 'user@example.com';

    // Mock auth to return userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);

    // Mock Clerk client
    const mockClerkClient = {
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: mockEmail }],
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

    // Mock Supabase to return no admin data
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    vi.mocked(createRouteHandlerSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
    );

    try {
      await requireAdmin();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(NextResponse);
      const response = error as NextResponse;
      const body = await response.json();
      expect(body.error).toBe('Forbidden: Admin access required');
    }
  });

  it('throws error when Supabase query fails', async () => {
    const mockUserId = 'user_123';
    const mockEmail = 'admin@example.com';

    // Mock auth to return userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);

    // Mock Clerk client
    const mockClerkClient = {
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: mockEmail }],
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

    // Mock Supabase to return an error
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };
    vi.mocked(createRouteHandlerSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
    );

    await expect(requireAdmin()).rejects.toBeInstanceOf(NextResponse);

    try {
      await requireAdmin();
    } catch (error) {
      expect(error).toBeInstanceOf(NextResponse);
      const response = error as NextResponse;
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('returns admin data for valid admin user', async () => {
    const mockUserId = 'user_123';
    const mockEmail = 'admin@example.com';
    const mockAdminId = 'admin_456';

    // Mock auth to return userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);

    // Mock Clerk client
    const mockClerkClient = {
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: mockEmail }],
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

    // Mock Supabase to return admin data
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: mockAdminId,
          email: mockEmail,
        },
        error: null,
      }),
    };
    vi.mocked(createRouteHandlerSupabaseClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any,
    );

    const result = await requireAdmin();

    expect(result).toEqual({
      adminId: mockAdminId,
      email: mockEmail,
    });
  });
});
