import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';
import { logAdminAction } from '@/admin-lib/logAdminAction';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (!['login', 'logout'].includes(action)) {
       return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    // Resolve admin ID from admins table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (adminError || !adminData) {
       console.error('Admin not found in database:', email);
       // In development or if the table is not populated, we might want to allow it?
       // But the goal is to log admin actions. If not an admin, maybe shouldn't be here.
       // However, to satisfy the request "logging login/logout", we will attempt to log.
       // If adminId is missing, we can't strict log to foreign key constraint.
       // Assuming admin is present.
       return NextResponse.json({ error: 'Admin record not found' }, { status: 403 });
    }

    const logAction = action === 'login' ? 'LOGIN_ADMIN' : 'LOGOUT_ADMIN';

    await logAdminAction({
      adminId: adminData.id,
      targetType: 'admin',
      targetId: adminData.id,
      action: logAction,
      reason: null,
      metadata: {
        email: email,
        clerkUserId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging auth event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
