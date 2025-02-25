"use client";

import React from "react";
import {
  MoocnProvider,
  Moocn,
  MoocnOptions,
} from "@/registry/components/Moocn";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { MoocnLegend } from "@/registry/components/MoocnLegend";

const xVals = [0, 1, 2, 3, 4, 5];
const yVals = [100, 200, 150, 300, 250, 400];
const moocnData = [xVals, yVals];

const moocnOptions: MoocnOptions = {
  scales: {
    x: { time: false },
    y: {
      range: (_u, _min, max) => [0, max],
    },
  },
  axes: [
    { stroke: "var(--muted-foreground)" },
    { stroke: "var(--muted-foreground)" },
  ],
  legend: { show: false },
  series: [
    {},
    {
      label: "Example Series",
      stroke: "hsl(var(--chart-1))",
      width: 2,
      points: { show: true },
    },
  ],
};

export default function SimpleMoocnExample() {
  return (
    <MoocnProvider>
      <Moocn
        data={moocnData}
        options={moocnOptions}
        className="h-full w-full"
      />
      <MoocnTooltip />
      <MoocnLegend />
    </MoocnProvider>
  );
}
