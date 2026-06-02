import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@kovari/api";

/**
 * Requires admin authentication. For use in API routes.
 * Returns admin data or throws an error that should be caught and returned as NextResponse.
 *
 * @throws {NextResponse} If user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<{
  adminId: string;
  email: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  // Safely extract email
  const emailObj = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
  const email = emailObj?.emailAddress?.toLowerCase();

  if (!email) {
    throw NextResponse.json({ error: 'No email found on Clerk user' }, { status: 400 });
  }

  // Check if email exists in Supabase admins table using service role key
  const { data: adminData, error } = await supabaseAdmin
    .from('admins')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminData) {
    throw NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    );
  }

  return { adminId: adminData.id, email: adminData.email };
}

/**
 * Requires admin authentication. For use in Server Components/Pages.
 * Redirects to sign-in or not-authorized pages.
 */
export async function requireAdminPage(): Promise<{
  adminId: string;
  email: string;
}> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  // Safely extract email
  const emailObj = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
  const email = emailObj?.emailAddress?.toLowerCase();

  if (!email) {
    redirect('/not-authorized');
  }

  // Check if email exists in Supabase admins table using service role key
  const { data: adminData, error } = await supabaseAdmin
    .from('admins')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    redirect('/not-authorized');
  }

  if (!adminData) {
    redirect('/not-authorized');
  }

  return { adminId: adminData.id, email: adminData.email };
}
