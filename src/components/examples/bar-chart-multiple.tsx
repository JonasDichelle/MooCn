"use client";

import React from "react";
import { Moocn, MoocnProvider } from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { multiBarPlugin } from "@/registry/lib/moocn-multi-bars";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";
import uPlot from "uplot";

const DATA_COUNT = 10000;
const SERIES_COUNT = 12;

function generateData() {
  console.log("generateData");

  const xVals = Array.from({ length: DATA_COUNT }, (_, i) => i);

  const seriesValues: number[][] = [];
  for (let s = 0; s < SERIES_COUNT; s++) {
    const vals = xVals.map((x) => {
      const noise = Math.random() * 20 - 10;

      return Math.max(0, 50 + 50 * Math.sin((x + s * 10) / 15) + noise);
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

const colors = Array.from({ length: SERIES_COUNT }, (_, i) => {
  const hue = (i * 30) % 360;
  return `hsl(${hue}, 70%, 50%)`;
});

const seriesConfig = [
  {},
  ...colors.map((color, i) => ({
    label: `Series ${i + 1}`,
    stroke: color,
    fill: color,
  })),
];

const options: uPlot.Options = {
  select: { show: true },
  scales: {
    y: {
      range: (u, min, max) => [0, max],
    },
    x: { time: false },
  },
  plugins: [
    multiBarPlugin({
      ori: 0,
      dir: 1,
      stacked: false,
      ignore: [],
      radius: 0.1,
      groupWidth: 0.8,
      barWidth: 0.9,
      valueColor: "var(--muted-foreground)",
      showValues: false,
      xAxisStroke: "hsl(var(--foreground)/50%)",
      yAxisStroke: "hsl(var(--foreground)/50%)",
      cursorClassName: "rounded-none",
    }),
    wheelZoomPlugin({ factor: 0.75 }),
  ],
  axes: [
    {
      space: 100,
      stroke: "var(--muted-foreground)",
      size: 30,
      gap: 0,
      show: true,
      incrs: [1, 2, 5, 10, 30, 100, 300, 1000],
      values: (u, ticks) => ticks.map((v) => "Day " + Math.floor(v)),
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
      <div className="flex flex-col h-full">
        <MoocnTooltip />
        <Moocn data={data} options={options} className="h-full w-full" />
        <MoocnLegend />
      </div>
    </MoocnProvider>
  );
}
