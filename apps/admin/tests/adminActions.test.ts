import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAdminAction } from '@/admin-lib/logAdminAction';

// Mock Supabase admin client
vi.mock('@/admin-lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs admin action correctly', async () => {
    const mockAdminId = 'admin1';
    const mockTargetType = 'user';
    const mockTargetId = 'user123';
    const mockAction = 'BAN';
    const mockReason = 'Violation of terms';
    const mockMetadata = { severity: 'high' };

    // Mock Supabase insert to succeed
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertResult = {
      error: null,
    };
    mockInsert.mockResolvedValue(mockInsertResult);

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await logAdminAction({
      adminId: mockAdminId,
      targetType: mockTargetType,
      targetId: mockTargetId,
      action: mockAction,
      reason: mockReason,
      metadata: mockMetadata,
    });

    // Verify Supabase was called correctly
    expect(supabaseAdmin.from).toHaveBeenCalledWith('admin_actions');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        admin_id: mockAdminId,
        target_type: mockTargetType,
        target_id: mockTargetId,
        action: mockAction,
        reason: mockReason,
        metadata: mockMetadata,
      },
    ]);
  });

  it('handles null targetId correctly', async () => {
    const mockAdminId = 'admin1';
    const mockTargetType = 'session';
    const mockAction = 'EXPIRE_SESSION';

    // Mock Supabase insert to succeed
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertResult = {
      error: null,
    };
    mockInsert.mockResolvedValue(mockInsertResult);

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await logAdminAction({
      adminId: mockAdminId,
      targetType: mockTargetType,
      targetId: null,
      action: mockAction,
    });

    // Verify Supabase was called with null target_id
    expect(mockInsert).toHaveBeenCalledWith([
      {
        admin_id: mockAdminId,
        target_type: mockTargetType,
        target_id: null,
        action: mockAction,
        reason: null,
        metadata: {},
      },
    ]);
  });

  it('handles missing optional parameters', async () => {
    const mockAdminId = 'admin1';
    const mockTargetType = 'user';
    const mockTargetId = 'user123';
    const mockAction = 'SUSPEND';

    // Mock Supabase insert to succeed
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertResult = {
      error: null,
    };
    mockInsert.mockResolvedValue(mockInsertResult);

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await logAdminAction({
      adminId: mockAdminId,
      targetType: mockTargetType,
      targetId: mockTargetId,
      action: mockAction,
    });

    // Verify Supabase was called with default values for optional params
    expect(mockInsert).toHaveBeenCalledWith([
      {
        admin_id: mockAdminId,
        target_type: mockTargetType,
        target_id: mockTargetId,
        action: mockAction,
        reason: null,
        metadata: {},
      },
    ]);
  });

  it('handles Supabase errors gracefully', async () => {
    const mockAdminId = 'admin1';
    const mockTargetType = 'user';
    const mockTargetId = 'user123';
    const mockAction = 'BAN';

    // Mock Supabase insert to fail
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertResult = {
      error: { message: 'Database connection failed' },
    };
    mockInsert.mockResolvedValue(mockInsertResult);

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Should not throw, but log error internally
    await logAdminAction({
      adminId: mockAdminId,
      targetType: mockTargetType,
      targetId: mockTargetId,
      action: mockAction,
    });

    // Verify Supabase was still called
    expect(supabaseAdmin.from).toHaveBeenCalledWith('admin_actions');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('logs action with all parameters including metadata', async () => {
    const mockAdminId = 'admin2';
    const mockTargetType = 'group';
    const mockTargetId = 'group456';
    const mockAction = 'APPROVE_GROUP';
    const mockReason = 'Meets all requirements';
    const mockMetadata = {
      groupName: 'Test Group',
      memberCount: 5,
      destination: 'Paris',
    };

    // Mock Supabase insert to succeed
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertResult = {
      error: null,
    };
    mockInsert.mockResolvedValue(mockInsertResult);

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await logAdminAction({
      adminId: mockAdminId,
      targetType: mockTargetType,
      targetId: mockTargetId,
      action: mockAction,
      reason: mockReason,
      metadata: mockMetadata,
    });

    // Verify all parameters were passed correctly
    expect(mockInsert).toHaveBeenCalledWith([
      {
        admin_id: mockAdminId,
        target_type: mockTargetType,
        target_id: mockTargetId,
        action: mockAction,
        reason: mockReason,
        metadata: mockMetadata,
      },
    ]);
  });
});
