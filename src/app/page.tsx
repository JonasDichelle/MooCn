import BarChartExample from "@/components/examples/bar-chart-multiple";
import SimpleAreaChart from "@/components/examples/simple-area-stacked";
import SineStreamChart from "@/components/examples/sine-wave-stream";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/modeToggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🐮 MooCn Charts</h1>
        <ModeToggle />
      </header>

      <main className="grid gap-4 p-4 md:grid-cols-2">
        {/* First Row */}
        <Card>
          <CardHeader>
            <CardTitle>Simple Bar CHart</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <BarChartExample />
          </CardContent>
          <CardFooter>{}</CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gradient Area Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SimpleAreaChart />
          </CardContent>
        </Card>

        {/* Second Row - Full Width */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sine Waves</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SineStreamChart />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
