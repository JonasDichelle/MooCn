import uPlot from "uplot";
import { computeCssColor } from "@/registry/lib/moocn-utils";

interface QuadObj {
  x: number;
  y: number;
  w: number;
  h: number;
  sidx: number;
  didx: number;
}

export class HoverContainer {
  objs: QuadObj[] = [];
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}
  clear() {
    this.objs.length = 0;
  }
  add(o: QuadObj) {
    this.objs.push(o);
  }
  get(px: number, py: number, cb: (o: QuadObj) => void) {
    for (const o of this.objs) {
      const l = o.x;
      const r = o.x + o.w;
      const t = o.y;
      const b = o.y + o.h;
      if (px >= l && px <= r && py >= t && py <= b) {
        cb(o);
      }
    }
  }
}

interface BarDomainLayout {
  x0: number[];
  size: number[];
}

interface StackedY {
  y0: number[];
  y1: number[];
}

export interface SeriesBarsPluginOpts {
  ignore?: number[];
  radius?: number;
  groupWidth?: number;
  barWidth?: number;
  stacked?: boolean;
  showValues?: boolean;
  valueColor?: string;
}

export function multiBarPlugin(opts: SeriesBarsPluginOpts = {}): uPlot.Plugin {
  const {
    ignore = [],
    radius = 0,
    groupWidth = 0.9,
    barWidth = 0.9,
    stacked = false,
    showValues = false,
    valueColor = "black",
  } = opts;

  let pxRatio = 1;
  let font = "10px Arial";

  function setPxRatio() {
    if (typeof window !== "undefined") {
      pxRatio = window.devicePixelRatio;
      font = `${Math.round(10 * pxRatio)}px Arial`;
    }
  }

  setPxRatio();

  let hoverContainer: HoverContainer;
  let xLayouts: Array<BarDomainLayout | null> = [];
  let stackedYs: Array<StackedY | null> = [];

  const barPixelGeom: Array<
    Array<{ centerX: number; topY: number; botY: number } | null>
  > = [];

  function buildSideBySideLayouts(xVals: number[], barCount: number) {
    if (barCount <= 0 || xVals.length === 0) return [];
    let totalGap = 0;
    for (let i = 1; i < xVals.length; i++) {
      totalGap += xVals[i] - xVals[i - 1];
    }
    const avgGap = xVals.length > 1 ? totalGap / (xVals.length - 1) : 1;
    const clusterWidth = avgGap * groupWidth;
    const rawShare = clusterWidth / barCount;
    const usedShare = rawShare * barWidth;
    const leftover = rawShare - usedShare;
    const layouts: BarDomainLayout[] = [];
    for (let b = 0; b < barCount; b++) {
      const x0 = new Array<number>(xVals.length);
      const size = new Array<number>(xVals.length).fill(usedShare);
      for (let i = 0; i < xVals.length; i++) {
        const center = xVals[i];
        const clusterLeft = center - clusterWidth / 2;
        x0[i] = clusterLeft + b * rawShare + leftover / 2;
      }
      layouts.push({ x0, size });
    }
    return layouts;
  }

  function buildStackedLayout(xVals: number[]): BarDomainLayout {
    let totalGap = 0;
    for (let i = 1; i < xVals.length; i++) {
      totalGap += xVals[i] - xVals[i - 1];
    }
    const avgGap = xVals.length > 1 ? totalGap / (xVals.length - 1) : 1;
    const clusterWidth = avgGap * groupWidth;
    const usedShare = clusterWidth * barWidth;
    const leftover = clusterWidth - usedShare;
    const x0 = new Array<number>(xVals.length);
    const size = new Array<number>(xVals.length).fill(usedShare);
    for (let i = 0; i < xVals.length; i++) {
      const center = xVals[i];
      x0[i] = center - clusterWidth / 2 + leftover / 2;
    }
    return { x0, size };
  }

  function drawValues(u: uPlot, sidx: number) {
    if (!showValues) return;
    const ctx = u.ctx;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = computeCssColor(valueColor);
    const xs = u.data[0];
    const ys = u.data[sidx];
    const axisXSize = u.axes?.[0]?.size() ?? 0;
    const axisYSize = u.axes?.[1]?.size() ?? 0;
    for (let i = 0; i < (xs?.length ?? 0); i++) {
      const val = ys[i];
      if (val == null) continue;
      const geom = barPixelGeom[sidx]?.[i];
      if (!geom) continue;
      const isPos = val >= 0;
      const barTop = isPos ? geom.topY : geom.botY;
      const valStr = String(val);
      const metrics = ctx.measureText(valStr);
      const asc = metrics.actualBoundingBoxAscent || 8;
      const desc = metrics.actualBoundingBoxDescent || 2;
      const textH = asc + desc;
      const PAD = 10;
      const labelX = geom.centerX + axisYSize;
      const labelY = barTop + axisXSize;
      const labelShift = isPos ? -(textH + PAD) : textH + PAD;
      ctx.textAlign = "center";
      ctx.textBaseline = isPos ? "bottom" : "top";
      ctx.fillText(valStr, Math.round(labelX), Math.round(labelY + labelShift));
    }
    ctx.restore();
  }

  const barsBuilder = uPlot.paths.bars({
    radius,
    disp: {
      x0: {
        unit: 1,
        values: (_u, sidx) => xLayouts[sidx]?.x0 ?? [],
      },
      size: {
        unit: 1,
        values: (_u, sidx) => xLayouts[sidx]?.size ?? [],
      },
      y0: {
        unit: 1,
        values: (_u, sidx) => stackedYs[sidx]?.y0 ?? [],
      },
      y1: {
        unit: 1,
        values: (_u, sidx) => stackedYs[sidx]?.y1 ?? [],
      },
    },
    each(self, sidx, didx, left, top, width, height) {
      const plotLeft = left - self.bbox.left;
      const plotTop = top - self.bbox.top;
      const plotCenterX = plotLeft + width / 2;
      const plotBot = plotTop + height;
      if (!barPixelGeom[sidx]) barPixelGeom[sidx] = [];
      barPixelGeom[sidx][didx] = {
        centerX: plotCenterX,
        topY: Math.min(plotTop, plotBot),
        botY: Math.max(plotTop, plotBot),
      };
      if (!hoverContainer) return;
      hoverContainer.add({
        x: plotLeft,
        y: plotTop,
        w: width,
        h: height,
        sidx,
        didx,
      });
    },
  });

  return {
    hooks: {
      drawClear(u) {
        hoverContainer =
          hoverContainer ||
          new HoverContainer(0, 0, u.bbox.width, u.bbox.height);
        hoverContainer.clear();
        for (const s of u.series) s._paths = null;
        for (let i = 0; i < barPixelGeom.length; i++) {
          barPixelGeom[i] = [];
        }
        const barSeriesIdxs: number[] = [];
        for (let i = 1; i < u.series.length; i++) {
          if (!ignore.includes(i)) barSeriesIdxs.push(i);
        }
        const xVals = u.data[0] as number[];
        if (!xVals || xVals.length === 0 || barSeriesIdxs.length === 0) {
          xLayouts = [];
          stackedYs = [];
          return;
        }
        if (stacked) {
          const layout = buildStackedLayout(xVals);
          xLayouts = new Array(u.series.length).fill(null);
          for (const i of barSeriesIdxs) xLayouts[i] = layout;
          stackedYs = new Array(u.series.length).fill(null);
          const partialSums = xVals.map(() => 0);
          for (const i of barSeriesIdxs) {
            const dataY = u.data[i] as (number | null)[];
            const y0 = [];
            const y1 = [];
            for (let j = 0; j < dataY.length; j++) {
              const val = dataY[j] ?? 0;
              y0[j] = partialSums[j];
              y1[j] = partialSums[j] + val;
            }
            for (let j = 0; j < dataY.length; j++) {
              partialSums[j] = y1[j];
            }
            stackedYs[i] = { y0, y1 };
          }
        } else {
          const barCount = barSeriesIdxs.length;
          const layouts = buildSideBySideLayouts(xVals, barCount);
          xLayouts = [];
          stackedYs = [];
          let layoutIndex = 0;
          for (let i = 1; i < u.series.length; i++) {
            if (ignore.includes(i)) {
              xLayouts.push(null);
              stackedYs.push(null);
              continue;
            }
            xLayouts.push(layouts[layoutIndex++]);
            stackedYs.push(null);
          }
          for (let i = 1; i < u.series.length; i++) {
            if (ignore.includes(i)) continue;
            const dataY = u.data[i] as (number | null)[];
            const y0 = [];
            const y1 = [];
            for (let j = 0; j < dataY.length; j++) {
              const val = dataY[j] ?? 0;
              y0[j] = 0;
              y1[j] = val;
            }
            stackedYs[i] = { y0, y1 };
          }
        }
      },
    },
    opts(u, optsObj) {
      optsObj.scales = optsObj.scales || {};
      optsObj.scales.y = optsObj.scales.y || {};
      const userRangeFn = optsObj.scales.y.range;
      optsObj.scales.y.range = (u2, min, max) => {
        const rMin = Math.min(0, min);
        const base = userRangeFn ? userRangeFn(u2, rMin, max) : [rMin, max];
        return base;
      };
      Object.assign(optsObj, {
        select: { show: true },
        cursor: {
          drag: { x: true, y: true },
          dataIdx: () => null,
          points: {
            fill: "rgba(255,255,255,0.25)",
            bbox: (_chart: uPlot, sidx: number) => {
              if (sidx === 0 || ignore.includes(sidx))
                return { left: -10, top: -10, width: 0, height: 0 };
              const cx = _chart.cursor.left * pxRatio;
              const cy = _chart.cursor.top * pxRatio;
              let hovered: QuadObj | null = null;
              hoverContainer.get(cx, cy, (o) => {
                if (o.sidx === sidx && !hovered) hovered = o;
              });
              if (!hovered) return { left: -10, top: -10, width: 0, height: 0 };
              return {
                left: hovered.x / pxRatio,
                top: hovered.y / pxRatio,
                width: hovered.w / pxRatio,
                height: hovered.h / pxRatio,
              };
            },
          },
        },
      });
      for (let i = 1; i < optsObj.series.length; i++) {
        if (ignore.includes(i)) continue;
        const s = optsObj.series[i];
        s.paths = barsBuilder;
        s.points = { show: showValues ? drawValues : false };
      }
    },
  };
}
