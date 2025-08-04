import { Globe } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  count?: number;
  value?: string | number;
  loading?: boolean;
  emptyText?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  count,
  value,
  loading,
  emptyText = "No data available",
}) => {
  return (
    <div className="bg-card rounded-xl p-3 shadow-sm transition min-w-[200px]">
      {/* <div className="w-8 h-8 bg-card rounded-lg border-border border flex items-center justify-center mb-2">
        <Globe className="h-4 w-4 text-foreground" />
      </div> */}
      <h2 className="text-xs font-medium mb-0.5 text-foreground">{title}</h2>

      {loading ? (
        <div className="h-6 w-20 bg-muted-foreground rounded animate-pulse" />
      ) : value !== undefined ? (
        <p className="text-sm font-bold text-foreground">{value}</p>
      ) : count !== undefined ? (
        <p className="text-sm font-bold text-foreground">{count}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
};

export default DashboardCard;
