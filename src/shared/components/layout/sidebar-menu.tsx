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
import { motion } from "framer-motion";

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  onClick?: () => void;
}

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
}

const defaultMenuItems: MenuItem[] = [
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
    label: "Invitations",
    href: "/invitations",
    icon: User2,
  },
  {
    label: "Settings",
    href: "#",
    icon: Settings,
  },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  open,
  onClose,
  menuItems = defaultMenuItems,
}) => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: 20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="p-0 w-full max-w-[420px] bg-card flex flex-col h-screen"
        overlayClassName="backdrop-blur-sm"
      >
        <SheetTitle className="sr-only">Main Menu</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wide uppercase select-none">
              MENU
            </span>
          </div>
        </div>
        {/* Menu Items */}
        <motion.nav
          className="flex-1 flex flex-col justify-start gap-4 px-8 mt-2 overflow-x-auto overflow-y-hidden hide-scrollbar"
          variants={containerVariants}
          initial="hidden"
          animate={open ? "visible" : "hidden"}
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
              animate={
                open
                  ? { opacity: 1, x: 0, filter: "blur(0px)" }
                  : { opacity: 0, x: 20, filter: "blur(8px)" }
              }
              transition={{
                opacity: {
                  duration: 0.4,
                  delay: 0.4 + index * 0.1,
                  ease: "easeOut",
                },
                x: { duration: 0.4, delay: 0.4 + index * 0.1, ease: "easeOut" },
                filter: {
                  duration: 0.4,
                  delay: 0.4 + index * 0.1,
                  ease: "easeOut",
                },
              }}
            >
              {item.onClick ? (
                <button
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  tabIndex={0}
                  aria-label={item.label}
                  className={`text-sm font-bold uppercase text-foreground flex items-center gap-4 focus:outline-none hover:text-primary transition-colors duration-300 w-full text-left ${index !== menuItems.length - 1 ? "border-b border-border pb-4" : ""}`}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  href={item.href}
                  tabIndex={0}
                  aria-label={item.label}
                  className={`text-sm font-bold uppercase text-foreground flex items-center gap-4 focus:outline-none hover:text-primary transition-colors duration-300 ${index !== menuItems.length - 1 ? "border-b border-border pb-4" : ""}`}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              )}
            </motion.div>
          ))}
        </motion.nav>
      </SheetContent>
      {/* Overlay handled by Sheet */}
    </Sheet>
  );
};

export default SidebarMenu;
