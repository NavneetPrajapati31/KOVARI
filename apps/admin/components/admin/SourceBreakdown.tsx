"use client";

import * as React from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Signups",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

interface SourceBreakdownProps {
  data: { source: string; count: number; percentage: string | number }[];
}

export function SourceBreakdown({ data }: SourceBreakdownProps) {
  return (
    <div className="w-full h-full space-y-4 px-6 pt-5">
      <div className="">
        <h2 className="text-md font-semibold tracking-tight text-foreground">Traffic Sources</h2>
        <p className="text-sm text-muted-foreground">
          Top Referral Channels
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[100px] w-full mt-2"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            left: 0,
            right: 0,
          }}
        >
          <CartesianGrid 
            horizontal={false} 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border)/0.3)" 
          />
          <YAxis
            dataKey="source"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            hide
          />
          <XAxis type="number" dataKey="count" hide />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 8 }}
            content={
              <ChartTooltipContent 
                hideLabel 
                indicator="line" 
                className="bg-card border border-border rounded-lg p-3"
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={10}
            barSize={30}
            animationDuration={1500}
          >
            <LabelList
              dataKey="source"
              position="insideLeft"
              offset={12}
              style={{ 
                fill: 'white', 
                fontWeight: 500, 
                fontSize: '10px', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em' 
              }}
            />
            <LabelList
              dataKey="count"
              position="right"
              offset={12}
              style={{ 
                fill: 'hsl(var(--foreground))', 
                fontWeight: 600, 
                fontSize: '15px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
