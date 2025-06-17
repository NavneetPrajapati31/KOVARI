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
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Compass, MessageCircle, Users } from "lucide-react";

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
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const handleItemClick = (href: string) => {
    setActiveItem(href);
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
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Chats", href: "/chat", icon: MessageCircle },
    { name: "Groups", href: "/create-group", icon: Users },
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
    {
      key: "settings",
      label: "My Settings",
      onClick: () => router.push("/settings"),
    },
    {
      key: "team_settings",
      label: "Team Settings",
      onClick: () => router.push("/team-settings"),
    },
    {
      key: "analytics",
      label: "Analytics",
      onClick: () => router.push("/analytics"),
    },
    {
      key: "system",
      label: "System",
      onClick: () => router.push("/system"),
    },
    {
      key: "configurations",
      label: "Configurations",
      onClick: () => router.push("/configurations"),
    },
    {
      key: "help_and_feedback",
      label: "Help & Feedback",
      onClick: () => router.push("/help"),
    },
    {
      key: "logout",
      label: "Log Out",
      className: "text-danger",
      onClick: handleSignOut,
    },
  ];

  return (
    <Navbar
      shouldHideOnScroll
      isBordered
      onMenuOpenChange={setIsMenuOpen}
      className="backdrop-blur-md"
      classNames={{ wrapper: "max-w-full" }}
    >
      <NavbarBrand>
        <Link href="/" className="text-foreground !opacity-100">
          <AcmeLogo />
          <p className="font-bold text-xl text-inherit">KOVARI</p>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-10" justify="center">
        {navigationItems.map((item) => (
          <NavbarItem key={item.name} isActive={isActiveRoute(item.href)}>
            <Link
              color={activeItem === item.href ? "primary" : "foreground"}
              href={item.href}
              onClick={() => handleItemClick(item.href)}
              className={`font-medium transition-all duration-300 ease-in-out flex items-center gap-2 ${
                activeItem === item.href
                  ? "text-primary font-semibold"
                  : "hover:text-primary"
              }`}
              aria-current={activeItem === item.href ? "page" : undefined}
            >
              <item.icon className="w-4 h-4" />
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
            variant="outline"
            size="default"
            className="rounded-full px-6 hover:bg-muted"
            onClick={() => router.push("/sign-up")}
          >
            Sign Up
          </Button>
        )}
      </NavbarContent>

      <NavbarMenu>
        {navigationItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className="w-full flex items-center gap-2"
              color={"foreground"}
              href={item.href}
              size="lg"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {!isSignedIn && (
          <>
            <NavbarMenuItem>
              <Link
                className="w-full"
                color={"primary"}
                href="/sign-in"
                size="lg"
              >
                Sign In
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Link
                className="w-full"
                color={"primary"}
                href="/sign-up"
                size="lg"
              >
                Sign Up
              </Link>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="sm:hidden"
      />
    </Navbar>
  );
}
