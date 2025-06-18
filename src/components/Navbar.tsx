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
  DropdownMenu,
  Avatar,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  Skeleton,
} from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@heroui/react";
import { Compass, MessageCircle, Users, LayoutDashboard } from "lucide-react";
import Spinner from "./Spinner";

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

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    // Hide spinner when route changes
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    setIsNavigating(true);
    router.push(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
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

  const navigationItems = [
    { name: "Features", href: "#features", icon: Compass },
    { name: "How It Works", href: "#working", icon: MessageCircle },
    { name: "Pricing", href: "/pricing", icon: Users },
    { name: "About Us", href: "/about-us", icon: LayoutDashboard },
  ];

  const menuItems = [
    {
      key: "profile",
      label: (
        <div className="h-14 gap-2">
          <p className="font-semibold">Signed in as</p>
          <p className="font-semibold">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      ),
    },
    // {
    //   key: "settings",
    //   label: "My Settings",
    //   onClick: () => handleNavigation("/settings"),
    // },
    // {
    //   key: "team_settings",
    //   label: "Team Settings",
    //   onClick: () => handleNavigation("/team-settings"),
    // },
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
      label: "Log Out",
      className: "text-danger",
      onClick: handleSignOut,
    },
  ];

  return (
    <>
      {/* {isNavigating && <Spinner />} */}
      <Navbar
        shouldHideOnScroll
        isBordered
        onMenuOpenChange={setIsMenuOpen}
        className="backdrop-blur-md"
        classNames={{ wrapper: "max-w-full" }}
      >
        <NavbarBrand>
          <Link
            href="/"
            className="text-foreground !opacity-100"
            onClick={() => handleNavigation("/")}
          >
            <AcmeLogo />
            <p className="font-bold text-xl text-inherit">KOVARI</p>
          </Link>
        </NavbarBrand>

        <NavbarContent className="hidden md:flex gap-8" justify="center">
          {navigationItems.map((item) => (
            <NavbarItem key={item.name} isActive={isActiveRoute(item.href)}>
              <Link
                // color={isActiveRoute(item.href) ? "primary" : "foreground"}
                color={"foreground"}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2 ${
                  isActiveRoute(item.href)
                    ? "text-primary"
                    : "hover:text-primary"
                }`}
                aria-current={isActiveRoute(item.href) ? "page" : undefined}
              >
                {/* <item.icon className="w-4 h-4" /> */}
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent as="div" justify="end">
          {!isLoaded ? (
            <Skeleton className="w-8 h-8 rounded-full" />
          ) : isSignedIn ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="secondary"
                  name={user?.fullName || user?.username || "User"}
                  size="sm"
                  src={user?.imageUrl}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                {menuItems.map((item) => (
                  <DropdownItem
                    key={item.key}
                    className={item.className}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button
              radius="full"
              className="px-8 h-9 bg-primary text-background"
              onPress={() => handleNavigation("/sign-up")}
            >
              Sign Up
            </Button>
          )}
        </NavbarContent>

        <NavbarMenu className="md:hidden">
          {navigationItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                className="w-full flex items-center gap-3"
                color={"foreground"}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                size="md"
              >
                <item.icon className="w-5 h-5" />
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
