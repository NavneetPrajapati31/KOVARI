"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Users, Loader2, User } from "lucide-react"
import type { GroupCardProps } from "@/types/group"

export function GroupCard({ group, onAction, isLoading = false }: GroupCardProps) {
  const [actionLoading, setActionLoading] = useState(false)

  const formatDateRange = () => {
    if (group.dateRange.isOngoing) {
      return "Ongoing"
    }

    const startDate = group.dateRange.start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    if (!group.dateRange.end) {
      return startDate
    }

    const endDate = group.dateRange.end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    return `${startDate} - ${endDate}`
  }

  const formatMemberCount = () => {
    if (group.memberCount === 0) return "No members yet"
    if (group.memberCount === 1) return "1 member"
    if (group.memberCount > 99) return "99+ members"
    return `${group.memberCount} members`
  }

  const getActionButton = () => {
    if (group.userStatus === "member") {
      return { text: "View Group", variant: "default" as const, action: "view" as const }
    }
    if (group.userStatus === "pending") {
      return { text: "Request Pending", variant: "secondary" as const, action: null, disabled: true }
    }
    if (group.userStatus === "blocked") {
      return { text: "Unavailable", variant: "secondary" as const, action: null, disabled: true }
    }
    if (group.privacy === "private" || group.privacy === "invite-only") {
      return { text: "Request to Join", variant: "outline" as const, action: "request" as const }
    }
    return { text: "Join Group", variant: "default" as const, action: "join" as const }
  }

  const getPrivacyBadge = () => {
    const variants: Record<typeof group.privacy, { text: string; className: string }> = {
      public: { text: "PUBLIC", className: "bg-emerald-500 text-white hover:bg-emerald-600" },
      private: { text: "PRIVATE", className: "bg-gray-500 text-white hover:bg-gray-600" },
      "invite-only": { text: "INVITE ONLY", className: "bg-orange-500 text-white hover:bg-orange-600" },
    }
    return variants[group.privacy]
  }

  const handleAction = async () => {
    const buttonConfig = getActionButton()
    if (!buttonConfig.action || buttonConfig.disabled) return

    setActionLoading(true)
    try {
      await onAction(group.id, buttonConfig.action)
    } finally {
      setActionLoading(false)
    }
  }

  const buttonConfig = getActionButton()
  const privacyBadge = getPrivacyBadge()

  if (isLoading) {
    return (
      <Card className="w-full max-w-sm h-[280px] animate-pulse">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm h-[280px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group">
      <CardContent className="p-5 h-full flex flex-col">
        {/* Header with Group Name and Privacy Badge */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1 mr-2" title={group.name}>
            {group.name || "Unnamed Group"}
          </h3>
          <Badge className={`text-xs font-medium uppercase px-2 py-1 ${privacyBadge.className}`}>
            {privacyBadge.text}
          </Badge>
        </div>

        {/* Creator Information */}
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={group.creator.avatar || "/placeholder.svg"} alt={group.creator.name} />
            <AvatarFallback className="bg-gray-100">
              <User className="h-4 w-4 text-gray-500" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Created by</p>
            <p className="text-sm font-medium text-gray-700 truncate" title={group.creator.name}>
              {group.creator.name || "Unknown Creator"}
            </p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate" title={group.destination}>
            {group.destination || "Destination TBD"}
          </span>
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600">{formatDateRange()}</span>
        </div>

        {/* Member Count */}
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{formatMemberCount()}</span>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Button
            onClick={handleAction}
            disabled={buttonConfig.disabled || actionLoading}
            variant={buttonConfig.variant}
            className="w-full"
            size="sm"
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              buttonConfig.text
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
