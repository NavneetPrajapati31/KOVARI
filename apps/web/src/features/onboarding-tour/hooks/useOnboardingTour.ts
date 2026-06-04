import { useState, useEffect, useCallback } from "react";

interface TourSteps {
  profile_photo: boolean;
  explored_match: boolean;
  joined_group: boolean;
  sent_message: boolean;
}

export interface TourState {
  loading: boolean;
  completed: boolean;
  steps: TourSteps | null;
  allDone: boolean;
  dismiss: () => Promise<void>;
  refresh: () => void;
}

export function useOnboardingTour(): TourState {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [steps, setSteps] = useState<TourSteps | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding-tour");
      const data = await res.json();
      if (data.completed) {
        setCompleted(true);
      } else {
        setSteps(data.steps);
      }
    } catch {
      // fail silently — don't break dashboard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const dismiss = useCallback(async () => {
    setCompleted(true);
    await fetch("/api/onboarding-tour", { method: "PATCH" });
  }, []);

  const allDone = !!steps && Object.values(steps).every(Boolean);

  // Auto-dismiss when all steps complete
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => dismiss(), 2000);
      return () => clearTimeout(t);
    }
  }, [allDone, dismiss]);

  return { loading, completed, steps, allDone, dismiss, refresh: fetch_ };
}
