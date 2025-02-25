# 🐮 MooCn Charts
[Demo](https://jonasdichelle.github.io/MooCn/)

![moo](https://github.com/user-attachments/assets/e47faab1-6426-4c6f-9539-50317a21f6fd)


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

## Option 1: Install with Shadcn CLI
### Step 1: Add Base MooCn Components

Run the following command to install the core MooCn component along with the tooltip and legend components:

```bash
npx shadcn@latest add https://jonasdichelle.github.io/MooCn/r/moocn.json
```

This will place the base MooCn component, tooltip, and legend components into your project's components directory.

### Step 2 (Optional): Add Multi-Series Bar Charts

If you’d like to include support for multi-series bar charts, install the multi-bar plugin to your lib directory with this command:

```bash
npx shadcn@latest add https://jonasdichelle.github.io/MooCn/r/moocn-multi-bars.json
```

That’s it! You’re ready to start using MooCn in your project.

<br>
<br>

## Option 2: Manual Installation

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

<br>
<br>

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

![moo2](https://github.com/user-attachments/assets/bee5faa3-3382-4f4f-9df3-46247474865a)

![moo3](https://github.com/user-attachments/assets/b7b53129-11b2-4c48-b8e4-844d962012bf)

