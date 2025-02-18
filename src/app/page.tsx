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

      <main className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Chart 1</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <BarChartExample />
          </CardContent>
          <CardFooter>{}</CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart 2</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SimpleAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart 3</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <SineStreamChart />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
