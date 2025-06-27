"use client";
import React, { KeyboardEvent, useCallback, useMemo, useRef } from "react";
import {
  Settings,
  MapPin,
  Shield,
  MessageCircle,
  Heart,
  Zap,
  Users,
  AlertTriangle,
  Trash2,
} from "lucide-react";

const TABS = [
  // Edit Group Sections
  { key: "basic", label: "Basic Info", icon: Settings, category: "edit" },
  { key: "travel", label: "Travel Details", icon: MapPin, category: "edit" },
  { key: "privacy", label: "Privacy & Safety", icon: Shield, category: "edit" },
  {
    key: "communication",
    label: "Communication",
    icon: MessageCircle,
    category: "edit",
  },
  { key: "preferences", label: "Preferences", icon: Heart, category: "edit" },
  { key: "advanced", label: "Advanced", icon: Zap, category: "edit" },
  // Other sections
  {
    key: "members",
    label: "Manage Members",
    icon: Users,
    category: "management",
  },
  {
    key: "requests",
    label: "Join Requests",
    icon: AlertTriangle,
    category: "management",
  },
  { key: "delete", label: "Leave Group", icon: Trash2, category: "danger" },
] as const;

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (key: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastClickTime = useRef<number>(0);

  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, key: string) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent rapid clicks
      const now = Date.now();
      if (now - lastClickTime.current < 300) {
        return;
      }
      lastClickTime.current = now;

      if (activeTab !== key) {
        setActiveTab(key);
      }
    },
    [activeTab, setActiveTab]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== key) {
          setActiveTab(key);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        const nextTab = TABS[nextIndex].key;
        if (activeTab !== nextTab) {
          setActiveTab(nextTab);
          // Focus the next tab
          setTimeout(() => tabRefs.current[nextIndex]?.focus(), 0);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        const prevTab = TABS[prevIndex].key;
        if (activeTab !== prevTab) {
          setActiveTab(prevTab);
          // Focus the previous tab
          setTimeout(() => tabRefs.current[prevIndex]?.focus(), 0);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        const firstTab = TABS[0].key;
        if (activeTab !== firstTab) {
          setActiveTab(firstTab);
          setTimeout(() => tabRefs.current[0]?.focus(), 0);
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const lastTab = TABS[TABS.length - 1].key;
        if (activeTab !== lastTab) {
          setActiveTab(lastTab);
          setTimeout(() => tabRefs.current[TABS.length - 1]?.focus(), 0);
        }
      }
    },
    [activeTab, setActiveTab]
  );

  const groupedTabs = useMemo(() => {
    const groups = {
      edit: TABS.filter((tab) => tab.category === "edit"),
      management: TABS.filter((tab) => tab.category === "management"),
      danger: TABS.filter((tab) => tab.category === "danger"),
    };
    return groups;
  }, []);

  const renderTabGroup = (
    groupKey: string,
    tabs: Array<(typeof TABS)[number]>,
    title?: string
  ) => (
    <div key={groupKey} className="space-y-0">
      {title && (
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            className={`w-full text-left font-medium text-xs sm:text-sm px-3 sm:px-5 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? "text-primary bg-primary/10 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-current={activeTab === tab.key ? "page" : undefined}
            aria-label={tab.label}
            tabIndex={0}
            onClick={(e) => handleTabClick(e, tab.key)}
            onKeyDown={(e) => handleKeyDown(e, tab.key)}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <nav
      aria-label="Settings Navigation"
      className="flex flex-row md:flex-col gap-4 p-2 md:p-4 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto"
    >
      {renderTabGroup("edit", groupedTabs.edit, "Edit Group")}
      <div className="border-t border-gray-200 mb-0.5" />
      {renderTabGroup("management", groupedTabs.management, "Management")}
      <div className="border-t border-gray-200 mb-0.5" />
      {renderTabGroup("danger", groupedTabs.danger, "Danger Zone")}
    </nav>
  );
};

export default SettingsSidebar;
