"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  onClick?: () => void;
}

interface MobileMenuOverlayProps {
  open: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  onJoinWaitlist?: () => void;
}

const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  open,
  onClose,
  menuItems = [],
  onJoinWaitlist,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          className="font-sans fixed top-20 left-0 right-0 bottom-0 z-40 flex flex-col bg-transparent backdrop-blur-3xl backdrop-saturate-200"
          onClick={onClose}
        >
          {/* Inner container — stop click propagation so tapping nav links doesn't bubble */}
          <div
            className="flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nav Links */}
            <nav className="flex-1 flex flex-col justify-center items-center px-6 gap-1 w-full">
              {menuItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block py-2 text-xl font-semibold tracking-tight text-foreground hover:text-foreground transition-colors duration-150 text-center w-full"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Bottom CTA */}
            <div className="px-6 pb-12 pt-6">
              <Button
                className="w-full h-14 rounded-3xl text-lg font-semibold bg-primary text-primary-foreground shadow-md"
                onClick={() => {
                  onJoinWaitlist?.();
                  onClose();
                }}
              >
                Get early access
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuOverlay;
