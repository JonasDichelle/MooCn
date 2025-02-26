"use client";

import * as React from "react";
import "uplot/dist/uPlot.min.css";

import {
  Moocn,
  MoocnOptions,
  MoocnProvider,
} from "@/registry/components/Moocn";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { createVerticalGradient } from "@/registry/lib/moocn-utils";
import clsx from "clsx";

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
  const points = [];
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

function addRandData(data: number[], min: number, max: number): number[] {
  const lastVal = data[data.length - 1];
  const [newVal] = randomWalk(1, lastVal, min, max);
  return [...data.slice(1), newVal];
}

function getSparkOptions(chartVar: number): MoocnOptions {
  return {
    scales: {
      x: { time: false },
      y: { range: [0, 100] },
    },
    legend: { show: false },
    cursor: { show: false },
    select: { show: false },
    axes: [{ show: false }, { show: false }],
    series: [
      {},
      {
        stroke: `var(--chart-${chartVar})`,
        width: 2,
        points: { show: false },
        fill: (u, si) =>
          createVerticalGradient(
            u,
            `hsl(var(--chart-${chartVar})/5%)`,
            `var(--chart-${chartVar})`
          ),
      },
    ],
  };
}

function getDetailedOptions(chartVar: number): MoocnOptions {
  return {
    select: { show: false },
    scales: {
      x: { time: false },
      y: { range: [0, 100] },
    },
    cursor: { x: true, y: true },
    legend: { show: false },
    axes: [
      {
        stroke: "var(--muted-foreground)",
        ticks: { stroke: "var(--border)" },
        grid: { stroke: "hsl(var(--border)/50%)" },
        size: 30,
        gap: 0,
        show: false,
      },
      {
        stroke: "var(--muted-foreground)",
        grid: { stroke: "hsl(var(--border)/30%)" },
        size: 30,
        gap: 0,
      },
    ],
    series: [
      {},
      {
        label: "Usage",
        stroke: `var(--chart-${chartVar})`,
        width: 2,
        points: { show: false },
        fill: (u, si) =>
          createVerticalGradient(
            u,
            `hsl(var(--chart-${chartVar})/5%)`,
            `var(--chart-${chartVar})`
          ),
      },
    ],
  };
}

type Metric = "CPU" | "GPU" | "RAM" | "VRAM";

const metricColorMap: Record<Metric, number> = {
  CPU: 1,
  GPU: 2,
  RAM: 3,
  VRAM: 4,
};

export default function TaskManager() {
  const length = 300;

  const [xsCPU, setXsCPU] = React.useState(Array.from({ length }, (_, i) => i));
  const [cpuData, setCpuData] = React.useState(randomWalk(length, 50, 0, 100));

  const [xsGPU, setXsGPU] = React.useState(Array.from({ length }, (_, i) => i));
  const [gpuData, setGpuData] = React.useState(randomWalk(length, 30, 0, 100));

  const [xsRAM, setXsRAM] = React.useState(Array.from({ length }, (_, i) => i));
  const [ramData, setRamData] = React.useState(randomWalk(length, 60, 40, 80));

  const [xsVRAM, setXsVRAM] = React.useState(
    Array.from({ length }, (_, i) => i)
  );
  const [vramData, setVramData] = React.useState(
    randomWalk(length, 35, 20, 60)
  );

  const [selectedMetric, setSelectedMetric] = React.useState<Metric>("CPU");

  React.useEffect(() => {
    let shift = length;
    let frameId: number;

    function update() {
      shift++;

      setXsCPU((prev) => [...prev.slice(1), shift]);
      setCpuData((prev) => addRandData(prev, 0, 100));

      setXsGPU((prev) => [...prev.slice(1), shift]);
      setGpuData((prev) => addRandData(prev, 0, 100));

      setXsRAM((prev) => [...prev.slice(1), shift]);
      setRamData((prev) => addRandData(prev, 40, 80));

      setXsVRAM((prev) => [...prev.slice(1), shift]);
      setVramData((prev) => addRandData(prev, 20, 60));

      frameId = requestAnimationFrame(update);
    }

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [length]);

  const cpuChartData = React.useMemo<[number[], number[]]>(
    () => [xsCPU, cpuData],
    [xsCPU, cpuData]
  );
  const gpuChartData = React.useMemo<[number[], number[]]>(
    () => [xsGPU, gpuData],
    [xsGPU, gpuData]
  );
  const ramChartData = React.useMemo<[number[], number[]]>(
    () => [xsRAM, ramData],
    [xsRAM, ramData]
  );
  const vramChartData = React.useMemo<[number[], number[]]>(
    () => [xsVRAM, vramData],
    [xsVRAM, vramData]
  );

  const detailedChartData = React.useMemo<[number[], number[]]>(() => {
    switch (selectedMetric) {
      case "CPU":
        return cpuChartData;
      case "GPU":
        return gpuChartData;
      case "RAM":
        return ramChartData;
      case "VRAM":
        return vramChartData;
    }
  }, [selectedMetric, cpuChartData, gpuChartData, ramChartData, vramChartData]);

  const detailedOpts = React.useMemo(
    () => getDetailedOptions(metricColorMap[selectedMetric]),
    [selectedMetric]
  );

  return (
    <MoocnProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>System Resource Monitor</CardTitle>
          <CardDescription>
            Real-time resource usage visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[500px]">
            {}
            <div className="w-1/4 pr-4 flex flex-col h-full">
              <div className="flex-1 grid grid-rows-4 gap-4 h-full">
                <MetricSpark
                  label="CPU"
                  data={cpuChartData}
                  selected={selectedMetric === "CPU"}
                  onClick={() => setSelectedMetric("CPU")}
                />
                <MetricSpark
                  label="GPU"
                  data={gpuChartData}
                  selected={selectedMetric === "GPU"}
                  onClick={() => setSelectedMetric("GPU")}
                />
                <MetricSpark
                  label="RAM"
                  data={ramChartData}
                  selected={selectedMetric === "RAM"}
                  onClick={() => setSelectedMetric("RAM")}
                />
                <MetricSpark
                  label="VRAM"
                  data={vramChartData}
                  selected={selectedMetric === "VRAM"}
                  onClick={() => setSelectedMetric("VRAM")}
                />
              </div>
            </div>

            {}
            <div className="w-3/4 border-l pl-4 flex flex-col h-full">
              <div className="mb-2">
                <h3 className="text-lg font-semibold">
                  {selectedMetric} Usage
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detailed usage chart for {selectedMetric}.
                </p>
              </div>
              <div className="flex-1">
                <Moocn
                  data={detailedChartData}
                  options={detailedOpts}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Streaming random-walk data for demonstration.
          </div>
        </CardFooter>
      </Card>
    </MoocnProvider>
  );
}

interface MetricSparkProps {
  label: Metric;
  data: [number[], number[]];
  selected?: boolean;
  onClick?: () => void;
}

function MetricSpark({ label, data, selected, onClick }: MetricSparkProps) {
  const colorIndex = metricColorMap[label];
  const sparkOpts = React.useMemo(
    () => getSparkOptions(colorIndex),
    [colorIndex]
  );

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex flex-col h-full cursor-pointer transition-all rounded-md border p-2",
        selected
          ? "border-primary bg-muted/30"
          : "border-border hover:border-primary/50 hover:bg-muted/10"
      )}
    >
      <div className="mb-1">
        <h4 className="text-sm font-medium">{label}</h4>
      </div>
      <div className="flex-1">
        <Moocn data={data} options={sparkOpts} className="h-full w-full" />
      </div>
    </div>
  );
}
