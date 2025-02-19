"use client";

import BarChartExample from "@/components/examples/bar-chart-example";
import MultiseriesBarchartExample from "@/components/examples/bar-chart-multiple";
import SimpleAreaChart from "@/components/examples/simple-area-stacked";
import SineStreamChart from "@/components/examples/sine-wave-stream";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/modeToggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🐮 MooCn Charts</h1>
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

      <main className="grid gap-4 p-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simple Bar Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <MultiseriesBarchartExample />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gradient Area Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SimpleAreaChart />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sine Waves</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SineStreamChart />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sine Waves</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <BarChartExample />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
