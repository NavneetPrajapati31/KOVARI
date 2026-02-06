import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type ProfileEditTab = "general" | "professional" | "personal" | "travel";

const VALID_TABS: ProfileEditTab[] = ["general", "professional", "personal", "travel"];

export const useProfileEditTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUpdatingRef = useRef(false);

  // Get initial tab from URL or default to 'general'
  const getInitialTab = (): ProfileEditTab => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as ProfileEditTab)) {
      return tabParam as ProfileEditTab;
    }
    return "general";
  };

  const [activeTab, setActiveTabState] =
    useState<ProfileEditTab>(getInitialTab);

  // Sync with URL changes only when not updating programmatically
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }

    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      VALID_TABS.includes(tabParam as ProfileEditTab) &&
      tabParam !== activeTab
    ) {
      setActiveTabState(tabParam as ProfileEditTab);
    }
  }, [searchParams, activeTab]);

  const setActiveTab = useCallback(
    (tab: string) => {
      const validTab = VALID_TABS.includes(tab as ProfileEditTab)
        ? (tab as ProfileEditTab)
        : "general";

      if (validTab !== activeTab) {
        // Mark that we're updating programmatically
        isUpdatingRef.current = true;

        // Set state immediately for responsive UI
        setActiveTabState(validTab);

        // Update URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("tab", validTab);

        router.replace(`${pathname}?${newSearchParams.toString()}`, {
          scroll: false,
        });
      }
    },
    [activeTab, router, pathname, searchParams]
  );

  return {
    activeTab,
    setActiveTab,
    isValidTab: (tab: string): tab is ProfileEditTab =>
      VALID_TABS.includes(tab as ProfileEditTab),
  };
};
