"use client";

import React from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { Moocn, MoocnProvider } from "@/registry/components/Moocn";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";
import { createVerticalGradient } from "@/registry/lib/moocn-utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const { spline } = uPlot.paths;

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
    label: "Over the Moon",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "At the Farm",
    color: "hsl(var(--chart-2))",
  },
} as const;

const xVals = chartData.map((_, i) => i);
const overTheMoonVals = chartData.map((d) => d.desktop);
const atTheFarmVals = chartData.map((d) => d.mobile);
const uPlotData = [xVals, overTheMoonVals, atTheFarmVals];

const options = {
  scales: {
    x: { time: false },
    y: { auto: true },
  },
  plugins: [wheelZoomPlugin({ factor: 0.75 })],
  cursor: { x: false, y: false },
  legend: { show: false },
  axes: [
    {
      stroke: "var(--muted-foreground)",
      ticks: { stroke: "var(--border)" },
      size: 30,
      gap: 0,
      values: (u: uPlot, splits: number[]) => {
        return splits.map((val) => {
          const idx = Math.round(val);
          return chartData[idx]?.month ?? "";
        });
      },
    },
    {
      stroke: "var(--muted-foreground)",
      ticks: { stroke: "var(--border)" },
      grid: { stroke: "hsl(var(--border)/50%)" },
      gap: 0,
      show: false,
    },
  ],
  series: [
    {},
    {
      label: chartConfig.desktop.label,
      stroke: chartConfig.desktop.color,
      fill: (u: uPlot, si: number) =>
        createVerticalGradient(
          u,
          "hsl(var(--chart-1)/5%)",
          "hsl(var(--chart-1))"
        ),
      fillAlpha: 0.3,
      width: 2,
      points: { show: false },
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        return spline!()(u, seriesIdx, idx0, idx1);
      },
    },
    {
      label: chartConfig.mobile.label,
      stroke: chartConfig.mobile.color,
      fill: (u: uPlot, si: number) =>
        createVerticalGradient(
          u,
          "hsl(var(--chart-2)/5%)",
          "hsl(var(--chart-2))"
        ),
      fillAlpha: 0.3,
      width: 2,
      points: { show: false },
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        return spline!()(u, seriesIdx, idx0, idx1);
      },
    },
  ],
};

export default function SimpleAreaStacked() {
  return (
    <MoocnProvider>
      <Card>
        <CardHeader>
          <CardTitle>Moo-ving Area Chart</CardTitle>
          <CardDescription>
            Tracking cow behavior from January to June
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <MoocnTooltip />
            <Moocn
              data={uPlotData}
              options={options}
              className="h-full w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            The herd is moo-ving in style!
          </div>
          <div className="leading-none text-muted-foreground">
            Lots of cows jumping over the moon and grazing at the farm.
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}
