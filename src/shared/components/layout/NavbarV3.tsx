"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
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
import {
  Compass,
  MessageCircle,
  Users,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import Spinner from "../Spinner";
import { createClient } from "@/lib/supabase";

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

const HamburgerIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Open menu"
    role="img"
    className="text-accent"
  >
    <rect y="5" width="20" height="1.5" rx="1" fill="currentColor" />
    <rect y="11" width="20" height="1.5" rx="1" fill="currentColor" />
    <rect y="17" width="20" height="1.5" rx="1" fill="currentColor" />
  </svg>
);

export default function App({
  onAvatarMenuOpenChange,
}: {
  onAvatarMenuOpenChange?: (isOpen: boolean) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(
    null
  );

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.id) return;
      setProfilePhotoLoading(true);
      setProfilePhotoError(null);
      try {
        const supabase = createClient();
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .maybeSingle();

        if (!userRow?.id) {
          setProfilePhotoUrl(null);
          setProfilePhotoLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_photo")
          .eq("user_id", userRow.id)
          .maybeSingle();

        setProfilePhotoUrl(profile?.profile_photo || null);
      } catch (err: unknown) {
        setProfilePhotoError("Failed to load profile photo");
        setProfilePhotoUrl(null);
        console.error("Error fetching profile photo:", err);
      } finally {
        setProfilePhotoLoading(false);
      }
    };

    if (isSignedIn && isLoaded) fetchProfilePhoto();
    else setProfilePhotoUrl(null);
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

  const isActiveRoute = (href: string) =>
    href === "#" ? pathname === "/" : pathname === href;

  const navigationItems = [
    { name: "Features", href: "#features", icon: Compass },
    { name: "How It Works", href: "#working", icon: MessageCircle },
    { name: "Pricing", href: "/pricing", icon: Users },
    { name: "About Us", href: "/about-us", icon: LayoutDashboard },
  ];

  const menuItems = [
    { key: "auth", label: <span>{`Signed in as ${user?.username}`}</span> },
    { key: "profile", label: "My Profile", href: "/profile" },
    { key: "Groups", label: "My Groups", href: "/groups" },
    {
      key: "logout",
      label: <p className="text-danger">Log Out</p>,
      onClick: handleSignOut,
    },
  ];

  return (
    <Navbar
      height={"4rem"}
      shouldHideOnScroll
      isBordered={false}
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      className="bg-[#f6ecd9]/90 hover:bg-[#f6ecd9]/95 backdrop-blur-md transition-colors duration-300 shadow-none border-none"
      classNames={{
        wrapper: "max-w-full px-4",
      }}
    >
      <NavbarBrand>
        <Link
          href="/"
          className="text-accent !opacity-100"
          onClick={() => handleNavigation("/")}
        >
          <AcmeLogo />
          <p className="font-bold text-xl text-accent ml-2">KOVARI</p>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden md:flex gap-8" justify="center">
        {navigationItems.map((item) => (
          <NavbarItem key={item.name} isActive={isActiveRoute(item.href)}>
            <Link
              color="foreground"
              href={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2 text-accent hover:text-primary`}
              aria-current={isActiveRoute(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <div className="flex items-center gap-x-2">
          {!isLoaded || profilePhotoLoading ? (
            <Skeleton className="w-8 h-8 rounded-full" />
          ) : isSignedIn ? (
            <DropdownMenu onOpenChange={onAvatarMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="secondary"
                  name={user?.fullName || user?.username || "User"}
                  size="sm"
                  src={profilePhotoUrl || user?.imageUrl}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-4 min-w-[160px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all border-border mr-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex flex-col"
                  >
                    <DropdownMenuItem
                      key={item.key}
                      onClick={item.onClick}
                      className="font-semibold w-full rounded-md px-4 py-1 text-sm text-foreground bg-transparent hover:bg-transparent"
                    >
                      {item.label}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-up">
              <Button className="px-6 h-9 bg-primary text-background rounded-lg">
                Sign Up
              </Button>
            </Link>
          )}
          <button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-pressed={isMenuOpen}
            tabIndex={0}
            className="w-10 h-10 flex items-center justify-center rounded md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsMenuOpen((open) => !open)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsMenuOpen((open) => !open);
              }
            }}
          >
            <HamburgerIcon />
          </button>
        </div>
      </NavbarContent>

      <NavbarMenu className="md:hidden">
        {navigationItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className="w-full flex items-center gap-3 text-accent"
              color="foreground"
              href={item.href}
              onClick={() => handleNavigation(item.href)}
              size="md"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
