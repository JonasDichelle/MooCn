"use client";

import * as React from "react";
import {
  Mucn,
  MucnProvider,
  createVerticalGradient,
  MucnLegendContent,
  MucnTooltip,
} from "./Mucn";
import { wheelZoomPlugin } from "./wheelZoomPlugin";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const myData = [
  [0, 1, 2, 3, 4],
  [100, 120, 140, 130, 180],
  [50, 80, 90, 70, 100],
];

const options = {
  scales: { x: { time: false }, y: { auto: true } },
  legend: { show: false },
  cursor: { x: false, y: false },

  plugins: [wheelZoomPlugin({ factor: 0.75 })],
  axes: [
    {
      stroke: "var(--foreground)",
      ticks: { stroke: "var(--border)" },
      grid: { stroke: "hsl(var(--border)/50%)" },
      size: 25,
      gap: 0,
    },
    {
      stroke: "var(--foreground)",
      grid: { stroke: "hsl(var(--border)/0%)" },
      size: 25,
      gap: 0,
    },
  ],
  series: [
    {},
    {
      label: "Desktop",
      stroke: "var(--chart-1)",
      fill: (u, si) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-1)/5%)",
          "var(--chart-1)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },
    {
      label: "Mobile",
      stroke: "var(--chart-2)",
      fill: (u, si) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-2)/5%)",
          "var(--chart-2)"
        ),
      fillAlpha: 0.5,
      width: 2,
      points: { show: false },
    },
  ],
};

export default function SomeChartExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gradient + Standard Colors</CardTitle>
      </CardHeader>
      <CardContent>
        <MucnProvider>
          <div className="flex flex-col gap-4 h-[500px]">
            <MucnTooltip />
            <Mucn data={myData} options={options} className="h-full w-full" />
            <MucnLegendContent />
          </div>
        </MucnProvider>
        <CardDescription>
          Zoom in/out with the mouse wheel. Middle-click and drag to pan.
          Tooltip from shadcn plugin.
        </CardDescription>
      </CardContent>
      <CardFooter>
        <p>Footer content</p>
      </CardFooter>
    </Card>
  );
}
