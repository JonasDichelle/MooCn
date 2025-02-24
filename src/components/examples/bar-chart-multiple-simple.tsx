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
  MoocnOptions,
  MoocnProvider,
} from "@/registry/components/Moocn";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { MoocnLegend } from "@/registry/components/MoocnLegend";

import { multiBarPlugin } from "@/registry/lib/moocn-multi-bars";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";

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

export function BarChartMultipleSimple() {
  const xVals = chartData.map((_, i) => i);
  const overTheMoonVals = chartData.map((d) => d.desktop);
  const atTheFarmVals = chartData.map((d) => d.mobile);

  const moocnData = [xVals, overTheMoonVals, atTheFarmVals];

  const moocnSeries: uPlot.Series[] = [
    {},
    {
      label: chartConfig.desktop.label,
      stroke: chartConfig.desktop.color,
      fill: chartConfig.desktop.color,
    },
    {
      label: chartConfig.mobile.label,
      stroke: chartConfig.mobile.color,
      fill: chartConfig.mobile.color,
    },
  ];

  const moocnOptions: MoocnOptions = {
    scales: {
      x: {
        time: false,
        range: (u, min, max) => [min - 0.5, max + 0.5],
      },
      y: {
        range: (u, min, max) => [0, max],
      },
    },

    legend: { show: false },
    cursor: { x: false, y: false },

    select: { show: false },
    plugins: [
      multiBarPlugin({
        stacked: false,
        ignore: [],
        groupWidth: 0.8,
        barWidth: 0.9,
        radius: 0.2,
        showValues: false,
        valueColor: "var(--muted-foreground)",
      }),
    ],

    axes: [
      {
        incrs: [1],
        stroke: "var(--muted-foreground)",
        ticks: {
          show: false,
          stroke: "var(--border)",
        },
        grid: {
          show: false,
        },
        size: 30,
        gap: 10,
        values: (u, splits) => {
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
          <CardTitle>Cow Chart - Jumping Stats</CardTitle>
          <CardDescription>Milking Season: January - June 2024</CardDescription>
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
            Moo-ving up by 5.2% this season <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Counting the cows that jumped over the moon and grazed at the farm
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}
