import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="hidden lg:flex flex-1 relative h-full min-h-0 items-center justify-center">
      <div className="absolute inset-0 bg-black" />
      {/* Testimonial Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 text-white">
        <blockquote className="text-xl font-medium leading-relaxed mb-8">
          &ldquo;We went from spinning wheels to focused execution, and
          honestly, this platform has 4x-ed our productivity across the
          board.&rdquo;
        </blockquote>
        <div className="space-y-0.5">
          <div className="font-light text-sm">Jasmin Koller</div>
          <div className="text-xs text-gray-300">
            Operations Lead at{" "}
            <span className="underline">Launch Collective</span>
          </div>
        </div>
        {/* Navigation Arrows */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <button
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
