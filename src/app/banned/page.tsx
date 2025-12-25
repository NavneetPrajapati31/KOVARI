import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/shared/components/ui/button";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
          Account Suspended
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Your account has been suspended due to a violation of our terms of
          service. If you believe this is a mistake, please contact support.
        </p>
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
