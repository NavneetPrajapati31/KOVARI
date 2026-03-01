import { useState, useEffect } from "react";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface ReportItem {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  targetUsername?: string;
  targetMemberCount?: number;
  targetImageUrl?: string;
  reason: string;
  additionalNotes?: string;
  evidenceUrl?: string;
  status: ReportStatus;
  createdAt: string;
}

export function useMyReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reports/my-reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return { reports, loading, error, refetch: fetchReports };
}
