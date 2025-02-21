"use client";

import React from "react";
import { Moocn, MoocnProvider } from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { seriesBarsPlugin } from "@/registry/lib/moocn-bars";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";

const chartData = [
  {
    month: "January",
    s1: 10,
    s2: 15,
    s3: 30,
    s4: 45,
    s5: 50,
    s6: 70,
    s7: 80,
    s8: 85,
    s9: 95,
    s10: 100,
  },
  {
    month: "February",
    s1: 12,
    s2: 18,
    s3: 26,
    s4: 44,
    s5: 56,
    s6: 62,
    s7: 78,
    s8: 88,
    s9: 92,
    s10: 110,
  },
  {
    month: "March",
    s1: 20,
    s2: 25,
    s3: 40,
    s4: 50,
    s5: 60,
    s6: 70,
    s7: 75,
    s8: 82,
    s9: 100,
    s10: 120,
  },
  {
    month: "April",
    s1: 22,
    s2: 28,
    s3: 38,
    s4: 48,
    s5: 68,
    s6: 78,
    s7: 84,
    s8: 90,
    s9: 105,
    s10: 118,
  },
  {
    month: "May",
    s1: 30,
    s2: 35,
    s3: 45,
    s4: 60,
    s5: 70,
    s6: 82,
    s7: 88,
    s8: 95,
    s9: 110,
    s10: 125,
  },
  {
    month: "June",
    s1: 36,
    s2: 40,
    s3: 50,
    s4: 58,
    s5: 75,
    s6: 90,
    s7: 94,
    s8: 100,
    s9: 115,
    s10: 130,
  },
  {
    month: "July",
    s1: 38,
    s2: 45,
    s3: 55,
    s4: 65,
    s5: 80,
    s6: 95,
    s7: 98,
    s8: 105,
    s9: 120,
    s10: 135,
  },
  {
    month: "August",
    s1: 40,
    s2: 50,
    s3: 60,
    s4: 70,
    s5: 85,
    s6: 100,
    s7: 102,
    s8: 110,
    s9: 125,
    s10: 140,
  },
  {
    month: "September",
    s1: 42,
    s2: 55,
    s3: 62,
    s4: 72,
    s5: 88,
    s6: 105,
    s7: 108,
    s8: 118,
    s9: 130,
    s10: 145,
  },
  {
    month: "October",
    s1: 45,
    s2: 58,
    s3: 68,
    s4: 76,
    s5: 90,
    s6: 110,
    s7: 112,
    s8: 120,
    s9: 135,
    s10: 150,
  },
];

const chartConfig = {
  s1: { label: "Series 1", color: "hsl(var(--chart-1))" },
  s2: { label: "Series 2", color: "hsl(var(--chart-2))" },
  s3: { label: "Series 3", color: "hsl(var(--chart-3))" },
  s4: { label: "Series 4", color: "hsl(var(--chart-4))" },
  s5: { label: "Series 5", color: "hsl(var(--chart-5))" },
  s6: { label: "Series 6", color: "hsl(var(--chart-6))" },
  s7: { label: "Series 7", color: "hsl(var(--chart-7))" },
  s8: { label: "Series 8", color: "hsl(var(--chart-8))" },
  s9: { label: "Series 9", color: "hsl(var(--chart-9))" },
  s10: { label: "Series 10", color: "hsl(var(--chart-10))" },
} as const;

const xVals = chartData.map((_, i) => i);

const seriesKeys = Object.keys(chartConfig) as (keyof typeof chartConfig)[];
const seriesVals = seriesKeys.map((k) => chartData.map((d) => d[k]));

const data = [xVals, ...seriesVals];

const options: uPlot.Options = {
  scales: {
    y: {
      range: (u, min, max) => [0, max],
    },
    x: { time: false },
  },
  plugins: [
    seriesBarsPlugin({
      ori: 0,
      dir: 1,
      stacked: true,
      ignore: [],
      radius: 0.1,
      groupWidth: 0.9,
      barWidth: 0.5,
      valueColor: "var(--muted-foreground)",
      showValues: true,
      xAxisStroke: "hsl(var(--foreground)/50%)",
      yAxisStroke: "hsl(var(--foreground)/50%)",
    }),
    wheelZoomPlugin({ factor: 0.75 }),
  ],
  axes: [
    {
      stroke: "var(--muted-foreground)",
      size: 30,
      gap: 0,
      splits: (u, min, max, incr) => {
        return u.data[0].map((_, i: number) => i);
      },
      values: (u: uPlot, splits: number[]) => {
        return splits.map((val) => {
          const idx = Math.round(val);
          return chartData[idx]?.month ?? "";
        });
      },
    },

    {
      stroke: "var(--muted-foreground)",
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 30,
      gap: 0,
    },
  ],
  series: [
    {},

    ...seriesKeys.map((k) => ({
      label: chartConfig[k].label,
      stroke: chartConfig[k].color,
      fill: chartConfig[k].color,
    })),
  ],
  legend: { show: false },
};

export default function MultiseriesBarchartExample() {
  return (
    <MoocnProvider>
      <div className="flex flex-col h-full">
        <MoocnTooltip />
        <Moocn data={data} options={options} className="h-full w-full" />
        {}
      </div>
    </MoocnProvider>
  );
}
