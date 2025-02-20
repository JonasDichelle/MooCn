"use client";

import * as React from "react";
import { Moocn, MoocnProvider } from "@/registry/components/Moocn";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { createVerticalGradient } from "@/registry/lib/moocn-utils";

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function boxMullerRandom() {
  let phase = 0,
    x1 = 0,
    x2 = 0,
    w = 0,
    z = 0;

  return function bm() {
    if (!phase) {
      do {
        x1 = 2.0 * Math.random() - 1.0;
        x2 = 2.0 * Math.random() - 1.0;
        w = x1 * x1 + x2 * x2;
      } while (w >= 1.0);

      w = Math.sqrt((-2.0 * Math.log(w)) / w);
      z = x1 * w;
    } else {
      z = x2 * w;
    }
    phase = 1 - phase;
    return z;
  };
}

const randFunc = boxMullerRandom();

function randomWalk(
  steps: number,
  initialValue: number,
  min: number,
  max: number
): number[] {
  let points = [];
  let val = initialValue;
  for (let i = 0; i < steps; i++) {
    const incr = randFunc();
    const newVal = val + incr;
    if (newVal > max || newVal < min) {
      val = clamp(val - incr, min, max);
    } else {
      val = newVal;
    }
    points.push(val);
  }
  return points;
}

const options = {
  scales: {
    x: { time: false },
    y: {
      range: [-6, 6],
    },
  },
  legend: { show: false },
  cursor: { x: false, y: false },
  select: { show: false },
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
      grid: { stroke: "hsl(var(--border)/0%)" },
      size: 30,
      gap: 0,
    },
  ],
  series: [
    {},

    {
      label: "Sine",
      stroke: "var(--chart-1)",
      fill: (u: any, si: number) =>
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
      label: "Series 1",
      stroke: "var(--chart-2)",
      fill: (u: any, si: number) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-2)/5%)",
          "var(--chart-2)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },

    {
      label: "Series 2",
      stroke: "var(--chart-3)",
      fill: (u: any, si: number) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-3)/5%)",
          "var(--chart-3)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },

    {
      label: "Series 3",
      stroke: "var(--chart-4)",
      fill: (u: any, si: number) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-4)/5%)",
          "var(--chart-4)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },

    {
      label: "Series 4",
      stroke: "var(--chart-5)",
      fill: (u: any, si: number) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-5)/5%)",
          "var(--chart-5)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },

    {
      label: "Series 5",
      stroke: "var(--chart-5)",
      fill: (u: any, si: number) =>
        createVerticalGradient(
          u,
          si,
          "hsl(var(--chart-5)/5%)",
          "var(--chart-5)"
        ),
      fillAlpha: 0.2,
      width: 2,
      points: { show: false },
    },
  ],
};

export default function SineStreamChart() {
  const length = 600;
  const [xs, setXs] = React.useState(Array.from({ length }, (_, i) => i));
  const [sine, setSine] = React.useState(
    Array.from({ length }, (_, i) => Math.sin(i / 16) * 5)
  );

  const [r1, setR1] = React.useState(randomWalk(length, -4, -6, 1));
  const [r2, setR2] = React.useState(randomWalk(length, -2, -6, 1));
  const [r3, setR3] = React.useState(randomWalk(length, 0, -2, 2));
  const [r4, setR4] = React.useState(randomWalk(length, 2, -1, 6));
  const [r5, setR5] = React.useState(randomWalk(length, 4, -1, 6));

  React.useEffect(() => {
    let shift = length;
    let frameId: number;
    function update() {
      shift++;
      setXs((prev) => [...prev.slice(1), shift]);
      setSine((prev) => [...prev.slice(1), Math.sin(shift / 16) * 5]);
      setR1((prev) => addRandData(prev));
      setR2((prev) => addRandData(prev));
      setR3((prev) => addRandData(prev));
      setR4((prev) => addRandData(prev));
      setR5((prev) => addRandData(prev));
      frameId = requestAnimationFrame(update);
    }

    function addRandData(data: number[]): number[] {
      const lastVal = data[data.length - 1];
      return [...data.slice(1), randomWalk(1, lastVal, -6, 6)[0]];
    }

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [length]);

  const chartData = React.useMemo(() => {
    return [xs, sine, r1, r2, r3, r4, r5];
  }, [xs, sine, r1, r2, r3, r4, r5]);

  return (
    <MoocnProvider>
      <div className="flex flex-col h-full">
        <MoocnTooltip />
        <Moocn data={chartData} options={options} className="h-full w-full" />
        <MoocnLegend />
      </div>
    </MoocnProvider>
  );
}
