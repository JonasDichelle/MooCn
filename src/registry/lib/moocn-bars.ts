import uPlot from "uplot";
import { computeCssColor } from "@/registry/lib/moocn-utils";

function roundDec(val: number, dec: number): number {
  const factor = 10 ** dec;
  return Math.round(val * factor) / factor;
}

export const SPACE_BETWEEN = 1;
export const SPACE_AROUND = 2;
export const SPACE_EVENLY = 3;

export function distr(
  numItems: number,
  sizeFactor: number,
  justify: number,
  onlyIdx: number | null,
  each: (idx: number, offset: number, size: number) => void
): void {
  const space = 1 - sizeFactor;

  let gap =
    justify === SPACE_BETWEEN
      ? space / (numItems - 1)
      : justify === SPACE_AROUND
      ? space / numItems
      : justify === SPACE_EVENLY
      ? space / (numItems + 1)
      : 0;

  if (isNaN(gap) || gap === Infinity) {
    gap = 0;
  }

  let offs =
    justify === SPACE_BETWEEN
      ? 0
      : justify === SPACE_AROUND
      ? gap / 2
      : justify === SPACE_EVENLY
      ? gap
      : 0;

  const iwid = sizeFactor / numItems;
  const _iwid = roundDec(iwid, 6);

  function coord(i: number, offs: number, iwid: number, gap: number) {
    return roundDec(offs + i * (iwid + gap), 6);
  }

  if (onlyIdx == null) {
    for (let i = 0; i < numItems; i++) {
      each(i, coord(i, offs, iwid, gap), _iwid);
    }
  } else {
    each(onlyIdx, coord(onlyIdx, offs, iwid, gap), _iwid);
  }
}

export function pointWithin(
  px: number,
  py: number,
  rlft: number,
  rtop: number,
  rrgt: number,
  rbtm: number
): boolean {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

const MAX_OBJECTS = 10;
const MAX_LEVELS = 4;

export interface QuadObj {
  x: number;
  y: number;
  w: number;
  h: number;
  sidx?: number;
  didx?: number;
}

export class Quadtree {
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

  split(): void {
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

  quads(
    x: number,
    y: number,
    w: number,
    h: number,
    cb: (quad: Quadtree) => void
  ): void {
    if (!this.q) return;

    const hzMid = this.x + this.w / 2;
    const vtMid = this.y + this.h / 2;
    const startIsNorth = y < vtMid;
    const startIsWest = x < hzMid;
    const endIsEast = x + w > hzMid;
    const endIsSouth = y + h > vtMid;

    startIsNorth && endIsEast && cb(this.q[0]);
    startIsNorth && startIsWest && cb(this.q[1]);
    startIsWest && endIsSouth && cb(this.q[2]);
    endIsEast && endIsSouth && cb(this.q[3]);
  }

  add(o: QuadObj): void {
    if (this.q) {
      this.quads(o.x, o.y, o.w, o.h, (quad) => {
        quad.add(o);
      });
    } else {
      this.o.push(o);
      if (this.o.length > MAX_OBJECTS && this.l < MAX_LEVELS) {
        this.split();
        this.o.forEach((obj) => {
          this.quads(obj.x, obj.y, obj.w, obj.h, (quad) => {
            quad.add(obj);
          });
        });
        this.o.length = 0;
      }
    }
  }

  get(x: number, y: number, w: number, h: number, cb: (obj: QuadObj) => void) {
    for (let i = 0; i < this.o.length; i++) {
      cb(this.o[i]);
    }
    if (this.q) {
      this.quads(x, y, w, h, (quad) => {
        quad.get(x, y, w, h, cb);
      });
    }
  }

  clear(): void {
    this.o.length = 0;
    this.q = null;
  }
}

export interface SeriesBarsPluginOpts {
  ignore?: number[];
  radius?: number;
  ori?: 0 | 1;
  dir?: 1 | -1;
  stacked?: boolean;
  disp?: Record<string, any>;
  groupWidth?: number;
  barWidth?: number;
  showValues?: boolean;
  valueColor?: string;
}

export function seriesBarsPlugin(opts: SeriesBarsPluginOpts): uPlot.Plugin {
  let pxRatio = 1;
  let font = "10px Arial";

  const {
    ignore = [],
    radius = 0,
    ori = 0,
    dir = 1,
    stacked = false,
    disp = {},
    groupWidth = 1.0,
    barWidth = 1.0,
    showValues = false,
    valueColor = "black",
  } = opts;

  let qt: Quadtree;
  let hRect: QuadObj | null = null;

  function setPxRatio() {
    if (typeof window !== "undefined") {
      pxRatio = window.devicePixelRatio;
      font = Math.round(10 * pxRatio) + "px Arial";
    }
  }
  setPxRatio();

  if (typeof window !== "undefined") {
    window.addEventListener("dppxchange", setPxRatio);
  }

  const groupDistr = SPACE_BETWEEN;
  const barDistr = SPACE_BETWEEN;

  function distrTwo(
    groupCount: number,
    barCount: number,
    barSpread = true,
    _groupWidth = groupWidth
  ): Array<{ offs: number[]; size: number[] }> {
    const out = Array.from({ length: barCount }, () => ({
      offs: Array(groupCount).fill(0),
      size: Array(groupCount).fill(0),
    }));

    distr(
      groupCount,
      _groupWidth,
      groupDistr,
      null,
      (groupIdx, groupOffPct, groupDimPct) => {
        distr(
          barCount,
          barWidth,
          barDistr,
          null,
          (barIdx, barOffPct, barDimPct) => {
            out[barIdx].offs[groupIdx] =
              groupOffPct + (barSpread ? groupDimPct * barOffPct : 0);
            out[barIdx].size[groupIdx] =
              groupDimPct * (barSpread ? barDimPct : 1);
          }
        );
      }
    );

    return out;
  }

  let barsPctLayout: Array<null | { offs: number[]; size: number[] }>;

  const barsBuilder = uPlot.paths.bars({
    radius,
    disp: {
      x0: {
        unit: 2,
        values: (u: any, seriesIdx: number) => barsPctLayout[seriesIdx]?.offs,
      },
      size: {
        unit: 2,
        values: (u: any, seriesIdx: number) => barsPctLayout[seriesIdx]?.size,
      },
      ...disp,
    },

    each: (
      u: any,
      seriesIdx: number,
      dataIdx: number,
      lft: number,
      top: number,
      wid: number,
      hgt: number
    ) => {
      lft -= u.bbox.left;
      top -= u.bbox.top;
      qt.add({
        x: lft,
        y: top,
        w: wid,
        h: hgt,
        sidx: seriesIdx,
        didx: dataIdx,
      });
    },
  });

  function drawPoints(u: any, sidx: number) {
    if (!showValues) return;

    const ctx = u.ctx;
    ctx.save();

    ctx.font = font;
    ctx.fillStyle = computeCssColor(valueColor);

    uPlot.orient(
      u,
      sidx,
      (
        _series: any,
        dataX: number[],
        dataY: number[],
        scaleX: any,
        scaleY: any,
        valToPosX: (
          val: number,
          scaleKey: any,
          dim: number,
          off: number
        ) => number,
        valToPosY: (
          val: number,
          scaleKey: any,
          dim: number,
          off: number
        ) => number,
        xOff: number,
        yOff: number,
        xDim: number,
        yDim: number
      ) => {
        const _dir = dir * (ori === 0 ? 1 : -1);

        const widPx = Math.round((barsPctLayout[sidx]?.size[0] ?? 0) * xDim);

        barsPctLayout[sidx]?.offs.forEach((offs, ix) => {
          const val = dataY[ix];
          if (val != null) {
            const x0 = xDim * offs;
            const lft = Math.round(
              xOff + (_dir === 1 ? x0 : xDim - x0 - widPx)
            );
            const barWid = Math.round(widPx);

            const yPos = valToPosY(val, scaleY, yDim, yOff);
            const xPos =
              ori === 0 ? Math.round(lft + barWid / 2) : Math.round(yPos);
            const yPos2 =
              ori === 0 ? Math.round(yPos) : Math.round(lft + barWid / 2);

            ctx.textAlign = ori === 0 ? "center" : val >= 0 ? "left" : "right";
            ctx.textBaseline =
              ori === 1 ? "middle" : val >= 0 ? "bottom" : "top";

            ctx.fillText(val, xPos, yPos2);
          }
        });
      }
    );

    ctx.restore();
  }

  return {
    hooks: {
      drawClear: (u: any) => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);
        qt.clear();

        u.series.forEach((s: any) => {
          s._paths = null;
        });

        const groupCount = u.data[0].length;
        const barCount = u.series.length - 1 - ignore.length;

        barsPctLayout = [null].concat(
          distrTwo(groupCount, barCount, !stacked, groupWidth)
        );
      },
    },

    opts: (u: any, optsObj: any) => {
      optsObj.axes = optsObj.axes || [];

      if (!optsObj.axes[0]) {
        optsObj.axes[0] = {};
      }

      uPlot.assign(optsObj, {
        select: { show: false },
        cursor: {
          drag: {
            x: true,
            y: true,
          },
          x: false,
          y: false,
          dataIdx: (u2: any, seriesIdx: number) => {
            if (seriesIdx === 1) {
              hRect = null;
              const cx = u2.cursor.left * pxRatio;
              const cy = u2.cursor.top * pxRatio;

              qt.get(cx, cy, 1, 1, (o) => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)) {
                  hRect = o;
                }
              });
            }
            return hRect && seriesIdx === hRect.sidx ? hRect.didx : null;
          },
          points: {
            fill: "rgba(255,255,255,0.25)",
            bbox: (_u2: any, seriesIdx: number) => {
              const isHovered = hRect && seriesIdx === hRect.sidx;
              if (!isHovered) {
                return { left: -10, top: -10, width: 0, height: 0 };
              }
              return {
                left: hRect.x / pxRatio,
                top: hRect.y / pxRatio,
                width: hRect.w / pxRatio,
                height: hRect.h / pxRatio,
              };
            },
          },
        },
        scales: {
          x: {
            time: false,
            distr: 2,
            ori,
            dir,
            range: (u3: any, min: number, max: number) => {
              min = 0;
              max = Math.max(1, u3.data[0].length - 1);

              let pctOffset = 0;
              distr(
                u3.data[0].length,
                groupWidth,
                groupDistr,
                0,
                (_di, lftPct, widPct) => {
                  pctOffset = lftPct + widPct / 2;
                }
              );

              const rn = max - min;

              if (pctOffset === 0.5) {
                min -= rn;
              } else {
                const upScale = 1 / (1 - pctOffset * 2);
                const offset = (upScale * rn - rn) / 2;
                min -= offset;
                max += offset;
              }

              return [min, max];
            },
          },
        },
      });

      optsObj.series.forEach((s: any, i: number) => {
        if (i > 0 && !ignore.includes(i)) {
          uPlot.assign(s, {
            paths: barsBuilder,
            points: {
              show: showValues ? drawPoints : false,
            },
          });
        }
      });
    },
  } as uPlot.Plugin;
}
