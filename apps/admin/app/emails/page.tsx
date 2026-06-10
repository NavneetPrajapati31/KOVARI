import { requireAdminPage } from "@/admin-lib/adminAuth";
import { supabaseAdmin } from "@kovari/api";
import { EmailCampaignComposer } from "../../components/EmailCampaignComposer";

export default async function EmailsPage() {
  // 1. Authenticate user as admin or redirect
  await requireAdminPage();

  // 2. Fetch profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, username, email, profile_photo")
    .eq("deleted", false)
    .order("name", { ascending: true });

  if (profilesError) {
    console.error("Error fetching profiles for email campaigns:", profilesError);
  }

  // 3. Fetch waitlist
  const { data: waitlist, error: waitlistError } = await supabaseAdmin
    .from("waitlist")
    .select("id, email, status, source, created_at")
    .order("created_at", { ascending: false });

  if (waitlistError) {
    console.error("Error fetching waitlist for email campaigns:", waitlistError);
  }

  return (
    <EmailCampaignComposer 
      profiles={profiles || []} 
      waitlist={waitlist || []} 
    />
  );
}
