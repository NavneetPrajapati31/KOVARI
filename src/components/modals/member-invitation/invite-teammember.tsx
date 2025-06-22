"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Link2 } from "lucide-react"
import { UserTagInput } from "./user-tag-input"
import { TeammateRow } from "./teammate-row"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Teammate extends User {
  status: "online" | "away" | "inactive"
  statusDetail?: string
}

interface InviteTeammatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const mockTeammates: Teammate[] = [
  {
    id: "1",
    name: "Arlo Finch",
    email: "arlofinch@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
  },
  {
    id: "2",
    name: "Juniper Lane",
    email: "juniperlane@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    statusDetail: "2 mins",
  },
  {
    id: "3",
    name: "Rowan Sage",
    email: "rowansage@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    statusDetail: "2 days",
  },
  {
    id: "4",
    name: "Finnian York",
    email: "finnianyork@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
    statusDetail: "1 year",
  },
]

const availableUsers: User[] = [
  {
    id: "5",
    name: "Richard Winson",
    email: "richard.winson@company.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  { id: "6", name: "Tedd Morrison", email: "tedd.morrison@company.com" },
  { id: "7", name: "Alex Morgan", email: "alex.morgan@company.com" },
  { id: "8", name: "Jordan Lee", email: "jordan.lee@company.com" },
]

export function InviteTeammatesModal({ open, onOpenChange }: InviteTeammatesModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([
    {
      id: "5",
      name: "Richard Winson",
      email: "richard.winson@company.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ])
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to invite.",
        variant: "destructive",
      })
      return
    }

    setIsInviting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Invitations sent!",
      description: `Successfully sent invitations to ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}.`,
    })

    setSelectedUsers([])
    setIsInviting(false)
    onOpenChange(false)
  }

  const handleGetLink = async () => {
    const inviteLink = "https://company.com/invite/abc123"

    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Invite Teammates</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 space-y-4">
          {/* Tag Input with Invite Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <UserTagInput
                availableUsers={availableUsers}
                selectedUsers={selectedUsers}
                onSelectionChange={setSelectedUsers}
                placeholder="Search users..."
              />
            </div>
            <Button
              onClick={handleInvite}
              disabled={selectedUsers.length === 0 || isInviting}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-full"
            >
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </div>

          {/* Shareable Link Section */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Link2 className="h-5 w-5 text-gray-600" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Shareable Link is now Live!</h3>
                  <p className="text-sm text-gray-500">Create and get shareable link for this file.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetLink}
                className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg text-sm"
              >
                Get Link
              </Button>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="px-6 pb-6 pt-2">
          <div className="space-y-1">
            {mockTeammates.map((teammate) => (
              <TeammateRow key={teammate.id} teammate={teammate} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
