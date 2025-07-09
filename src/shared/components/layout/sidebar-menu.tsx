"use client";

import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Instagram, ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "ALL PRODUCTS", href: "/products" },
  { label: "NEW ARRIVALS", href: "/new-arrivals" },
  { label: "COLLECTIONS", href: "/collections", arrow: true },
  { label: "OUR STORY", href: "/our-story" },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({ open, onClose }) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="p-0 w-full max-w-[420px] bg-white flex flex-col"
        // Sidebar and overlay now cover the full viewport
      >
        <SheetTitle className="sr-only">Main Menu</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                tabIndex={0}
                className="rounded-full focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x w-6 h-6"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </SheetClose>
            <span className="text-base font-medium tracking-wide text-black uppercase select-none ml-2">
              MENU
            </span>
          </div>
        </div>
        {/* Menu Items */}
        <nav className="flex-1 flex flex-col justify-center gap-8 px-10">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              tabIndex={0}
              aria-label={item.label}
              className="text-4xl font-light uppercase tracking-tight text-black flex items-center gap-4 focus:outline-none focus:underline hover:underline transition-all"
              onClick={onClose}
            >
              {item.label}
              {item.arrow && <ArrowRight className="w-8 h-8" />}
            </Link>
          ))}
        </nav>
        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-200 mt-auto">
          <div className="flex gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              tabIndex={0}
              className="text-black hover:text-gray-700 focus:outline-none"
            >
              <Instagram className="w-6 h-6" />
            </a>
            {/* Add more social icons here if needed */}
          </div>
        </div>
      </SheetContent>
      {/* Overlay handled by Sheet */}
    </Sheet>
  );
};

export default SidebarMenu;
