import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@kovari/utils";

interface EmailHealthProps {
  sent: number;
  pending: number;
  avgDelayMinutes: number;
}

export function EmailHealth({ sent, pending, avgDelayMinutes }: EmailHealthProps) {
  const isHealthy = pending < 10;
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Pipeline Health</CardTitle>
            <CardDescription>Status of confirmation email delivery</CardDescription>
          </div>
          {isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isHealthy && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Warning: High volume of pending emails ({pending}). Check CRON job logs.</span>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Delivered</p>
            <p className="text-2xl font-bold">{sent.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Queued</p>
            <p className={cn("text-2xl font-bold", !isHealthy && "text-amber-600")}>
              {pending.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground font-medium">Avg Delay</p>
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{avgDelayMinutes}m</p>
          </div>
        </div>

        <div className="mt-6 h-2 w-full bg-muted rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500" 
            style={{ width: `${(sent / (sent + pending || 1)) * 100}%` }} 
          />
          <div 
            className="h-full bg-amber-500" 
            style={{ width: `${(pending / (sent + pending || 1)) * 100}%` }} 
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
           <span>{Math.round((sent / (sent + pending || 1)) * 100)}% Success Rate</span>
           <span>Reliability Threshold: 98%</span>
        </div>
      </CardContent>
    </Card>
  );
}

