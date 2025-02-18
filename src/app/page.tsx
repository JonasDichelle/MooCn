import React from "react";
import SomeChartExample from "@/components/example";
import { ModeToggle } from "@/components/ui/modeToggle";

export default function DemoPage() {
  const data = [
    { desktop: 120, mobile: 80 },
    { desktop: 200, mobile: 150 },
    { desktop: 250, mobile: 220 },
  ];

  return (
    <div className="p-4">
      {/* <h2 className="font-bold text-xl mb-2">Mucn Example</h2> */}
      <ModeToggle />
      <SomeChartExample />
    </div>
  );
}
