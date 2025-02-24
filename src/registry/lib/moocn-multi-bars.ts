import uPlot from "uplot";
import { computeCssColor } from "@/registry/lib/moocn-utils";

function pointWithin(
  px: number,
  py: number,
  rlft: number,
  rtop: number,
  rrgt: number,
  rbtm: number
): boolean {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

interface QuadObj {
  x: number;
  y: number;
  w: number;
  h: number;
  sidx: number;
  didx: number;
}

const MAX_OBJECTS = 10;
const MAX_LEVELS = 4;

class Quadtree {
  x: number;
  y: number;
  w: number;
  h: number;
  l: number;
  o: QuadObj[];
  q: Quadtree[] | null;

  constructor(x: number, y: number, w: number, h: number, l?: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.l = l || 0;
    this.o = [];
    this.q = null;
  }

  private split() {
    const x = this.x;
    const y = this.y;
    const w = this.w / 2;
    const h = this.h / 2;
    const l = this.l + 1;

    this.q = [
      new Quadtree(x + w, y, w, h, l),
      new Quadtree(x, y, w, h, l),
      new Quadtree(x, y + h, w, h, l),
      new Quadtree(x + w, y + h, w, h, l),
    ];
  }

  private quads(
    x: number,
    y: number,
    w: number,
    h: number,
    cb: (q: Quadtree) => void
  ) {
    if (!this.q) return;
    const hzMid = this.x + this.w / 2;
    const vtMid = this.y + this.h / 2;

    const startIsNorth = y < vtMid;
    const startIsWest = x < hzMid;
    const endIsEast = x + w > hzMid;
    const endIsSouth = y + h > vtMid;

    if (startIsNorth && endIsEast) cb(this.q[0]);
    if (startIsNorth && startIsWest) cb(this.q[1]);
    if (endIsSouth && startIsWest) cb(this.q[2]);
    if (endIsSouth && endIsEast) cb(this.q[3]);
  }

  add(o: QuadObj) {
    if (this.q) {
      this.quads(o.x, o.y, o.w, o.h, (quad) => {
        quad.add(o);
      });
    } else {
      this.o.push(o);
      if (this.o.length > MAX_OBJECTS && this.l < MAX_LEVELS) {
        this.split();
        for (let i = 0; i < this.o.length; i++) {
          const oi = this.o[i];
          this.quads(oi.x, oi.y, oi.w, oi.h, (quad) => {
            quad.add(oi);
          });
        }
        this.o.length = 0;
      }
    }
  }

  get(x: number, y: number, w: number, h: number, cb: (o: QuadObj) => void) {
    for (let i = 0; i < this.o.length; i++) {
      cb(this.o[i]);
    }
    if (this.q) {
      this.quads(x, y, w, h, (quad) => {
        quad.get(x, y, w, h, cb);
      });
    }
  }

  clear() {
    this.o.length = 0;
    this.q = null;
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
  radiusMode?: "each" | "stack";
  cursorFill?: string;
  autoScaleY?: boolean;
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
    cursorFill = "rgba(255, 255, 255, 0.4)",
    autoScaleY = true,
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

  let curRadius = userRadius;
  let oldRadius = userRadius;

  let quadTree: Quadtree | null = null;
  let hovered: QuadObj | null = null;

  const barPixelGeom: Array<
    Array<{ centerX: number; topY: number; botY: number } | null>
  > = [];

  let xLayouts: Array<BarDomainLayout | null> = [];
  let stackedYs: Array<StackedY | null> = [];

  let barSeriesIdxs: number[] = [];

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

  function buildStackedLayout(xVals: number[]) {
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
    const axisXSize =
      typeof u.axes?.[0]?.size === "function"
        ? (u.axes[0].size as () => number)()
        : 0;
    const axisYSize =
      typeof u.axes?.[1]?.size === "function"
        ? (u.axes[1].size as () => number)()
        : 0;

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

  function barsBuilderFactory() {
    return (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
      let bottomRadius = curRadius;
      let topRadius = curRadius;

      if (stacked && radiusMode === "stack") {
        const posInStack = barSeriesIdxs.indexOf(seriesIdx);
        if (posInStack !== -1) {
          const isTop = posInStack === 0;
          const isBottom = posInStack === barSeriesIdxs.length - 1;
          bottomRadius = isBottom ? curRadius : 0;
          topRadius = isTop ? curRadius : 0;
        }
      }

      const barPaths = uPlot.paths.bars!({
        radius: [bottomRadius, topRadius],
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

          if (!barPixelGeom[sidx]) {
            barPixelGeom[sidx] = [];
          }
          barPixelGeom[sidx][didx] = {
            centerX: plotCenterX,
            topY: Math.min(plotTop, plotBot),
            botY: Math.max(plotTop, plotBot),
          };

          if (quadTree) {
            quadTree.add({
              x: plotLeft,
              y: plotTop,
              w: width,
              h: height,
              sidx,
              didx,
            });
          }
        },
      });

      return barPaths(u, seriesIdx, idx0, idx1);
    };
  }

  return {
    hooks: {
      init(u) {
        const uniqueClass = `bar-cursor-${Date.now()}`;
        u.root.classList.add(uniqueClass);

        const styleTag = document.createElement("style");
        styleTag.textContent = `
          .${uniqueClass} .u-cursor-pt {
            border-radius: 0 !important;
          }
        `;
        document.head.appendChild(styleTag);
      },

      drawClear(u) {
        quadTree = quadTree || new Quadtree(0, 0, u.bbox.width, u.bbox.height);
        quadTree.clear();
        hovered = null;

        for (let i = 0; i < u.series.length; i++) {
          (u.series[i] as any)._paths = null;
        }

        for (let i = 0; i < barPixelGeom.length; i++) {
          barPixelGeom[i] = [];
        }

        barSeriesIdxs = [];
        for (let i = 1; i < u.series.length; i++) {
          if (!ignore.includes(i)) {
            barSeriesIdxs.push(i);
          }
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
          stackedYs = new Array(u.series.length).fill(null);

          for (const i of barSeriesIdxs) {
            xLayouts[i] = layout;
          }

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

      setScale(u, scaleKey) {
        if (scaleKey !== "x" && scaleKey !== "y") return;

        let barWidthPx = 0;
        for (let sidx = 1; sidx < u.series.length; sidx++) {
          if (ignore.includes(sidx)) continue;
          const layout = xLayouts[sidx];
          if (layout && layout.x0.length > 1) {
            const domainLeft = layout.x0[0];
            const domainRight = layout.x0[0] + layout.size[0];
            const pxLeft = u.valToPos(domainLeft, "x", true);
            const pxRight = u.valToPos(domainRight, "x", true);
            barWidthPx = Math.abs(pxRight - pxLeft);
            break;
          }
        }

        const newRadius = barWidthPx > 2 ? userRadius : 0;
        if (newRadius !== oldRadius) {
          curRadius = newRadius;
          oldRadius = newRadius;
          for (let i = 0; i < u.series.length; i++) {
            (u.series[i] as any)._paths = null;
          }
          u.redraw();
        }
      },
    },

    opts(u, optsObj) {
      optsObj.cursor = optsObj.cursor || {};
      optsObj.cursor.drag = optsObj.cursor.drag || { x: true, y: true };

      optsObj.cursor.points = optsObj.cursor.points || {};
      if (!optsObj.cursor.points.fill) {
        optsObj.cursor.points.fill = cursorFill;
      }

      optsObj.cursor.dataIdx = (chart, sidx) => {
        if (sidx === 0 || ignore.includes(sidx)) return null;
        if (!quadTree) return null;

        const cursorLeft = chart.cursor.left;
        const cursorTop = chart.cursor.top;
        if (cursorLeft == null || cursorTop == null) return null;

        const cx = cursorLeft * pxRatio;
        const cy = cursorTop * pxRatio;

        let found: QuadObj | null = null;
        quadTree.get(cx, cy, 1, 1, (o: QuadObj) => {
          if (
            o.sidx === sidx &&
            pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)
          ) {
            found = o;
          }
        });

        if (found) {
          hovered = found;

          return (found as QuadObj).didx;
        } else {
          if (hovered && hovered.sidx === sidx) {
            hovered = null;
          }
          return null;
        }
      };

      optsObj.cursor.points.bbox = (_chart: uPlot, sidx: number) => {
        if (!hovered || hovered.sidx !== sidx) {
          return { left: -10, top: -10, width: 0, height: 0 };
        }
        return {
          left: hovered.x / pxRatio,
          top: hovered.y / pxRatio,
          width: hovered.w / pxRatio,
          height: hovered.h / pxRatio,
        };
      };

      if (autoScaleY) {
        optsObj.scales = optsObj.scales || {};
        optsObj.scales.y = optsObj.scales.y || {};
        const userRangeFn = optsObj.scales.y.range;

        optsObj.scales.y.range = (uPlotInst, min, max, scaleKey) => {
          const barSeriesIdxs: number[] = [];
          for (let i = 1; i < uPlotInst.series.length; i++) {
            if (!ignore.includes(i)) {
              barSeriesIdxs.push(i);
            }
          }

          const xVals = uPlotInst.data[0] as number[] | undefined;
          if (!xVals || !barSeriesIdxs.length) {
            return typeof userRangeFn === "function"
              ? userRangeFn(uPlotInst, min, max, scaleKey)
              : [0, max];
          }

          if (stacked) {
            let maxStackVal = 0;
            for (let i = 0; i < xVals.length; i++) {
              let sum = 0;
              for (let s of barSeriesIdxs) {
                const val = (uPlotInst.data[s] as (number | null)[])[i] ?? 0;
                sum += val;
              }
              if (sum > maxStackVal) maxStackVal = sum;
            }
            const newMin = Math.min(0, min);
            const newMax = Math.max(max, maxStackVal);
            return typeof userRangeFn === "function"
              ? userRangeFn(uPlotInst, newMin, newMax, scaleKey)
              : [0, newMax];
          } else {
            const newMin = Math.min(0, min);
            const newMax = Math.max(0, max);
            return typeof userRangeFn === "function"
              ? userRangeFn(uPlotInst, newMin, newMax, scaleKey)
              : [0, newMax];
          }
        };
      }

      for (let i = 1; i < optsObj.series.length; i++) {
        if (ignore.includes(i)) continue;
        optsObj.series[i].paths = barsBuilderFactory();
        optsObj.series[i].points = {
          show: showValues
            ? (u: uPlot, seriesIdx: number) => {
                drawValues(u, seriesIdx);
                return false;
              }
            : false,
        };
      }
    },
  };
}
