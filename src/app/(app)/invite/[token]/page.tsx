import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { JoinGroupButton } from "@/features/groups/components/join-group-button";
import { AcceptInviteClient } from "./accept-invite-client";

interface InvitePageProps {
  params: { token: string };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { userId } = await auth();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );

  // 1. Lookup invite link in group_invite_links
  const { data: linkRow, error: linkError } = await supabase
    .from("group_invite_links")
    .select("group_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  // 1b. Lookup invite in group_email_invitations if not found in group_invite_links
  let emailInvite = null;
  let groupId = linkRow?.group_id;
  if (!linkRow) {
    const { data: emailRow, error: emailError } = await supabase
      .from("group_email_invitations")
      .select("group_id, status, email")
      .eq("token", token)
      .maybeSingle();
    if (emailRow) {
      emailInvite = emailRow;
      groupId = emailRow.group_id;
    }
  }

  if ((!linkRow && !emailInvite) || linkError) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
        <p className="text-gray-600 mb-4">
          This invite link is invalid or has expired.
        </p>
        <Link href="/" className="text-blue-600 underline">
          Go Home
        </Link>
      </div>
    );
  }

  // 2. Lookup group info
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, destination, description, cover_image")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError || !group) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-2">Group Not Found</h1>
        <p className="text-gray-600 mb-4">
          The group for this invite could not be found.
        </p>
        <Link href="/" className="text-blue-600 underline">
          Go Home
        </Link>
      </div>
    );
  }

  // 3. If not signed in, prompt to sign in
  if (!userId) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-2">
          You&apos;re Invited to Join {group.name}!
        </h1>
        <p className="text-gray-600 mb-4">
          Sign in or create an account to join this group.
        </p>
        <Link
          href={`/sign-in?redirect_url=/invite/${token}`}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // 4. If signed in, get user's DB ID
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-gray-600 mb-4">
          Could not find your user record in our database.
        </p>
      </div>
    );
  }

  // If this is an email invite, accept it automatically after sign-in
  if (emailInvite && emailInvite.status === "pending") {
    return <AcceptInviteClient token={token} groupId={groupId} />;
  }

  // 5. If already a member, redirect
  const { data: existingMembership } = await supabase
    .from("group_memberships")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership?.status === "accepted") {
    redirect(`/groups/${groupId}/home`);
  }

  return (
    <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
      <h1 className="text-2xl font-bold mb-2">
        You&apos;re Invited to Join {group.name}!
      </h1>
      <p className="text-gray-600 mb-4">
        {group.description || "Join this group to start collaborating!"}
      </p>
      <JoinGroupButton groupId={group.id} />
    </div>
  );
}
