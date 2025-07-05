import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

interface PendingInviteCardProps {
  group: {
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export function PendingInviteCard({
  group,
  onAccept,
  onDecline,
}: PendingInviteCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {group.destination && (
            <p className="text-sm text-muted-foreground">
              Destination: {group.destination}
            </p>
          )}
          {group.start_date && group.end_date && (
            <p className="text-sm text-muted-foreground">
              {format(new Date(group.start_date), "dd MMM")} to{" "}
              {format(new Date(group.end_date), "dd MMM")}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={onAccept} size="sm">
              Accept
            </Button>
            <Button onClick={onDecline} variant="outline" size="sm">
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
