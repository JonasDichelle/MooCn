"use client";

import React from "react";
import {
  Moocn,
  MoocnProvider,
  MoocnLegendContent,
  MoocnTooltip,
} from "../Moocn";

import { seriesBarsPlugin } from "../plugins/seriesBarsPlugin.js";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} as const;

const xVals = chartData.map((_, i) => i);
const desktopVals = chartData.map((d) => d.desktop);
const mobileVals = chartData.map((d) => d.mobile);

const data = [xVals, desktopVals, mobileVals];

const options = {
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
      stacked: false,
      ignore: [],
      radius: 0.1,
      groupWidth: 0.8,
      barWidth: 0.95,
      valueColor: "var(--muted-foreground)",
      showValues: false,
      xAxisStroke: "hsl(var(--foreground)/50%)",
      yAxisStroke: "hsl(var(--foreground)/50%)",
    }),
  ],
  axes: [
    {
      stroke: "var(--muted-foreground)",
      size: 30,
      gap: 0,

      splits: (u, min, max, incr) => {
        let len = u.data[0].length;
        return Array.from({ length: len }, (_, i) => i);
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
    {
      label: chartConfig.desktop.label,
      stroke: chartConfig.desktop.color,
      fill: "hsl(var(--chart-1))",
    },
    {
      label: chartConfig.mobile.label,
      stroke: chartConfig.mobile.color,
      fill: "hsl(var(--chart-2))",
    },
  ],

  legend: { show: false },
};

export default function BarChartExample() {
  return (
    <MoocnProvider>
      <div className="flex flex-col h-full">
        <MoocnTooltip />
        <Moocn data={data} options={options} className="h-full w-full" />
        <MoocnLegendContent />
      </div>
    </MoocnProvider>
  );
}
