"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {
  Moocn,
  MoocnProvider,
  MoocnOptions,
} from "@/registry/components/Moocn";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const xVals = chartData.map((_, i) => i);
const desktopVals = chartData.map((d) => d.desktop);
const moocnData = [xVals, desktopVals];

interface SingleLineChartProps {
  pathType?: "smooth" | "linear" | "stepped";
}

export function SimpleLineChart({ pathType = "smooth" }: SingleLineChartProps) {
  function getLinePath() {
    switch (pathType) {
      case "stepped":
        return uPlot.paths.stepped!({
          align: 1,
          alignGaps: 0,
          ascDesc: false,
          extend: false,
        });
      case "linear":
        return uPlot.paths.linear!();
      default:
        return uPlot.paths.spline!();
    }
  }

  const capitalizedPathType =
    pathType.charAt(0).toUpperCase() + pathType.slice(1);

  const moocnSeries: uPlot.Series[] = [
    {},
    {
      label: "Field Data",
      stroke: "hsl(var(--chart-1))",
      width: 2,
      points: { show: false },
      paths: (u, seriesIdx, idx0, idx1) => {
        return getLinePath()(u, seriesIdx, idx0, idx1);
      },
    },
  ];

  const moocnOptions: MoocnOptions = {
    scales: {
      x: {
        time: false,
        range: (u, min, max) => [min - 0.25, max + 0.25],
      },
      y: {
        range: (u, min, max) => [0, max],
      },
    },

    legend: { show: false },
    select: { show: false },
    plugins: [wheelZoomPlugin({ factor: 0.75 })],

    axes: [
      {
        stroke: "var(--muted-foreground)",
        ticks: { show: false },
        grid: { show: false },
        size: 30,
        gap: 8,
        values: (_u, splits) => {
          return splits.map((idx) => {
            const i = Math.round(idx);
            const m = chartData[i]?.month ?? "";
            return m.slice(0, 3);
          });
        },
      },
      {
        stroke: "var(--muted-foreground)",
        ticks: { stroke: "var(--border)" },
        grid: { stroke: "hsl(var(--border)/50%)" },
        size: 30,
        gap: 0,
      },
    ],

    series: moocnSeries,
  };

  return (
    <MoocnProvider>
      <Card>
        <CardHeader>
          <CardTitle>{capitalizedPathType} Line Chart</CardTitle>
          <CardDescription>Grazing Season: January - June 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <MoocnTooltip />
            <Moocn
              data={moocnData}
              options={moocnOptions}
              className="h-full w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Grazing output up by 5.2% this season{" "}
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Data collected from our pasture.
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}
