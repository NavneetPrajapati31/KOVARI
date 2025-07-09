"use client";

import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Home, Search, User2, Inbox, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useEffect } from "react";

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Search,
  },
  {
    label: "Chats",
    href: "/chat",
    icon: User2,
  },
  {
    label: "Groups",
    href: "/groups",
    icon: Inbox,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User2,
  },
  {
    label: "Settings",
    href: "#",
    icon: Settings,
  },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="p-0 w-full max-w-[420px] bg-card flex flex-col h-screen"
        overlayClassName="backdrop-blur-sm"
        // Sidebar and overlay now cover the full viewport
      >
        <SheetTitle className="sr-only">Main Menu</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide uppercase select-none">
              MENU
            </span>
          </div>
        </div>
        {/* Menu Items */}
        <nav className="flex-1 flex flex-col justify-start gap-4 px-8 mt-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              tabIndex={0}
              aria-label={item.label}
              className="text-sm font-semibold uppercase tracking-tight text-foreground flex items-center gap-4 focus:outline-none hover:text-primary transition-all border-b border-border pb-5"
              onClick={onClose}
            >
              {/* {item.icon && (
                <item.icon
                  className="w-8 h-8 text-muted-foreground"
                  aria-hidden="true"
                />
              )} */}
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
      {/* Overlay handled by Sheet */}
    </Sheet>
  );
};

export default SidebarMenu;
