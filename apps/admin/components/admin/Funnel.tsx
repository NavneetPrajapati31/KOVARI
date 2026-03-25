import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/admin-lib/utils";
import { ArrowDown } from "lucide-react";

interface FunnelProps {
  data: {
    views: number;
    clicks: number;
    submissions: number;
  };
}

export function Funnel({ data }: FunnelProps) {
  const steps = [
    { label: "Landing Views", value: data.views, color: "from-blue-400 to-blue-600" },
    { label: "Waitlist Clicks", value: data.clicks, color: "from-blue-500 to-blue-700" },
    { label: "Submissions", value: data.submissions, color: "from-blue-600 to-blue-800" },
  ];

  const total = steps[0].value || 1;

  return (
    <Card className="border-border/50 ios-shadow overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold tracking-tight font-sans">Conversion Funnel</CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground">User journey from view to submission</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-8">
        {steps.map((step, i) => {
          const nextStep = steps[i + 1];
          const conversionRate = nextStep && step.value > 0 
            ? Math.round((nextStep.value / step.value) * 100) 
            : 0;
          const percentageOfTotal = Math.round((step.value / total) * 100);

          return (
            <div key={step.label} className="relative group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-0.5">{step.label}</span>
                  <span className="text-2xl font-bold tracking-tighter text-foreground font-sans">{step.value.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                    {percentageOfTotal}% of total
                  </span>
                </div>
              </div>
              
              <div className="h-4 w-full bg-muted/30 rounded-full overflow-hidden border border-border/10 p-0.5">
                <div 
                  className={cn("h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r shadow-sm", step.color)} 
                  style={{ width: `${percentageOfTotal}%` }}
                />
              </div>

              {nextStep && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className="bg-background/80 backdrop-blur-sm border border-border/50 text-[10px] font-bold text-primary px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                    <ArrowDown className="h-3 w-3" />
                    {conversionRate}% Conversion
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
