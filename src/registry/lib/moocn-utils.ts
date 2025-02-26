"use client";

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

function fixColorFnHex(color: string): string {
  const regex = /^(\w+)\(\s*(#[0-9A-Fa-f]{3,8})(?:\s*\/\s*([^)]+))?\)\s*$/;
  const match = color.match(regex);
  if (!match) {
    return color;
  }
  const [, , hex, alphaRaw] = match;
  const [r, g, b] = hexToRgb(hex);

  let alphaNum = 1;
  if (alphaRaw !== undefined) {
    if (alphaRaw.endsWith("%")) {
      alphaNum = parseFloat(alphaRaw) / 100;
    } else {
      alphaNum = parseFloat(alphaRaw);
    }
  }
  if (alphaNum < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alphaNum})`;
  } else {
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const intVal = parseInt(hex, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return [r, g, b];
}

export function computeCssColor(
  color: any,
  el: HTMLElement | null = null
): string {
  if (typeof window === "undefined") return "#000";
  if (!el) el = document.documentElement;
  const expanded = expandCssVars(color, el);
  const unwrapped = fixDoubleWrapping(expanded);
  const fixedSlash = fixSlashPlacement(unwrapped);
  const final = fixColorFnHex(fixedSlash);
  return final;
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
  topColor: string,
  bottomColor: string
) {
  const ctx = u.ctx;
  const scaleKey = "y";

  const yMin = isFinite(u.scales[scaleKey].min as number)
    ? u.scales[scaleKey].min!
    : 0;
  const yMax = isFinite(u.scales[scaleKey].max as number)
    ? u.scales[scaleKey].max!
    : isFinite(u.height)
    ? u.height
    : 400;

  const safeY0 = isFinite(u.valToPos(yMin, scaleKey, true))
    ? u.valToPos(yMin, scaleKey, true)
    : 0;
  const safeY1 = isFinite(u.valToPos(yMax, scaleKey, true))
    ? u.valToPos(yMax, scaleKey, true)
    : isFinite(u.height)
    ? u.height
    : 400;

  const gradient = ctx.createLinearGradient(0, safeY0, 0, safeY1);
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
