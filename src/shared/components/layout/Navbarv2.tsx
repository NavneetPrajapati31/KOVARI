"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  // DropdownMenu,
  Avatar,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  Skeleton,
} from "@heroui/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/shared/components/ui/button";
import { motion } from "framer-motion";
import {
  Compass,
  MessageCircle,
  Users,
  LayoutDashboard,
  Plus,
  Home,
  Search,
  User2,
  Inbox,
  Settings,
} from "lucide-react";
import Spinner from "../Spinner";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export const AcmeLogo = () => {
  return (
    <svg fill="none" height="40" viewBox="0 0 32 32" width="40">
      <path
        clipRule="evenodd"
        d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default function App({
  onAvatarMenuOpenChange,
}: {
  onAvatarMenuOpenChange?: (isOpen: boolean) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [profilePhotohref, setProfilePhotohref] = useState<string | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(
    null
  );
  const [isMenuButtonOpen, setIsMenuButtonOpen] = useState(false);

  useEffect(() => {
    // Hide spinner when route changes
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.id) return;
      setProfilePhotoLoading(true);
      setProfilePhotoError(null);
      try {
        const supabase = createClient();
        // First, get the user's row in the users table by clerk_user_id
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .maybeSingle();
        if (userError) throw userError;
        if (!userRow?.id) {
          setProfilePhotohref(null);
          setProfilePhotoLoading(false);
          return;
        }
        // Now get the profile row by user_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("profile_photo")
          .eq("user_id", userRow.id)
          .maybeSingle();
        if (profileError) throw profileError;
        setProfilePhotohref(profile?.profile_photo || null);
      } catch (err: unknown) {
        setProfilePhotoError("Failed to load profile photo");
        setProfilePhotohref(null);
        console.error("Error fetching profile photo:", err);
      } finally {
        setProfilePhotoLoading(false);
      }
    };
    if (isSignedIn && isLoaded) {
      fetchProfilePhoto();
    } else {
      setProfilePhotohref(null);
    }
  }, [user, isSignedIn, isLoaded]);

  const handleNavigation = (href: string) => {
    setIsNavigating(true);
    router.push(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "#") {
      return pathname === "/";
    }
    return pathname === href;
  };

  const navigationItems: {
    name: string;
    href: string;
    icon?: React.ElementType;
  }[] = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Explore",
      href: "/explore",
      icon: Search,
    },
    {
      name: "Chats",
      href: "/chat",
      icon: User2,
    },
    {
      name: "Groups",
      href: "/groups",
      icon: Inbox,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User2,
    },
    {
      name: "Settings",
      href: "#",
      icon: Settings,
    },
  ];

  const menuItems = [
    {
      key: "auth",
      label: <span>{`Signed in as ${user?.username}`}</span>,
    },
    {
      key: "profile",
      label: "My Profile",
      onClick: () => handleNavigation("/profile"),
    },
    {
      key: "Groups",
      label: "My Groups",
      onClick: () => handleNavigation("/groups"),
    },
    // {
    //   key: "analytics",
    //   label: "Analytics",
    //   onClick: () => handleNavigation("/analytics"),
    // },
    // {
    //   key: "system",
    //   label: "System",
    //   onClick: () => handleNavigation("/system"),
    // },
    // {
    //   key: "configurations",
    //   label: "Configurations",
    //   onClick: () => handleNavigation("/configurations"),
    // },
    // {
    //   key: "help_and_feedback",
    //   label: "Help & Feedback",
    //   onClick: () => handleNavigation("/help"),
    // },
    {
      key: "logout",
      label: <p className="text-danger">Log Out</p>,
      onClick: handleSignOut,
    },
  ];

  return (
    <>
      {/* {isNavigating && <Spinner />} */}
      <Navbar
        // height={"3rem"}
        shouldHideOnScroll
        isBordered
        onMenuOpenChange={setIsMenuOpen}
        className="backdrop-blur-xl bg-background/80 border-border sticky top-0 z-40"
        classNames={{
          wrapper: "max-w-full px-4",
        }}
      >
        <NavbarContent className="flex items-center gap-3 p-0" justify="start">
          <button
            type="button"
            onClick={toggleMenu}
            className="relative flex items-center gap-2 focus:outline-none p-2"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-6 h-4 flex flex-col justify-center items-center">
              {/* Top line */}
              <motion.div
                className="w-5 h-[1.5px] bg-black absolute"
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 0 : -2,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              />
              {/* Bottom line */}
              <motion.div
                className="w-5 h-[1.5px] bg-black absolute"
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? 0 : 2,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              />
            </div>
            <span className="text-sm font-medium tracking-wide text-black uppercase select-none">
              MENU
            </span>
          </button>
        </NavbarContent>
        <NavbarContent className="flex-1 flex justify-center" justify="center">
          <Link
            href="/"
            className="flex items-center text-foreground !opacity-100 h-12"
            onClick={() => handleNavigation("/")}
            style={{ minHeight: "3rem" }}
          >
            <span className="font-clash font-medium text-xl">KOVARI</span>
          </Link>
        </NavbarContent>

        <NavbarContent as="div" justify="end">
          <Link href="/create-group" className="hidden md:flex">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1 rounded-full flex items-center gap-2 self-start sm:self-center"
              aria-label="Create Group"
            >
              <span className="text-xs">Create Group</span>
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
          <Link href="/invitations" className="hidden md:flex">
            <div
              className="bg-foreground hover:bg-black/70 transition-all duration-300 text-primary-foreground p-2.5 rounded-full flex items-center self-start sm:self-center"
              aria-label="Invitations"
            >
              <Inbox className="h-4 w-4" />
            </div>
          </Link>
          {!isLoaded || profilePhotoLoading ? (
            <Skeleton className="w-9 h-9 rounded-full" />
          ) : isSignedIn ? (
            <DropdownMenu onOpenChange={onAvatarMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Avatar
                  isBordered
                  as="button"
                  className={"transition-transform ring-primary"}
                  color="secondary"
                  name={user?.fullName || user?.username || "User"}
                  size="sm"
                  src={profilePhotohref || user?.imageUrl}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-4 min-w-[160px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-border mr-8">
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={item.onClick}
                    className={`font-semibold w-full rounded-md px-4 py-1 text-sm border-none cursor-pointer flex items-center hover:!bg-transparent hover:!border-none hover:!outline-none focus-within:!bg-transparent focus-within:!border-none focus-within:!outline-none bg-transparent text-foreground focus-within:!text-foreground !{item.className}`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="px-6 h-9 bg-primary hover:bg-primary-hover text-background rounded-lg"
              onClick={() => handleNavigation("/sign-up")}
            >
              Sign Up
            </Button>
          )}
        </NavbarContent>

        <NavbarMenu className="md:hidden backdrop-blur-2xl">
          {navigationItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                className="w-full flex items-center gap-3"
                color={"foreground"}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="block md:hidden"
        />
      </Navbar>
    </>
  );
}
