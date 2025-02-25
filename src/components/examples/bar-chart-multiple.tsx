"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import {
  Moocn,
  MoocnOptions,
  MoocnProvider,
} from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { multiBarPlugin } from "@/registry/lib/moocn-multi-bars";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";
import uPlot from "uplot";

const DATA_COUNT = 100000;
const SERIES_COUNT = 5;

function generateData() {
  const xVals = Array.from({ length: DATA_COUNT }, (_, i) => i);
  const seriesValues: number[][] = [];
  for (let s = 0; s < SERIES_COUNT; s++) {
    const vals = xVals.map((x) => {
      const noise = Math.random() * 20 - 10;
      return Math.max(0, 50 + 50 * Math.sin((x * 0.1 + s * 10) / 15) + noise);
    });
    seriesValues.push(vals);
  }
  return {
    xVals,
    seriesValues,
  };
}

const { xVals, seriesValues } = generateData();
const data = [xVals, ...seriesValues];

const seriesConfig = [
  {},
  ...Array.from({ length: SERIES_COUNT }, (_, i) => {
    const colorIndex = (i % 5) + 1;
    const color = `hsl(var(--chart-${colorIndex}))`;
    return {
      label: `Herd ${i + 1}`,
      stroke: color,
      fill: color,
    };
  }),
];

const options: MoocnOptions = {
  select: { show: false } as uPlot.Select,
  scales: {
    y: {
      range: (u, min, max) => [0, 500],
    },
    x: { time: false },
  },
  plugins: [
    multiBarPlugin({
      stacked: true,
      ignore: [],
      radius: 0.1,
      groupWidth: 0.8,
      barWidth: 0.9,
      valueColor: "var(--muted-foreground)",
      showValues: false,
    }),
    wheelZoomPlugin({ factor: 0.75 }),
  ],
  cursor: { x: false, y: false },
  axes: [
    {
      space: 100,
      stroke: "var(--muted-foreground)",
      size: 30,
      gap: 0,
      show: true,
      incrs: [1, 2, 5, 10, 30, 100, 300, 1000],
      values: (u, ticks) => ticks.map((v) => "Pasture Day " + Math.floor(v)),
    },
    {
      stroke: "var(--muted-foreground)",
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 30,
      gap: 0,
    },
  ],
  series: seriesConfig,
  legend: { show: false },
};

export default function ManySeriesBarchartExample() {
  return (
    <MoocnProvider>
      <Card>
        <CardHeader>
          <CardTitle>MooltiSeries Barchart</CardTitle>
          <CardDescription>12 x 10,000 bars</CardDescription>
        </CardHeader>

        <CardContent className="h-[400px] w-full">
          {/* <MoocnTooltip /> */}
          <Moocn data={data} options={options} className="h-full w-full" />
          <MoocnLegend />
        </CardContent>

        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Each herd’s daily moo-surements shown over {DATA_COUNT} pasture
            days.
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}
