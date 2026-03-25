import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/admin-lib/utils";

interface FunnelProps {
  data: {
    views: number;
    clicks: number;
    submissions: number;
  };
}

export function Funnel({ data }: FunnelProps) {
  const steps = [
    { label: "Landing Views", value: data.views, color: "bg-muted" },
    { label: "Waitlist Clicks", value: data.clicks, color: "bg-primary/20" },
    { label: "Submissions", value: data.submissions, color: "bg-primary" },
  ];

  return (
    <Card className="col-span-1 md:col-span-1">
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Visualizing the signup journey</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 mt-4">
        {steps.map((step, i) => {
          const nextStep = steps[i + 1];
          const dropoffPerc = nextStep && step.value > 0 
            ? Math.round((nextStep.value / step.value) * 100) 
            : 0;

          return (
            <div key={step.label} className="relative">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium">{step.label}</span>
                <span className="text-xl font-bold">{step.value.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", step.color)} 
                  style={{ width: `${steps[0].value > 0 ? (step.value / steps[0].value) * 100 : 0}%` }}
                />
              </div>
              {nextStep && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground bg-background px-2 py-0.5 border rounded-full z-10">
                  {dropoffPerc}% conversion
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
