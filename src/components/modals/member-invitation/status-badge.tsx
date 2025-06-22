import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "online" | "away" | "inactive"
  statusDetail?: string
  className?: string
}

export function StatusBadge({ status, statusDetail, className }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      label: "Online",
      className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
    },
    away: {
      label: statusDetail ? `Away (${statusDetail})` : "Away",
      className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
    },
    inactive: {
      label: statusDetail ? `Inactive (${statusDetail})` : "Inactive",
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn("px-2 py-1 text-xs font-medium border rounded-md", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
