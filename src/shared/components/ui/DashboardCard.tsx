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
    <div className="bg-White border border-[#B2A890] rounded-xl p-5 shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-medium mb-2 text-Black">{title}</h2>

      {loading ? (
        <div className="h-6 w-20 bg-[#D6D1BC] rounded animate-pulse" />
      ) : value !== undefined ? (
        <p className="text-4xl font-bold text-[#004831]">{value}</p>
      ) : count !== undefined ? (
        <p className="text-4xl font-bold text-[#004831]">{count}</p>
      ) : (
        <p className="text-sm text-[#5C6249]">{emptyText}</p>
      )}
    </div>
  );
};

export default DashboardCard;
