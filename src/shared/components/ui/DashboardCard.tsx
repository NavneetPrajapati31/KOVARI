import React from "react";

interface DashboardCardProps {
  title: string;
  value?: string | number;
  count?: number;
  loading?: boolean;
  emptyText?: string;
}

export default function DashboardCard({
  title,
  value,
  count,
  loading,
  emptyText,
}: DashboardCardProps) {
  return (
    <div className="bg-background border border-border rounded-xl p-5 shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-medium mb-2 text-primary">{title}</h2>
      {loading ? (
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      ) : value !== undefined ? (
        <p className="text-4xl font-bold text-primary">{value}</p>
      ) : count !== undefined ? (
        <p className="text-4xl font-bold text-primary">{count}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}
