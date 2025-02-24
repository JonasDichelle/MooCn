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

import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {
  Moocn,
  MoocnProvider,
  MoocnOptions,
} from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";

const DATA_COUNT = 333_333;

function randomWalk(count: number, startVal: number, min: number, max: number) {
  const data = new Float64Array(count);
  let val = startVal;
  for (let i = 0; i < count; i++) {
    const step = Math.random() * 2 - 1;
    val += step;
    if (val < min) val = min;
    if (val > max) val = max;
    data[i] = val;
  }
  return data;
}

const xVals = new Float64Array(DATA_COUNT).map((_, i) => i);

const line1 = randomWalk(DATA_COUNT, 10, 0, 20);
const line2 = randomWalk(DATA_COUNT, 0, -10, 10);
const line3 = randomWalk(DATA_COUNT, 5, -10, 20);

const moocnData = [xVals, line1, line2, line3];

const moocnSeries: uPlot.Series[] = [
  {},
  {
    label: "Herd One",
    stroke: "hsl(var(--chart-1))",
    width: 2,
    points: { show: false },
  },
  {
    label: "Herd Two",
    stroke: "hsl(var(--chart-2))",
    width: 2,
    points: { show: false },
  },
  {
    label: "Herd Three",
    stroke: "hsl(var(--chart-3))",
    width: 2,
    points: { show: false },
  },
];

const moocnOptions: MoocnOptions = {
  scales: {
    x: { time: false },
    y: {
      auto: true,
    },
  },
  legend: { show: false },
  select: { show: false },
  plugins: [wheelZoomPlugin({ factor: 0.75 })],

  axes: [
    {
      stroke: "var(--muted-foreground)",
      ticks: { stroke: "var(--border)" },
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 30,
      gap: 0,

      values: (u, splits) => splits.map((v) => String(Math.round(v))),
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

export default function LineChartsHigh() {
  return (
    <MoocnProvider>
      <Card>
        <CardHeader>
          <CardTitle>One Moolion Points!</CardTitle>
          <CardDescription>
            Three random walks, each with 333,333 points
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full h-[400px]">
          <MoocnTooltip />
          <Moocn
            data={moocnData}
            options={moocnOptions}
            className="w-full h-full"
          />
          <MoocnLegend />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Beware: 1 million total data points may challenge your browser!
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}
