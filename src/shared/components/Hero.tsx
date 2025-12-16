"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { Toggle } from "@/shared/components/ui/toggle";

export default function Hero() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="backdrop-blur-md bg-white/20 rounded-full px-6 py-3 shadow-lg border border-white/30">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="text-white font-bold text-xl">INDOTRAVI</div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white hover:text-white/80 transition-colors font-medium">
                About
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors font-medium">
                Services
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors font-medium">
                Tour
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors font-medium">
                Contact
              </a>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="hidden md:flex items-center space-x-2">
                <Toggle className="text-white hover:bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
                  De
                </Toggle>
                <Toggle pressed className="text-white bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
                  En
                </Toggle>
              </div>

              {/* Login Button */}
              <Button
                variant="secondary"
                className="hidden md:block bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-full px-4 py-2"
              >
                Login
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-white/95 backdrop-blur-md">
                  <div className="flex flex-col space-y-4 mt-8">
                    <a href="#" className="text-lg font-medium">
                      About
                    </a>
                    <a href="#" className="text-lg font-medium">
                      Services
                    </a>
                    <a href="#" className="text-lg font-medium">
                      Tour
                    </a>
                    <a href="#" className="text-lg font-medium">
                      Contact
                    </a>
                    <div className="flex items-center space-x-2 pt-4">
                      <Toggle className="rounded-full px-3 py-1.5">De</Toggle>
                      <Toggle pressed className="rounded-full px-3 py-1.5 bg-primary">En</Toggle>
                    </div>
                    <Button className="mt-4 rounded-full">Login</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image src="https://images.pexels.com/photos/33610936/pexels-photo-33610936.jpeg" alt="Mountain Lake" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-6">
            <div>Extraordinary natural and</div>
            <div>cultural charm</div>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">Exploring Indonesia is an unforgettable adventure.</p>
        </div>
      </section>


     
     
    </div>
  );
}

