import { requireAdmin } from "../lib/adminAuth";
import { SignOutButton } from "@clerk/nextjs";

export default async function Page() {
  const { email } = await requireAdmin(); // stops unauthorized users

  return (
    <main className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome Admin
        </h1>
        <p className="text-sm text-muted-foreground">Logged in as: {email}</p>
      </div>
      <SignOutButton redirectUrl="/sign-in">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </SignOutButton>
    </main>
  );
}
