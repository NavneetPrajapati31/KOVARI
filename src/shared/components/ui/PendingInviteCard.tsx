import { format } from "date-fns";
import { Button } from "@heroui/react";
import { Invite } from "@/shared/hooks/usePendingInvites";

interface Props {
  invite: Invite;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PendingInviteCard({ invite, onAccept, onDecline }: Props) {
  const group = invite.group;
  return (
    <div className="bg-[#ECEABE] border border-[#B2A890] rounded-xl p-4 flex justify-between items-center shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-[#004831]">{group.name}</h3>
        <p className="text-sm text-[#3A3A2C]">
          {group.destination} — {format(new Date(group.trip_dates.from), "dd MMM")} to{" "}
          {format(new Date(group.trip_dates.to), "dd MMM")}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="bg-primary text-white">
          Accept
        </Button>
        <Button size="sm" onClick={onDecline} className="bg-red-600 text-white">
          Decline
        </Button>
      </div>
    </div>
  );
}
