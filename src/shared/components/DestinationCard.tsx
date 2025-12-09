"use client";

import React from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";

interface DestinationCardProps {
  id: string;
  title: string;
  image: string;
  location: string;
  description?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export default function DestinationCard({
  id,
  title,
  image,
  location,
  description,
  isFavorite = false,
  onFavoriteToggle,
}: DestinationCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    // Navigate to explore page with pre-filled destination
    router.push(`/explore?destination=${encodeURIComponent(title)}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    onFavoriteToggle?.(id);
  };

  return (
    <div 
      className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-white rounded-3xl overflow-hidden border-0 shadow-lg hover:shadow-blue-100/50"
      onClick={handleCardClick}
    >
      {/* Image Container - Fills entire card top */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Heart Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 border-0"
        >
          <Heart 
            className={`w-5 h-5 transition-colors duration-200 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            }`} 
          />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Location */}
        <div className="text-sm font-semibold text-blue-600 tracking-wide">
          {location}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
