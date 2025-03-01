"use client";

import "uplot/dist/uPlot.min.css";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/modeToggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChartMultipleSimple } from "@/components/examples/bar-chart-multiple-simple";
import { AreaChartInteractive } from "@/components/examples/area-chart-interactive";
import { SimpleLineChart } from "@/components/examples/simple-line-chart";
import SineStreamChart from "@/components/examples/sine-wave-stream";
import MultiseriesBarchartExample from "@/components/examples/bar-chart-multiple";
import SimpleAreaStacked from "@/components/examples/simple-area-stacked";
import LineChartsHigh from "@/components/examples/line-chart-high";
import TaskManagerChart from "@/components/examples/task-manager";
import { Github } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"basics" | "stress-tests">(
    "basics"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="border-b py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">🐮 MooCn Charts</h1>
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
                <Github />
              </a>
            </Button>
          </div>
        </header>

        <main className="py-4 grid gap-4">
          {activeTab === "basics" && (
            <div className="flex flex-col space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SimpleAreaStacked />
                <BarChartMultipleSimple />
              </div>

              <AreaChartInteractive />

              <div className="grid gap-4 md:grid-cols-3">
                <SimpleLineChart pathType="smooth" />
                <SimpleLineChart pathType="linear" />
                <SimpleLineChart pathType="stepped" />
              </div>

              <TaskManagerChart />
            </div>
          )}

          {activeTab === "stress-tests" && (
            <div className="grid gap-4">
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
