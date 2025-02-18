"use client";

import React from "react";
import {
  Moocn,
  MoocnProvider,
  MoocnLegendContent,
  MoocnTooltip,
  createVerticalGradient,
} from "../Moocn";
import { wheelZoomPlugin } from "../wheelZoomPlugin";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { seriesBarsPlugin } from "../plugins/seriesBarsPlugin.js";

function rectShape(u, seriesIdx, idx, cx, cy) {
  if (u.cursor.idx !== idx) return;

  const b = u.series[seriesIdx].points.bbox(u, seriesIdx);
  const { left, top, width, height } = b;

  if (width <= 0 || height <= 0) return;

  u.ctx.fillStyle = "rgba(255,255,255,0.25)";

  u.ctx.fillRect(left, top, width, height);
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

function monthValues(u, splits) {
  return splits.map((i) => chartData[i]?.month ?? "");
}

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

export default function BarChartExample() {
  const options = React.useMemo(() => {
    return {
      scales: {
        y: {
          range: (u, min, max) => [0, max],
        },
        x: { time: true },
      },
      plugins: [
        seriesBarsPlugin({
          ori: 0,
          dir: 1,
          stacked: false,
          ignore: [],
          radius: 0.1,
        }),
      ],
      axes: [
        {
          stroke: "var(--foreground)",
          ticks: { stroke: "var(--border)" },
          grid: { stroke: "hsl(var(--border)/50%)" },
          size: 40,
          gap: 0,

          monthValues,
        },
        {
          stroke: "var(--foreground)",
          ticks: { stroke: "var(--border)" },
          grid: { stroke: "hsl(var(--border)/50%)" },
          size: 40,
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

      cursor: {
        points: {
          shape: rectShape,

          size: 0,
          width: 0,
        },
      },
      legend: { show: false },
    };
  }, []);

  return (
    <MoocnProvider>
      <div className="flex flex-col gap-4 h-full">
        <MoocnTooltip />
        <Moocn data={data} options={options} className="h-full w-full" />
        <MoocnLegendContent />
      </div>
    </MoocnProvider>
  );
}
