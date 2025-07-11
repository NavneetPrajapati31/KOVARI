import { format } from "date-fns";
import { Button } from "@/shared/components/ui/button";
import { GroupMembership } from "@/shared/hooks/usePendingInvites";

interface Props {
  invite: GroupMembership;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PendingInviteCard({
  invite,
  onAccept,
  onDecline,
}: Props) {
  const group = invite.group;
  return (
    <div className="bg-[#ECEABE] border border-[#B2A890] rounded-xl p-4 flex justify-between items-center shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-[#004831]">{group.name}</h3>
        <p className="text-sm text-[#3A3A2C]">
          {group.destination} —{" "}
          {group.start_date && group.end_date && (
            <>
              {format(new Date(group.start_date), "dd MMM")} to{" "}
              {format(new Date(group.end_date), "dd MMM")}
            </>
          )}
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
