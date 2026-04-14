import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || clerkUserId;

    // 1. Fetch TS results (current production logic)
    const baseUrl = req.nextUrl.origin;
    const tsStart = performance.now();
    const tsRes = await fetch(`${baseUrl}/api/match-solo?userId=${userId}`, {
      headers: { Cookie: req.headers.get("cookie") || "" }
    });
    const tsMatches = await tsRes.json();
    const tsEnd = performance.now();
    const tsLatency = tsEnd - tsStart;

    // 2. Fetch Go results (requires GO service to be running on localhost:8080)
    let goMatches: any[] = [];
    let goError: string | null = null;
    const goStart = performance.now();
    try {
      const goRes = await fetch(`http://localhost:8080/v1/match/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(2000)
      });
      if (goRes.ok) {
        goMatches = await goRes.json();
      } else {
        goError = `Go service returned ${goRes.status}`;
      }
    } catch (err: any) {
      goError = `Could not connect to Go service: ${err.message}`;
    }
    const goEnd = performance.now();
    const goLatency = goEnd - goStart;

    // 3. Comparison Logic (Phase 1.5 Refinements)
    const comparison: any = {
      user: userId,
      tsCount: tsMatches.length,
      goCount: goMatches.length,
      tsLatency: `${tsLatency.toFixed(2)}ms`,
      goLatency: `${goLatency.toFixed(2)}ms`,
      parity: false,
      mismatches: [],
      goError,
      shapeValid: true
    };

    const requiredKeys = ["userId", "user", "score", "breakdown", "budgetDifference"];
    const breakdownKeys = ["destinationScore", "dateOverlapScore", "budgetScore", "interestScore", "personalityScore", "religionScore", "ageScore", "lifestyleScore"];

    if (goMatches.length > 0 && tsMatches.length > 0 && !goError) {
      // Check Shape for first match
      const firstGo = goMatches[0];
      const missingKeys = requiredKeys.filter(k => !(k in firstGo));
      if (missingKeys.length > 0) {
        comparison.shapeValid = false;
        comparison.mismatches.push({ type: "shape_mismatch", missingKeys });
      }

      const top10Ts = tsMatches.slice(0, 10).map((m: any) => m.userId);
      const top10Go = goMatches.slice(0, 10).map((m: any) => m.userId);
      
      const tsSet = new Set(top10Ts);
      const goSet = new Set(top10Go);
      
      const common = top10Ts.filter((id: string) => goSet.has(id));
      const setParity = common.length === Math.min(top10Ts.length, top10Go.length);
      
      if (!setParity) {
        comparison.mismatches.push({ 
          type: "set_mismatch", 
          tsTop3: top10Ts.slice(0, 3), 
          goTop3: top10Go.slice(0, 3) 
        });
      }

      const rankDrift: any[] = [];
      top10Ts.forEach((id: string, tsIdx: number) => {
        const goIdx = top10Go.indexOf(id);
        if (goIdx !== -1) {
          const drift = Math.abs(tsIdx - goIdx);
          if (drift > 2) {
             rankDrift.push({ userId: id, tsRank: tsIdx + 1, goRank: goIdx + 1, drift });
          }
        }
      });

      const scoreDrift: any[] = [];
      goMatches.slice(0, 20).forEach((gm: any) => {
        const tm = tsMatches.find((m: any) => m.userId === gm.userId);
        if (tm) {
          const diff = Math.abs(tm.score - gm.score);
          if (diff > 0.02) {
            scoreDrift.push({
               type: "score_drift",
               userId: gm.userId,
               ts: tm.score,
               go: gm.score,
               diff
            });
          }

          // Breakdown Validation
          for (const key of breakdownKeys) {
            const tsVal = tm.breakdown[key] || 0;
            const goVal = gm.breakdown[key] || 0;
            const bDiff = Math.abs(tsVal - goVal);
            if (bDiff > 0.02) {
              scoreDrift.push({
                type: "breakdown_mismatch",
                field: key,
                userId: gm.userId,
                ts: tsVal,
                go: goVal,
                diff: bDiff
              });
            }
          }
        }
      });

      comparison.setParity = setParity;
      comparison.rankDrift = rankDrift;
      if (rankDrift.length > 0) {
        comparison.mismatches.push({ type: "rank_drift", count: rankDrift.length, samples: rankDrift.slice(0, 3) });
      }
      comparison.scoreDrift = scoreDrift;
      if (scoreDrift.length > 0) {
        comparison.mismatches.push(...scoreDrift.slice(0, 5));
      }
      
      comparison.parity = setParity && rankDrift.length === 0 && scoreDrift.length === 0 && comparison.shapeValid;
    }

    return NextResponse.json(comparison);

  } catch (err: any) {
    console.error("Match Debug API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
