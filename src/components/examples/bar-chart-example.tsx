"use client";

import React from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { Moocn, MoocnProvider } from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom-plugin";

const { bars } = uPlot.paths;

const POINT_COUNT = 1000;
const xVals = Array.from({ length: POINT_COUNT }, (_, i) => i);
const yVals = xVals.map(() => Math.round(Math.random() * 1000));
const yMax = Math.max(...yVals);
const uPlotData = [xVals, yVals];

const options: uPlot.Options = {
  scales: {
    x: { time: false },
    y: {
      range: () => [0, yMax],
    },
  },
  plugins: [wheelZoomPlugin({ factor: 0.75 })],
  cursor: { x: false, y: false },
  legend: { show: false },
  axes: [
    {
      stroke: "var(--muted-foreground)",
      ticks: { stroke: "var(--border)" },
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 30,
      gap: 0,
    },
    {
      stroke: "var(--muted-foreground)",
      ticks: { stroke: "var(--border)" },
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 30,
      gap: 0,
    },
  ],
  series: [
    {},
    {
      label: "Random Data",
      stroke: "hsl(var(--chart-1))",
      fill: "hsl(var(--chart-1)/0.2)",
      paths: bars({
        size: [0.6, 100],
        align: 0,
      }),
      width: 2,
    },
  ],
};

export default function BarChartExample() {
  return (
    <MoocnProvider>
      <div className="flex h-full flex-col">
        <MoocnTooltip />
        <Moocn data={uPlotData} options={options} className="h-full w-full" />
        <MoocnLegend />
      </div>
    </MoocnProvider>
  );
}
