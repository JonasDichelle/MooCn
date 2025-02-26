"use client";

import uPlot from "uplot";
import { computeCssColor } from "./moocn-utils";

interface BarDomainLayout {
  x0: Float64Array;
  size: Float64Array;
}
interface StackedY {
  y0: Float64Array;
  y1: Float64Array;
}

export interface SeriesBarsPluginOpts {
  ignore?: number[];
  radius?: number;
  groupWidth?: number;
  barWidth?: number;
  stacked?: boolean;
  showValues?: boolean;
  valueColor?: string;
  radiusMode?: "each" | "stack";
  cursorFill?: string;
}

export function multiBarPlugin(opts: SeriesBarsPluginOpts = {}): uPlot.Plugin {
  const {
    ignore = [],
    radius: userRadius = 0,
    groupWidth = 0.9,
    barWidth = 0.9,
    stacked = false,
    showValues = false,
    valueColor = "black",
    radiusMode = "stack",
    cursorFill = "rgba(255, 255, 255, 0.2)",
  } = opts;

  let curRadius = userRadius;
  let oldRadius = userRadius;
  const barSeriesIdxs: number[] = [];
  let firstBarIdx: number | null = null;
  let xLayouts: Array<BarDomainLayout | null> = [];
  let stackedYs: Array<StackedY | null> = [];

  let clusterDomainGeom: Array<{ xStart: number; xEnd: number } | null> = [];

  const layoutCache = new Map<string, BarDomainLayout[]>();
  const stackedLayoutCache = new Map<string, BarDomainLayout>();
  const half = 0.5;
  const emptyBbox = { left: 0, top: 0, width: 0, height: 0 };

  function buildSideBySideLayouts(
    xVals: ArrayLike<number>,
    barCount: number
  ): BarDomainLayout[] {
    const len = xVals.length;
    if (barCount <= 0 || len === 0) return [];

    const cacheKey = `${len}_${barCount}_${groupWidth}_${barWidth}`;
    if (layoutCache.has(cacheKey)) return layoutCache.get(cacheKey)!;

    if (len === 1) {
      const center = xVals[0];
      const clusterWidth = groupWidth;
      const rawShare = clusterWidth / barCount;
      const usedShare = rawShare * barWidth;
      const leftover = rawShare - usedShare;

      const layouts: BarDomainLayout[] = [];
      for (let b = 0; b < barCount; b++) {
        const x0 = new Float64Array(1);
        const size = new Float64Array(1);
        x0[0] = center - clusterWidth * half + b * rawShare + leftover * half;
        size[0] = usedShare;
        layouts.push({ x0, size });
      }
      layoutCache.set(cacheKey, layouts);
      return layouts;
    }

    let totalGap = 0;
    for (let i = 1; i < len; i++) totalGap += xVals[i] - xVals[i - 1];

    const avgGap = totalGap / (len - 1);
    const clusterWidth = avgGap * groupWidth;
    const rawShare = clusterWidth / barCount;
    const usedShare = rawShare * barWidth;
    const leftover = rawShare - usedShare;
    const clusterHalfWidth = clusterWidth * half;
    const layouts: BarDomainLayout[] = [];

    for (let b = 0; b < barCount; b++) {
      const x0 = new Float64Array(len);
      const size = new Float64Array(len);
      size.fill(usedShare);
      const leftAdjust = b * rawShare + leftover * half;
      for (let i = 0; i < len; i++)
        x0[i] = xVals[i] - clusterHalfWidth + leftAdjust;
      layouts.push({ x0, size });
    }

    layoutCache.set(cacheKey, layouts);
    return layouts;
  }

  function buildStackedLayout(xVals: ArrayLike<number>): BarDomainLayout {
    const len = xVals.length;
    if (len === 0)
      return { x0: new Float64Array(0), size: new Float64Array(0) };

    const cacheKey = `stacked_${len}_${groupWidth}_${barWidth}`;
    if (stackedLayoutCache.has(cacheKey))
      return stackedLayoutCache.get(cacheKey)!;

    if (len === 1) {
      const center = xVals[0];
      const clusterWidth = groupWidth;
      const usedShare = clusterWidth * barWidth;
      const leftover = clusterWidth - usedShare;
      const x0 = new Float64Array(1);
      const size = new Float64Array(1);
      x0[0] = center - clusterWidth * half + leftover * half;
      size[0] = usedShare;
      const result = { x0, size };
      stackedLayoutCache.set(cacheKey, result);
      return result;
    }

    let totalGap = 0;
    for (let i = 1; i < len; i++) totalGap += xVals[i] - xVals[i - 1];

    const avgGap = totalGap / (len - 1);
    const clusterWidth = avgGap * groupWidth;
    const usedShare = clusterWidth * barWidth;
    const leftover = clusterWidth - usedShare;
    const x0 = new Float64Array(len);
    const size = new Float64Array(len);
    size.fill(usedShare);
    const clusterHalfWidth = clusterWidth * half;
    const leftAdjust = leftover * half;

    for (let i = 0; i < len; i++)
      x0[i] = xVals[i] - clusterHalfWidth + leftAdjust;

    const result = { x0, size };
    stackedLayoutCache.set(cacheKey, result);
    return result;
  }

  function updateDomainGeometry(u: uPlot) {
    const xVals = u.data[0] as number[] | undefined;
    if (!xVals || xVals.length === 0) return;

    clusterDomainGeom = new Array(xVals.length).fill(null);

    for (let i = 0; i < xVals.length; i++) {
      let minX = Infinity;
      let maxX = -Infinity;

      for (const sidx of barSeriesIdxs) {
        const layout = xLayouts[sidx];
        if (!layout) continue;

        const barStart = layout.x0[i];
        const barEnd = barStart + layout.size[i];

        minX = Math.min(minX, barStart);
        maxX = Math.max(maxX, barEnd);
      }

      if (minX !== Infinity && maxX !== -Infinity) {
        clusterDomainGeom[i] = { xStart: minX, xEnd: maxX };
      }
    }
  }

  function barsBuilder(u: uPlot, sidx: number, idx0: number, idx1: number) {
    let bottomRadius = curRadius;
    let topRadius = curRadius;

    if (stacked && radiusMode === "stack") {
      const posInStack = barSeriesIdxs.indexOf(sidx);
      if (posInStack !== -1) {
        bottomRadius = posInStack === barSeriesIdxs.length - 1 ? curRadius : 0;
        topRadius = posInStack === 0 ? curRadius : 0;
      }
    }

    return uPlot.paths.bars!({
      radius: [bottomRadius, topRadius],
      disp: {
        x0: {
          unit: 1,
          values: (_u, s) =>
            (xLayouts[s]?.x0 ?? new Float64Array(0)) as unknown as number[],
        },
        size: {
          unit: 1,
          values: (_u, s) =>
            (xLayouts[s]?.size ?? new Float64Array(0)) as unknown as number[],
        },
        y0: {
          unit: 1,
          values: (_u, s) =>
            (stackedYs[s]?.y0 ?? new Float64Array(0)) as unknown as number[],
        },
        y1: {
          unit: 1,
          values: (_u, s) =>
            (stackedYs[s]?.y1 ?? new Float64Array(0)) as unknown as number[],
        },
      },
      each: undefined,
    })(u, sidx, idx0, idx1);
  }

  function drawValues(u: uPlot, sidx: number) {
    if (!showValues) return;

    const data = u.data[sidx] as (number | null)[];
    if (!data || data.length === 0) return;

    const ctx = u.ctx;
    const xLayout = xLayouts[sidx];
    const yLayout = stackedYs[sidx];

    if (!xLayout || !yLayout) return;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "10px Arial";
    ctx.fillStyle = computeCssColor(valueColor);

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (val == null || val === 0) continue;

      const x = u.valToPos(xLayout.x0[i] + xLayout.size[i] / 2, "x", true);
      const y = u.valToPos(yLayout.y1[i], "y", true) - 2;

      const displayVal = Number.isInteger(val)
        ? val.toString()
        : val.toFixed(1);
      ctx.fillText(displayVal, x, y);
    }

    ctx.restore();
  }

  function updateRadius(u: uPlot) {
    if (firstBarIdx === null) return;

    const layout = xLayouts[firstBarIdx];
    if (!layout || layout.x0.length === 0) return;

    const domainLeft = layout.x0[0];
    const barWidthPx = Math.abs(
      u.valToPos(domainLeft + layout.size[0], "x", true) -
        u.valToPos(domainLeft, "x", true)
    );

    const newRadius = barWidthPx > 2 ? userRadius : 0;
    if (newRadius !== oldRadius) {
      curRadius = newRadius;
      oldRadius = newRadius;
      for (const sidx of barSeriesIdxs) (u.series[sidx] as any)._paths = null;
      u.redraw();
    }
  }

  return {
    hooks: {
      init(u) {
        const uniqueClass = `bar-cursor-${Date.now()}`;
        u.root.classList.add(uniqueClass);
        const style = document.createElement("style");
        style.textContent = `.${uniqueClass} .u-cursor-pt{border-radius:0!important}`;
        document.head.appendChild(style);
      },

      drawClear(u) {
        if (barSeriesIdxs.length === 0) {
          for (let i = 1; i < u.series.length; i++) {
            if (!ignore.includes(i)) barSeriesIdxs.push(i);
          }
          firstBarIdx = barSeriesIdxs.length > 0 ? barSeriesIdxs[0] : null;
        }

        clusterDomainGeom = [];

        const xVals = u.data[0] as number[] | undefined;
        const len = xVals?.length ?? 0;
        if (!xVals || len === 0 || barSeriesIdxs.length === 0) {
          xLayouts = [];
          stackedYs = [];
          return;
        }

        const sLen = u.series.length;
        if (xLayouts.length !== sLen) xLayouts = new Array(sLen).fill(null);
        if (stackedYs.length !== sLen) stackedYs = new Array(sLen).fill(null);

        if (stacked) {
          const layout = buildStackedLayout(xVals);
          const partialSums = new Float64Array(len);

          for (const sidx of barSeriesIdxs) {
            xLayouts[sidx] = layout;
            const dataY = u.data[sidx] as (number | null)[];
            const y0 = new Float64Array(len);
            const y1 = new Float64Array(len);

            for (let j = 0; j < len; j++) {
              const val = dataY[j] ?? 0;
              y0[j] = partialSums[j];
              y1[j] = partialSums[j] + val;
              partialSums[j] = y1[j];
            }

            stackedYs[sidx] = { y0, y1 };
          }
        } else {
          const layouts = buildSideBySideLayouts(xVals, barSeriesIdxs.length);

          for (let i = 0; i < barSeriesIdxs.length; i++) {
            const sidx = barSeriesIdxs[i];
            xLayouts[sidx] = layouts[i];
            const dataY = u.data[sidx] as (number | null)[];
            const y0 = new Float64Array(len);
            const y1 = new Float64Array(len);

            for (let j = 0; j < len; j++) y1[j] = dataY[j] ?? 0;
            stackedYs[sidx] = { y0, y1 };
          }
        }

        updateDomainGeometry(u);
        updateRadius(u);
      },

      setScale(u, scaleKey) {
        if (scaleKey === "x") updateRadius(u);
      },

      draw(u) {
        if (showValues) {
          for (const sidx of barSeriesIdxs) {
            drawValues(u, sidx);
          }
        }
      },
    },

    opts(u, optsObj) {
      optsObj.cursor = optsObj.cursor || {};
      optsObj.cursor.points = optsObj.cursor.points || {};
      optsObj.cursor.points.fill = cursorFill;
      optsObj.cursor.points.one = true;

      optsObj.cursor.points.bbox = (chart, sidx) => {
        if (sidx !== firstBarIdx) return emptyBbox;

        const idx = chart.cursor.idx;
        if (idx == null) return emptyBbox;

        const domainGeom = clusterDomainGeom[idx];
        if (!domainGeom) return emptyBbox;

        const leftPx = chart.valToPos(domainGeom.xStart, "x", false);
        const rightPx = chart.valToPos(domainGeom.xEnd, "x", false);

        return {
          left: leftPx,
          top: 0,
          width: rightPx - leftPx,
          height: chart.rect.height,
        };
      };

      for (let i = 1; i < optsObj.series.length; i++) {
        if (!ignore.includes(i)) {
          optsObj.series[i].paths = barsBuilder;
          optsObj.series[i].points = { show: false };
        }
      }
    },
  };
}
