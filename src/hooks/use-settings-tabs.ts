import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type SettingsTab = "edit" | "members" | "delete";

const VALID_TABS: SettingsTab[] = ["edit", "members", "delete"];

export const useSettingsTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial tab from URL or default to 'edit'
  const getInitialTab = (): SettingsTab => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as SettingsTab)) {
      return tabParam as SettingsTab;
    }
    return "edit";
  };

  const [activeTab, setActiveTabState] = useState<SettingsTab>(getInitialTab);

  // Sync with URL changes
  useEffect(() => {
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
        : "edit";

      if (validTab !== activeTab) {
        // Set state immediately for responsive UI
        setActiveTabState(validTab);

        // Update URL immediately without debounce
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
