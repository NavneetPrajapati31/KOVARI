"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Clock, Users } from "lucide-react"

interface GroupInvite {
    id: string
    groupName: string
    creator: {
      name: string
      avatar: string
      initials: string
    }
    destination?: string
    dates?: string
    description: string
    teamMembers: {
      avatar: string
      initials: string
      color: string
    }[]
    acceptedCount: number
    expiresInDays: number
    inviteDate: string
  }
  

interface GroupInviteCardProps {
  invite: GroupInvite
  onAccept: () => void
  onDecline: () => void
}

export function GroupInviteCard({ invite, onAccept, onDecline }: GroupInviteCardProps) {
  const remainingMembers = Math.max(0, invite.acceptedCount - invite.teamMembers.length)

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-lg p-1 rounded-md">
      <CardContent className="p-6">
        {/* Date Header */}
        <div className="text-sm text-gray-500 mb-4">{invite.inviteDate}</div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending invite</h2>

        {/* Creator Avatar */}
        <div className="flex justify-center mb-4">
          <Avatar className="w-16 h-16 bg-blue-500">
            <AvatarImage src={invite.creator.avatar || "/placeholder.svg"} alt={invite.creator.name} />
            <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
              {invite.creator.initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Invitation Text */}
        <div className="text-center mb-4">
          <p className="text-lg text-gray-900 mb-2">
            <span className="font-semibold">{invite.creator.name}</span> invited you to the project
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-3">"{invite.groupName}"</p>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">{invite.description}</p>

        {/* Destination and Dates */}
        {(invite.destination || invite.dates) && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6 text-sm text-gray-600">
            {invite.destination && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{invite.destination}</span>
              </div>
            )}
            {invite.dates && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{invite.dates}</span>
              </div>
            )}
          </div>
        )}

        {/* Team Members */}
        <div className="flex justify-center mb-4">
          <div className="flex -space-x-2">
            {invite.teamMembers.map((member, index) => (
              <Avatar key={index} className={`w-8 h-8 border-2 border-white ${member.color}`}>
                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={`Team member ${member.initials}`} />
                <AvatarFallback className={`${member.color} text-white text-xs font-semibold`}>
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingMembers > 0 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-600">+{remainingMembers}</span>
              </div>
            )}
          </div>
        </div>

        {/* Acceptance Status */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            {invite.acceptedCount} from your team have already accepted
          </p>
        </div>

        {/* Expiration Notice */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" />
            Your invitation expires in {invite.expiresInDays} days
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onDecline}
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </Button>
          <Button onClick={onAccept} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white">
            Accept invitation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
