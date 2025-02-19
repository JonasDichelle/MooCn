# 🚧 Work in Progress, not yet ready for use

# 🐮 MooCn Charts

MooCn is a customizable [shadcn](https://ui.shadcn.com/) -style chart component built on [μPlot](https://github.com/leeoniya/uPlot). It's designed to fit in with your project's existing theme, includes responsive scaling, and uses shadcn's chart tooltips and legends to keep things looking good.

![🐮 MooCn Charts](https://github.com/user-attachments/assets/84916877-65c5-400d-8092-c73fd6147595)

## Motivation

- shadcn has a selection of really nice-looking charts that are easy to customize with Tailwind. However, they rely on SVG-based Recharts, which can struggle with more complex projects and large datasets.
- μPlot is the lightest and fastest JavaScript charting library, and its functionality can be extended easily using plugins. However, visually, it isn't the prettiest out of the box.

MooCn combines the crazy speeds of μPlot with the beautiful design of shadcn, allowing you to get fast charts that also look good and work well with your style.

## Key Features

- Supports CSS variables, including opacity modification, with built-in dark/light mode switching.
- A responsive container that behaves like any other div.
- Uses shadcn’s legend and tooltip styles, making it easy to replace existing shadcn charts.
- It's a single file that can be easily pasted into your project.
- Growing library of copy-and-pastable chart examples.
