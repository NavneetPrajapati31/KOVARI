import { Globe, TrendingUp } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  count?: number;
  value?: string | number;
  loading?: boolean;
  emptyText?: string;
  subtitle?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  count,
  value,
  loading,
  emptyText = "No data available",
  subtitle,
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-none transition h-full">
      {/* <div className="w-8 h-8 bg-card rounded-lg border-border border flex items-center justify-center mb-2">
        <Globe className="h-4 w-4 text-foreground" />
      </div> */}
      <h2 className="text-xs font-medium mb-0.5 text-foreground">{title}</h2>
      {/* <p className="text-xs text-muted-foreground">{subtitle}</p> */}

      {loading ? (
        <div className="h-6 w-20 bg-muted-foreground rounded animate-pulse" />
      ) : value !== undefined ? (
        <div className="flex flex-row justify-between">
          <p className="text-sm font-extrabold text-foreground">{value}</p>
          {title === "Profile Impressions" && (
            <div className="flex flex-row items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-extrabold text-primary">5%</span>
            </div>
          )}
        </div>
      ) : count !== undefined ? (
        <p className="text-sm font-bold text-foreground">{count}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
};

export default DashboardCard;
