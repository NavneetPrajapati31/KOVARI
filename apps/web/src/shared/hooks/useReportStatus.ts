"use client";

import { useState, useEffect } from "react";

export function useReportStatus(targetId?: string, targetType?: "user" | "group") {
  const [hasReported, setHasReported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      if (!targetId || !targetType) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/flags/check?targetType=${targetType}&targetId=${targetId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.warn(`[useReportStatus] Failed to check status (Status: ${res.status}):`, errorData);
          if (isMounted) setHasReported(false);
          return;
        }
        
        const data = await res.json();
        if (isMounted) {
          setHasReported(data.hasActiveReport || false);
        }
      } catch (err) {
        console.error("Error checking report status:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [targetId, targetType]);

  return { hasReported, setHasReported, loading };
}

