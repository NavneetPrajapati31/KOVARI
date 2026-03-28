"use client";

import * as React from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Waitlist Signups",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

interface GrowthChartProps {
  data: { date: string; count: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="w-full space-y-2">
      <div className="space-y-0">
        <h2 className="text-md font-semibold tracking-tight text-foreground">Signup Growth</h2>
        <p className="text-sm text-muted-foreground">
          Daily Waitlist Volume (30D)
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[300px] w-full mt-4"
      >
        <AreaChart
          data={data}
          margin={{
            left: -32,
            right: 12,
            top: 10,
            bottom: 24,
          }}
        >
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-count)"
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor="var(--color-count)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid 
            vertical={false} 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border)/0.3)" 
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={48}
            style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              fill: 'hsl(var(--muted-foreground))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em' 
            }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              fill: 'hsl(var(--muted-foreground))' 
            }}
            tickFormatter={(value) => `${value}`}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-count)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={
              <ChartTooltipContent
                className="bg-card shadow-2xl rounded-2xl p-3 min-w-[150px]"
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  });
                }}
                indicator="line"
              />
            }
          />
          <Area
            dataKey="count"
            type="monotone"
            fill="url(#fillCount)"
            stroke="var(--color-count)"
            strokeWidth={3}
            animationDuration={1500}
            activeDot={{ 
              r: 6, 
              fill: "var(--color-count)", 
              stroke: "#fff", 
              strokeWidth: 2,
              className: "shadow-lg" 
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
