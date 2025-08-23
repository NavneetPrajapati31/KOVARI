// -----------------------------------------------------------------------------
//   File : Group Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/GroupMatchCard.tsx

"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  Eye, 
  Loader2,
  Plane,
  Globe,
  Star,
  TrendingUp,
  ThumbsDown,
  ThumbsUp,
  User,
  Building2,
  Users2,
  Heart,
  MessageSquare,
  Sparkles,
  Moon,
  Scale,
  User as UserIcon,
  Ban,
  Beer,
  Wine,
  Coffee as CoffeeIcon,
  Cigarette
} from "lucide-react";

interface GroupMatchCardProps {
  group: any;
  onJoinGroup: (groupId: string) => Promise<void>;
  onRequestJoin: (groupId: string) => Promise<void>;
  onPass: (groupId: string) => Promise<void>;
  onViewGroup: (groupId: string) => void;
}

export function GroupMatchCard({
  group,
  onJoinGroup,
  onRequestJoin,
  onPass,
  onViewGroup
}: GroupMatchCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isPassing, setIsPassing] = useState(false);

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      await onJoinGroup(group.id);
    } finally {
      setIsJoining(false);
    }
  };

  const handleRequestJoin = async () => {
    setIsRequesting(true);
    try {
      await onRequestJoin(group.id);
    } finally {
      setIsRequesting(false);
    }
  };

  const handlePass = async () => {
    setIsPassing(true);
    try {
      await onPass(group.id);
    } finally {
      setIsPassing(false);
    }
  };

  const handleViewGroup = () => {
    onViewGroup(group.id);
  };

  const formatDateRange = () => {
    if (!group.startDate && !group.endDate) return "Dates TBD";
    
    const startDate = group.startDate ? new Date(group.startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) : "TBD";
    
    const endDate = group.endDate ? new Date(group.endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) : "TBD";
    
    return `${startDate} - ${endDate}`;
  };

  const getTripLengthDays = () => {
    if (!group.startDate || !group.endDate) return null;
    const start = new Date(group.startDate).getTime();
    const end = new Date(group.endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return null;
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const getGroupTypeIcon = (privacy?: string) => {
    switch (privacy?.toLowerCase()) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Building2 className="w-4 h-4" />;
      default: return <Users2 className="w-4 h-4" />;
    }
  };

  const getGroupTypeColor = (privacy?: string) => {
    switch (privacy?.toLowerCase()) {
      case 'public': return "bg-green-100 text-green-700";
      case 'private': return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Derived display values for Bumble-like sections
  const aboutText = (() => {
    const parts: string[] = [];
    if (group.creator?.name) parts.push(`Created by ${group.creator.name}`);
    if (group.memberCount) parts.push(`${group.memberCount} members`);
    if (group.destination) parts.push(`Traveling to ${group.destination}`);
    return parts.length > 0 ? parts.join('. ') + '.' : 'Join this amazing travel group!';
  })();

  const travelStyleTags = (() => {
    const candidates = ['cultural', 'foodie', 'photography', 'adventure', 'nature', 'nightlife', 'history', 'beach'];
    const interests = (group.tags || []).map((i: string) => i.toLowerCase());
    const filtered = interests.filter((i: string) => candidates.includes(i));
    const tags = (filtered.length > 0 ? filtered : interests).slice(0, 3);
    return tags;
  })();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Full-screen card container */}
      <Card className="w-full h-full flex flex-col shadow-xl overflow-hidden">
        <CardContent className="p-3 space-y-2">
          
          {/* Header Section - Group Info */}
          <div className="flex items-start gap-4 pb-2 border-b border-gray-200">
            {/* Group Avatar - Stays on the left */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-10 h-10 text-white" />
            </div>

            {/* Main Content Area - A single column for all text info */}
            <div className="flex-1 flex flex-col justify-start space-y-0.5 min-h-0">
              
              {/* --- ROW 1: Group Name and Privacy Badge --- */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {group.name || "Travel Group"}
                </h1>
                <Badge variant="outline" className={`text-xs ${getGroupTypeColor(group.privacy)}`}>
                  {getGroupTypeIcon(group.privacy)}
                  <span className="ml-1 capitalize">{group.privacy || 'public'}</span>
                </Badge>
              </div>

              {/* --- ROW 2: Creator/Size aligned with Destination --- */}
              <div className="flex items-center justify-between w-full">
                {/* Left side of row 2 */}
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  {group.creator?.name && <span className="capitalize">{group.creator.name}</span>}
                  {group.creator?.name && <span>•</span>}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.memberCount || 0} members
                  </span>
                </div>
                {/* Right side of row 2 */}
                <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {group.destination || "Destination"}
                </div>
              </div>

              {/* --- ROW 3: Group Type aligned with Dates --- */}
              <div className="flex items-center justify-between w-full">
                {/* Left side of row 3 */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{getGroupTypeIcon(group.privacy)}</span>
                  <span className="text-sm capitalize text-gray-700">{group.privacy || 'public'} group</span>
                </div>
                {/* Right side of row 3 */}
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateRange()}
                </div>
              </div>

            </div>
          </div>

          {/* Bumble-like sections */}
          <div className="space-y-3">
            {/* Trip Summary */}
            <div className="rounded-xl border border-gray-200 p-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                  <Plane className="w-4 h-4" />
                </span>
                Trip Summary
              </h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Budget</div>
                  <div className="font-medium text-gray-900">
                    {group.budget ? `₹${group.budget.toLocaleString()}` : "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Trip length</div>
                  <div className="font-medium text-gray-900">
                    {getTripLengthDays() ? `${getTripLengthDays()} days` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Members</div>
                  <div className="font-medium text-gray-900">{group.memberCount || 0}</div>
                </div>
              </div>
            </div> 

            {/* About */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">About</h3>
              <p className="text-sm text-gray-700 leading-6">{aboutText}</p>
            </div>

            {/* Travel Style */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Travel Style</h3>
              <div className="flex flex-wrap gap-2">
                {travelStyleTags.length > 0 ? travelStyleTags.map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 capitalize">
                    {tag}
                  </span>
                )) : (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">explorer</span>
                )}
              </div>
            </div>

            {/* Group Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Group Details</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Creator</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {group.creator?.name || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Privacy</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {group.privacy || 'public'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {group.userStatus || 'Open'}
                  </div>
                </div>
              </div>
            </div>

            {/* Group Tags */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Group Tags</h3>
              <div className="flex flex-wrap gap-2">
                {(group.tags || []).slice(0, 6).map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-700 capitalize">
                    {tag}
                  </span>
                ))}
                {(!group.tags || group.tags.length === 0) && (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-700">none added</span>
                )}
              </div>
            </div>         
          </div>

          {/* Action Buttons - Bottom */}
          <div className="flex space-x-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePass}
              disabled={isPassing}
              className="flex-1 py-2 text-sm border-red-200 text-red-600 hover:bg-red-50 rounded-full"
            >
              {isPassing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleViewGroup}
              className="flex-1 py-2 text-sm rounded-full"
            >
              <Eye className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestJoin}
              disabled={isRequesting}
              className="flex-1 py-2 text-sm border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full"
            >
              {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="flex-1 py-2 text-sm rounded-full"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
