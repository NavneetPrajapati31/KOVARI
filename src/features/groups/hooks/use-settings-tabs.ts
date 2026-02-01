import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export type SettingsTab =
  | "basic"
  | "travel"
  | "privacy"
  | "members"
  | "requests"
  | "delete"
  | null;

const VALID_TABS: Exclude<SettingsTab, null>[] = [
  "basic",
  "travel",
  "privacy",
  "members",
  "requests",
  "delete",
];

export const useSettingsTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUpdatingRef = useRef(false);
  const isMobile = useIsMobile();

  // Get initial tab from URL or default to 'basic' (desktop) or null (mobile)
  const getInitialTab = (): SettingsTab => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      VALID_TABS.includes(tabParam as Exclude<SettingsTab, null>)
    ) {
      return tabParam as Exclude<SettingsTab, null>;
    }
    if (isMobile) return null;
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
      VALID_TABS.includes(tabParam as Exclude<SettingsTab, null>) &&
      tabParam !== activeTab
    ) {
      setActiveTabState(tabParam as Exclude<SettingsTab, null>);
    }
    // If no tab param and mobile, clear activeTab
    if (!tabParam && isMobile && activeTab) {
      setActiveTabState(null);
    }
  }, [searchParams, activeTab, isMobile]);

  const setActiveTab = useCallback(
    (tab: string | null) => {
      const validTab =
        tab && VALID_TABS.includes(tab as Exclude<SettingsTab, null>)
          ? (tab as Exclude<SettingsTab, null>)
          : null;

      if (validTab !== activeTab) {
        // Mark that we're updating programmatically
        isUpdatingRef.current = true;

        // Set state immediately for responsive UI
        setActiveTabState(validTab);

        // Update URL
        const newSearchParams = new URLSearchParams(searchParams);
        if (validTab) {
          newSearchParams.set("tab", validTab);
        } else {
          newSearchParams.delete("tab");
        }
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
    isValidTab: (tab: string): tab is Exclude<SettingsTab, null> =>
      VALID_TABS.includes(tab as Exclude<SettingsTab, null>),
  };
};
