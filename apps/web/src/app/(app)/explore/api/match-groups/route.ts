import { POST as matchGroupsPOST } from "@/app/api/match-groups/route";
import { NextRequest } from "next/server";

// Compatibility route:
// Some clients may accidentally call `/explore/api/match-groups` (relative path) instead of `/api/match-groups`.
// Delegate to the canonical handler.

export async function POST(req: NextRequest) {
  return matchGroupsPOST(req);
}


