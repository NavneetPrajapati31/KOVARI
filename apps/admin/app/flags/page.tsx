import { requireAdmin } from "@/admin-lib/adminAuth";
import { AdminFlagsTable } from "@/components/AdminFlagsTable";
import { headers } from "next/headers";

interface Flag {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  targetInfo?: {
    id: string;
    name: string;
    email?: string;
    profile_photo?: string;
  };
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
  const host = headersList.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

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
    try {
      const errorData = await response.json();
      console.error("Failed to fetch flags:", response.status, errorData);
    } catch {
      console.error("Failed to fetch flags:", response.status);
    }
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
    <div className="max-w-full mx-auto space-y-6">
      <div className="space-y-0">
        <h1 className="text-lg font-semibold tracking-tight">Flags Queue</h1>
        <p className="text-md text-muted-foreground">
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
