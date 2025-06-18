export interface GroupCardProps {
  group: {
    id: string
    name: string
    privacy: "public" | "private" | "invite-only"
    destination: string
    dateRange: {
      start: Date
      end?: Date
      isOngoing: boolean
    }
    memberCount: number
    userStatus: "member" | "pending" | "blocked" | null
    creator: {
      name: string
      avatar?: string
    }
  }
  onAction: (groupId: string, action: "view" | "request" | "join") => Promise<void>
  isLoading?: boolean
} 