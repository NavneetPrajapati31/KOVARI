import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";

export default function DangerPage() {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danger Zone</h1>
        <p className="text-muted-foreground">
          Irreversible and destructive actions for this group.
        </p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Leave Group
          </CardTitle>
          <CardDescription>
            Leave this group. You can rejoin if you have an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Group
          </CardTitle>
          <CardDescription>
            Permanently delete this group and all its data. This action cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
