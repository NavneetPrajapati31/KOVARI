import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

export default async function BannedPage() {
  const { userId } = await auth();

  // If not signed in, there is no meaningful "banned" state – send them away
  if (!userId) {
    redirect("/sign-in");
  }

  type BanDetails = {
    isActiveBan: boolean;
    isSuspended: boolean;
    reason: string | null;
    expiresAt: string | null;
  };

  const defaultBanDetails: BanDetails = {
    isActiveBan: false,
    isSuspended: false,
    reason: null,
    expiresAt: null,
  };

  let banDetails: BanDetails = defaultBanDetails;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("banned, ban_reason, ban_expires_at")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch ban details:", error);
      }

      if (user?.banned) {
        const now = new Date();
        const expiresAt = user.ban_expires_at
          ? new Date(user.ban_expires_at)
          : null;

        const isActiveBan =
          expiresAt === null // permanent ban
            ? true
            : expiresAt > now; // suspension still active

        const isSuspended = !!expiresAt && isActiveBan;

        if (isActiveBan) {
          banDetails = {
            isActiveBan,
            isSuspended,
            reason: user.ban_reason ?? null,
            expiresAt: user.ban_expires_at ?? null,
          };
        }
      }
    } catch (error) {
      console.error("Failed to fetch ban details:", error);
    }
  }

  // If there is no active ban (permanent or suspension), do not allow access
  if (!banDetails.isActiveBan) {
    redirect("/");
  }

  const title = banDetails.isSuspended ? "Account suspended" : "Account banned";
  const message = banDetails.isSuspended
    ? "Your account is temporarily suspended due to a violation of our terms of service."
    : "Your account is permanently banned due to a violation of our terms of service.";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl text-destructive">
          {title}
        </h1>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground sm:text-base">
            {message} If you believe this is a mistake, please contact support.
          </p>

          {banDetails.expiresAt && (
            <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-2">
              {/* {banDetails.reason && (
                <div>
                  <span className="font-semibold block text-foreground">Reason:</span>
                  <span className="text-muted-foreground">{banDetails.reason}</span>
                </div>
              )} */}
              <div>
                <span className="font-semibold block text-foreground">
                  Suspension ends
                </span>
                <span className="text-muted-foreground">
                  {format(new Date(banDetails.expiresAt), "PPP p")}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="pt-4">
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="secondary" className="w-full sm:w-auto">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
