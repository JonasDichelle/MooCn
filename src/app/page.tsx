"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/modeToggle";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// ^ Make sure you have @radix-ui/react-tabs or shadcn/ui properly installed & configured

import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {
  Moocn,
  MoocnProvider,
  MoocnOptions,
} from "@/registry/components/Moocn";
import { MoocnTooltip } from "@/registry/components/MoocnTooltip";
import { MoocnLegend } from "@/registry/components/MoocnLegend";
import { wheelZoomPlugin } from "@/registry/lib/moocn-mouse-zoom";

import { BarChartMultipleSimple } from "@/components/examples/bar-chart-multiple-simple";
import { AreaChartInteractive } from "@/components/examples/area-chart-interactive";
import { SimpleLineChart } from "@/components/examples/simple-line-chart";
import SineStreamChart from "@/components/examples/sine-wave-stream";
import MultiseriesBarchartExample from "@/components/examples/bar-chart-multiple";
import SimpleAreaStacked from "@/components/examples/simple-area-stacked";
import LineChartsHigh from "@/components/examples/line-chart-high"; // your "1 million points" line chart

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"basics" | "stress-tests">(
    "basics"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <header className="border-b py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">🐮 MooCn Charts</h1>
            {/* Tabs for Basics / Stress Tests */}
            <div className="space-x-2">
              <Button
                variant={activeTab === "basics" ? "default" : "secondary"}
                onClick={() => setActiveTab("basics")}
              >
                Basics
              </Button>
              <Button
                variant={activeTab === "stress-tests" ? "default" : "secondary"}
                onClick={() => setActiveTab("stress-tests")}
              >
                Stress Tests
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ModeToggle />
            <Button asChild variant="default" size="icon">
              <a
                href="https://github.com/JonasDichelle/MooCn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/assets/github-mark.svg"
                  alt="GitHub"
                  className="h-5 w-5 invert dark:invert-0"
                />
              </a>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-4 grid gap-4">
          {activeTab === "basics" && (
            <div className="flex flex-col space-y-4">
              {/* Row: Simple Area Chart + Bar Chart Multiple Simple */}
              <div className="grid gap-4 md:grid-cols-2">
                <SimpleAreaStacked />
                <BarChartMultipleSimple />
              </div>

              {/* Row: Area Chart Interactive */}
              <AreaChartInteractive />

              {/* Row: Three Simple Line Charts */}
              <div className="grid gap-4 md:grid-cols-3">
                <SimpleLineChart pathType="smooth" />
                <SimpleLineChart pathType="linear" />
                <SimpleLineChart pathType="stepped" />
              </div>
            </div>
          )}

          {activeTab === "stress-tests" && (
            <div className="grid gap-4">
              {/* A nested Tabs component for the different stress tests */}
              <Tabs defaultValue="sine-stream" className="w-full">
                <TabsList>
                  <TabsTrigger value="sine-stream">Sine Stream</TabsTrigger>
                  <TabsTrigger value="multiseries-barchart">
                    Multi-Bar
                  </TabsTrigger>
                  <TabsTrigger value="high-line">1M Points</TabsTrigger>
                </TabsList>

                <TabsContent value="sine-stream" className="pt-4">
                  <SineStreamChart />
                </TabsContent>

                <TabsContent value="multiseries-barchart" className="pt-4">
                  <MultiseriesBarchartExample />
                </TabsContent>

                <TabsContent value="high-line" className="pt-4">
                  <LineChartsHigh />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
