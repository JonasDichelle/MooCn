import React from "react";
import { MoocnOptions } from "../components/Moocn";

function expandCssVars(color: string, el: HTMLElement): string {
  const style = getComputedStyle(el);
  const varRegex = /var\((--[a-zA-Z0-9\-_]+)\)/;
  let result = color;
  let match: RegExpMatchArray | null;
  while ((match = result.match(varRegex))) {
    const [fullMatch, varName] = match;
    const varValue = style.getPropertyValue(varName).trim();
    result = result.replace(fullMatch, varValue || "");
  }
  return result;
}

function fixDoubleWrapping(color: string): string {
  const colorFnRegex = /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(\s*(.+)\)$/i;

  while (true) {
    const match = color.match(colorFnRegex);
    if (!match) break;
    const outerFn = match[1].toLowerCase();
    const inside = match[2].trim();
    const innerFnMatch = inside.match(
      /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(/i
    );
    if (!innerFnMatch) break;
    const innerFn = innerFnMatch[1].toLowerCase();
    if (outerFn === innerFn) {
      color = inside;
    } else {
      break;
    }
  }
  return color;
}

function fixSlashPlacement(color: string): string {
  const regex = /^(\w+)\(([^)]*)\)\s*\/\s*(\S+)$/;
  const match = color.match(regex);
  if (match) {
    const [, fnName, inside, alpha] = match;
    return `${fnName}(${inside.trim()} / ${alpha.trim()})`;
  }
  return color;
}

export function computeCssColor(
  color: any,
  el: HTMLElement | null = null
): string {
  if (el === null) {
    if (typeof window === "undefined") return "#000";
    el = document.documentElement;
  }
  const expanded = expandCssVars(color, el);
  const unwrapped = fixDoubleWrapping(expanded);
  const fixedSlash = fixSlashPlacement(unwrapped);
  return fixedSlash;
}

export function checkDarkMode() {
  if (typeof window === "undefined") return false;
  const htmlEl = document.documentElement;
  const isDark = htmlEl.classList.contains("dark");
  return isDark;
}

export function useThemeMode() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const htmlEl = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(checkDarkMode());
    });
    observer.observe(htmlEl, { attributes: true, attributeFilter: ["class"] });
    setIsDark(checkDarkMode());
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function createVerticalGradient(
  u: uPlot,
  seriesIdx: number,
  topColor: string,
  bottomColor: string
) {
  const ctx = u.ctx;
  const scaleKey = "y";
  const yMin = u.scales[scaleKey].min!;
  const yMax = u.scales[scaleKey].max!;
  const y0 = u.valToPos(yMin, scaleKey, true);
  const y1 = u.valToPos(yMax, scaleKey, true);
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  gradient.addColorStop(0, computeCssColor(topColor));
  gradient.addColorStop(1, computeCssColor(bottomColor));
  return gradient;
}

export function cloneAndResolveColors(options: MoocnOptions): MoocnOptions {
  const newOptions = { ...options };
  if (Array.isArray(options.series)) {
    newOptions.series = options.series.map((seriesItem: any) => {
      const newSeries = { ...seriesItem };
      if (seriesItem.stroke) {
        newSeries.stroke = computeCssColor(seriesItem.stroke);
      }
      if (seriesItem.fill) {
        if (typeof seriesItem.fill === "string") {
          newSeries.fill = computeCssColor(seriesItem.fill);
        } else if (typeof seriesItem.fill === "function") {
          newSeries.fill = seriesItem.fill;
        }
      }
      return newSeries;
    }) as any;
  }
  if (Array.isArray(options.axes)) {
    newOptions.axes = options.axes.map((axisItem) => {
      const newAxis = { ...axisItem };
      if (axisItem.stroke) {
        newAxis.stroke = computeCssColor(axisItem.stroke);
      }
      if (axisItem.grid && typeof axisItem.grid === "object") {
        newAxis.grid = { ...axisItem.grid };
        if (axisItem.grid.stroke) {
          newAxis.grid.stroke = computeCssColor(axisItem.grid.stroke);
        }
      }
      if (axisItem.ticks && typeof axisItem.ticks === "object") {
        newAxis.ticks = { ...axisItem.ticks };
        if (axisItem.ticks.stroke) {
          newAxis.ticks.stroke = computeCssColor(axisItem.ticks.stroke);
        }
      }
      return newAxis;
    });
  }
  return newOptions;
}
