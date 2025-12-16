import { requireAdmin } from "@/admin-lib/adminAuth";
import { AdminFlagsTable } from "@/components/AdminFlagsTable";
import { headers } from "next/headers";

interface Flag {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  reason: string;
  evidenceUrl: string | null;
  createdAt: string;
  status: string;
}

async function getFlags(
  page: number = 1,
  limit: number = 20,
  status: string = "pending",
  targetType: string = "all"
): Promise<{ flags: Flag[]; page: number; limit: number }> {
  const headersList = await headers();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: status,
  });
  
  if (targetType !== "all") {
    params.append("targetType", targetType);
  }

  const response = await fetch(`${baseUrl}/api/admin/flags?${params}`, {
    cache: "no-store",
    headers: {
      cookie: headersList.get("cookie") || "",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch flags:", response.status);
    return { flags: [], page, limit };
  }

  // Check if response is JSON before parsing
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.error("Flags API returned non-JSON response");
    return { flags: [], page, limit };
  }

  const data = await response.json();
  return {
    page: data.page || page,
    limit: data.limit || limit,
    flags: data.flags || [],
  };
}

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; targetType?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 20;
  const status = params.status || "pending";
  const targetType = params.targetType || "all";

  const { flags, page: currentPage } = await getFlags(page, limit, status, targetType);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Flags Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user and group reports
        </p>
      </div>

      <AdminFlagsTable
        initialFlags={flags}
        initialPage={currentPage}
        initialLimit={limit}
        initialStatus={status}
        initialTargetType={targetType}
      />
    </div>
  );
}
