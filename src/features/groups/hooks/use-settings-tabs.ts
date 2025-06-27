import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type SettingsTab =
  | "basic"
  | "travel"
  | "privacy"
  | "communication"
  | "preferences"
  | "advanced"
  | "members"
  | "requests"
  | "delete";

const VALID_TABS: SettingsTab[] = [
  "basic",
  "travel",
  "privacy",
  "communication",
  "preferences",
  "advanced",
  "members",
  "requests",
  "delete",
];

export const useSettingsTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUpdatingRef = useRef(false);

  // Get initial tab from URL or default to 'basic'
  const getInitialTab = (): SettingsTab => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as SettingsTab)) {
      return tabParam as SettingsTab;
    }
    return "basic";
  };

  const [activeTab, setActiveTabState] = useState<SettingsTab>(getInitialTab);

  // Sync with URL changes only when not updating programmatically
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }

    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      VALID_TABS.includes(tabParam as SettingsTab) &&
      tabParam !== activeTab
    ) {
      setActiveTabState(tabParam as SettingsTab);
    }
  }, [searchParams, activeTab]);

  const setActiveTab = useCallback(
    (tab: string) => {
      const validTab = VALID_TABS.includes(tab as SettingsTab)
        ? (tab as SettingsTab)
        : "basic";

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
    isValidTab: (tab: string): tab is SettingsTab =>
      VALID_TABS.includes(tab as SettingsTab),
  };
};
