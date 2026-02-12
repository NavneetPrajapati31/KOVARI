import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import Link from "next/link";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { JoinGroupButton } from "@/features/groups/components/join-group-button";
import { AcceptInviteClient } from "./accept-invite-client";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, Users, LogIn, Home, UserX } from "lucide-react";

function InviteCard({
  icon: Icon,
  variant = "default",
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  variant?: "default" | "error";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const isError = variant === "error";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-2xl bg-card shadow-sm p-8 sm:p-10 text-center">
          <div
            className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
              isError ? "bg-destructive/10" : "bg-primary/10"
            }`}
          >
            <Icon
              className={`w-7 h-7 ${isError ? "text-destructive" : "text-primary"}`}
              aria-hidden
            />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  const supabase = createAdminSupabaseClient();


  const { data: linkRow, error: linkError } = await supabase
    .from("group_invite_links")
    .select("group_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  let emailInvite = null;
  let groupId = linkRow?.group_id;
  if (!linkRow) {
    const { data: emailRow } = await supabase
      .from("group_email_invitations")
      .select("group_id, status, email")
      .eq("token", token)
      .maybeSingle();
    if (emailRow) {
      emailInvite = emailRow;
      groupId = emailRow.group_id;
    }
  }

  const isLinkExpired =
    linkRow?.expires_at && new Date(linkRow.expires_at).getTime() <= Date.now();

  if ((!linkRow && !emailInvite) || linkError || isLinkExpired) {
    return (
      <InviteCard
        icon={AlertCircle}
        variant="error"
        title="Invalid or expired link"
        description="This invite link is invalid or has expired. Ask the group admin for a new invite."
      >
        <Button
          asChild
          variant="default"
          className="w-full sm:w-auto rounded-full"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </InviteCard>
    );
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, destination, description, cover_image, status")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError || !group) {
    return (
      <InviteCard
        icon={AlertCircle}
        variant="error"
        title="Group not found"
        description="The group for this invite could not be found. The link may be outdated."
      >
        <Button
          asChild
          variant="default"
          className="w-full sm:w-auto rounded-full"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </InviteCard>
    );
  }

  if (group.status === "removed") {
    return (
      <InviteCard
        icon={AlertCircle}
        variant="error"
        title="Group not found"
        description="The group for this invite could not be found."
      >
        <Button
          asChild
          variant="default"
          className="w-full sm:w-auto rounded-full"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </InviteCard>
    );
  }

  if (!userId) {
    return (
      <InviteCard
        icon={Users}
        title={`You're invited to ${group.name}`}
        description="Sign in or create an account to join this group and start planning together."
      >
        <Button
          asChild
          className="w-full rounded-full h-10 font-medium"
          size="lg"
        >
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in to join
          </Link>
        </Button>
      </InviteCard>
    );
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!user) {
    return (
      <InviteCard
        icon={UserX}
        variant="error"
        title="Account issue"
        description="We couldn't find your account. Please sign out and sign in again, or contact support."
      >
        <Button
          asChild
          variant="default"
          className="w-full sm:w-auto rounded-full"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </InviteCard>
    );
  }

  // If already a member, redirect to group home (for any invite type: link or email)
  const { data: existingMembership } = await supabase
    .from("group_memberships")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership?.status === "accepted") {
    redirect(`/groups/${groupId}/home`);
  }

  if (emailInvite && emailInvite.status === "pending") {
    return <AcceptInviteClient token={token} groupId={groupId} />;
  }

  return (
    <InviteCard icon={Users} title="You're invited to join" description="">
      <div className="space-y-4">
        <p className="text-md font-semibold text-primary">{group.name}</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto -mt-2">
          {group.description ||
            "Join this group to collaborate on the trip and stay in sync with your travel mates."}
        </p>
        <JoinGroupButton
          groupId={group.id}
          className="w-full rounded-full h-10 font-medium"
          viaInvite
        />
      </div>
    </InviteCard>
  );
}
