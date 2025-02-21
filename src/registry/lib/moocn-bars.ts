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

export class Quadtree {
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
      const l = o.x,
        r = o.x + o.w,
        t = o.y,
        b = o.y + o.h;
      if (px >= l && px <= r && py >= t && py <= b) {
        cb(o);
      }
    }
  }
}

interface BarPixelGeom {
  centerX: number;
  topY: number;
  botY: number;
}

type BarPixelGeomStore = Array<Array<BarPixelGeom | null>>;

export interface SeriesBarsPluginOpts {
  ignore?: number[];
  radius?: number;
  groupWidth?: number;
  barWidth?: number;
  showValues?: boolean;
  valueColor?: string;
  stacked?: boolean;
}

interface BarDomainLayout {
  x0: number[];
  size: number[];
}

function buildBarDomainLayouts(
  xVals: number[],
  barCount: number,
  groupWidth: number,
  barWidth: number
): BarDomainLayout[] {
  if (barCount === 0 || xVals.length === 0) return [];

  let avgGap = 1;
  if (xVals.length > 1) {
    let totalGap = 0;
    for (let i = 1; i < xVals.length; i++) {
      totalGap += xVals[i] - xVals[i - 1];
    }
    avgGap = totalGap / (xVals.length - 1);
  }

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

export function seriesBarsPlugin(
  opts: SeriesBarsPluginOpts = {}
): uPlot.Plugin {
  const {
    ignore = [],
    radius = 0,
    groupWidth = 0.9,
    barWidth = 0.9,
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

  if (typeof window !== "undefined") {
    window.addEventListener("dppxchange", setPxRatio);
  }

  let qt: Quadtree;
  let barLayouts: Array<BarDomainLayout | null> = [];

  let barPixelGeom: BarPixelGeomStore = [];

  const barsBuilder = uPlot.paths.bars({
    radius,
    disp: {
      x0: {
        unit: 1,
        values: (self, sidx) => barLayouts[sidx]?.x0 ?? [],
      },
      size: {
        unit: 1,
        values: (self, sidx) => barLayouts[sidx]?.size ?? [],
      },
    },

    each(self, sidx, didx, left, top, width, height) {
      const plotLeft = left - self.bbox.left;
      const plotTop = top - self.bbox.top;

      qt.add({ x: plotLeft, y: plotTop, w: width, h: height, sidx, didx });

      if (!barPixelGeom[sidx]) {
        barPixelGeom[sidx] = [];
      }

      const centerX = plotLeft + width / 2;
      const bot = plotTop + height;

      barPixelGeom[sidx][didx] = {
        centerX,
        topY: plotTop,
        botY: bot,
      };
    },
  });

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

  return {
    hooks: {
      drawClear(u) {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);
        qt.clear();

        for (const s of u.series) {
          s._paths = null;
        }

        barPixelGeom = [];

        const barSeriesIdxs: number[] = [];
        for (let i = 1; i < u.series.length; i++) {
          if (!ignore.includes(i)) barSeriesIdxs.push(i);
        }

        const xVals = (u.data[0] ?? []) as number[];
        const barCount = barSeriesIdxs.length;
        const layouts = buildBarDomainLayouts(
          xVals,
          barCount,
          groupWidth,
          barWidth
        );

        barLayouts = [null];
        let b = 0;
        for (let i = 1; i < u.series.length; i++) {
          if (ignore.includes(i)) {
            barLayouts.push(null);
          } else {
            barLayouts.push(layouts[b]);
            b++;
          }
        }
      },
    },

    opts(u, optsObj) {
      Object.assign(optsObj, {
        select: { show: true },
        cursor: {
          drag: { x: true, y: true },

          dataIdx: () => null,
          points: {
            fill: "rgba(255,255,255,0.25)",
            bbox: (_chart: any, sidx: number) => {
              if (sidx === 0 || ignore.includes(sidx)) {
                return { left: -10, top: -10, width: 0, height: 0 };
              }
              const cx = _chart.cursor.left * pxRatio;
              const cy = _chart.cursor.top * pxRatio;
              let hovered: QuadObj | null = null;
              qt.get(cx, cy, (o) => {
                if (o.sidx === sidx) {
                  hovered = o;
                }
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
