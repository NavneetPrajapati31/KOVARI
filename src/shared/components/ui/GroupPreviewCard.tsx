import React from "react";
import Link from "next/link";
import { Group } from "@/shared/hooks/useUserGroups";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { format } from "date-fns";

interface Props {
  group: Group;
}

export default function GroupPreviewCard({ group }: Props) {
  if (!group.group) return null;

  const { name, destination, start_date, end_date } = group.group;

  return (
    <Card className="w-full bg-background">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {destination && (
            <p className="text-sm text-muted-foreground">
              Destination: {destination}
            </p>
          )}
          {start_date && end_date && (
            <p className="text-sm text-muted-foreground">
              {format(new Date(start_date), "dd MMM")} →{" "}
              {format(new Date(end_date), "dd MMM")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
