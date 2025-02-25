# 🐮 MooCn Charts

MooCn is a [shadcn](https://ui.shadcn.com/)-style chart component built on [μPlot](https://github.com/leeoniya/uPlot), an incredibly fast and lightweight plotting library.
While μPlot has some of the best performance out there, it can be tricky to style. MooCn let's you integrate μPlot with shadcn's design system, which makes it really easy to make some nice looking and super fast charts!

## Features

- **Easy to Use** – Copy and paste into your project or install via the shadcn CLI
- **Theme-Friendly** – Supports CSS variables, including opacity adjustments
- **Dark Mode Support** – Works with Tailwind’s `.dark` class for light/dark mode switching
- **Flexible & Responsive** – Behaves like any other div
- **Consistent Styling** – Uses shadcn’s legend and tooltip styles, making it easy to replace existing shadcn charts
- **Growing Example Library** – Copy-and-pastable chart examples to get started quickly

<br>

# Installation

Adding MooCn to your project is straightforward. You can choose between using the Shadcn CLI for a quick setup or installing it manually. Follow the steps below based on your preference.

## Option 1: Install with Shadcn CLI

The easiest way to integrate MooCn into your existing project is through the Shadcn CLI. This method automatically adds the necessary components to your project.

### Step 1: Add Base MooCn Components

Run the following command to install the core MooCn component along with the tooltip and legend components:

```bash
npx shadcn@latest add https://jonasdichelle.github.io/MooCn/r/moocn.json
```

This will place the base MooCn component, tooltip, and legend components into your project's components directory.

### Step 2 (Optional): Add Multi-Series Bar Charts

If you’d like to include support for multi-series bar charts, install the multi-bar plugin with this command:

```bash
npx shadcn@latest add https://jonasdichelle.github.io/MooCn/r/moocn-multi-bars.json
```

This command fetches and installs the MooCn components into your /components directory, just like other Shadcn components.

That’s it! You’re ready to start using MooCn in your project.
<br>

## Option 2: Manual Installation

If you prefer more control or don’t use the Shadcn CLI, you can install MooCn manually by following these steps.

### Step 1: Install Dependencies

MooCn relies on `uplot` and `uplot-react`. Install them via npm:

```bash
npm install uplot uplot-react
```

### Step 2: Copy Component Files

Copy the following files from the MooCn GitHub repository into your project’s components directory:

- [`/src/registry/components/Moocn.tsx`](https://github.com/JonasDichelle/MooCn/blob/main/src/registry/components/Moocn.tsx)
- [`/src/registry/components/MoocnLegend.tsx`](https://github.com/JonasDichelle/MooCn/blob/main/src/registry/components/MoocnLegend.tsx)
- [`/src/registry/components/MoocnTooltip.tsx`](https://github.com/JonasDichelle/MooCn/blob/main/src/registry/components/MoocnTooltip.tsx)

### Step 3: Add Utility Files

Copy the utility file below into your project’s `lib` directory:

- [`/src/registry/lib/moocn-utils.ts`](https://github.com/JonasDichelle/MooCn/blob/main/src/registry/lib/moocn-utils.ts)

### Step 4 (Optional): Add Multi-Series Bar Charts

If you want multi-series bar chart functionality, also copy this file into your `lib` directory:

- [`/src/registry/lib/moocn-multi-bars.ts`](https://github.com/JonasDichelle/MooCn/blob/main/src/registry/lib/moocn-multi-bars.ts)

Once you've completed the steps above, your project should look like this:

```
📂 src
 ┣ 📂 components
 ┃ ┣ 📜 Moocn.tsx
 ┃ ┣ 📜 MoocnLegend.tsx
 ┃ ┗ 📜 MoocnTooltip.tsx
 ┣ 📂 lib
 ┃ ┣ 📜 moocn-utils.ts
 ┃ ┗ 📜 moocn-multi-bars.ts  (Optional)
```

# Usage

Below is an example of how to use MooCn in your project:

```tsx
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
```

<br>

---

## Why MooCn?

I like shadcn’s chart aesthetics, but it relies on Recharts, which is based on SVG and struggles with large datasets. When I found μPlot and saw how fast it was I really wanted to make this library.

<sub><sup>It's called MooCn because the letter `μ` in μPlot kind of sounds like moo, the sound a cow makes.</sup></sub>
