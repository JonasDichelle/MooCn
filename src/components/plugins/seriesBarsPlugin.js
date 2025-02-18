import uPlot from "uplot";
import { Quadtree, pointWithin } from "./lib/quadtree.js";
import { distr, SPACE_BETWEEN } from "./lib/distr.js";

export function seriesBarsPlugin(opts) {
  let pxRatio = 1;
  let font = "10px Arial";

  const {
    ignore = [],
    radius = 0,
    ori = 0,
    dir = 1,
    stacked = false,
    disp = {},
  } = opts;

  let qt;
  let hRect;

  function setPxRatio() {
    if (typeof window !== "undefined") {
      pxRatio = devicePixelRatio;
      font = Math.round(10 * pxRatio) + "px Arial";
    }
  }
  setPxRatio();

  if (typeof window !== "undefined") {
    window.addEventListener("dppxchange", setPxRatio);
  }

  const groupWidth = 0.9;
  const groupDistr = SPACE_BETWEEN;

  const barWidth = 1;
  const barDistr = SPACE_BETWEEN;

  function distrTwo(
    groupCount,
    barCount,
    barSpread = true,
    _groupWidth = groupWidth
  ) {
    let out = Array.from({ length: barCount }, () => ({
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

  let barsPctLayout;

  const barsBuilder = uPlot.paths.bars({
    radius,
    disp: {
      x0: {
        unit: 2,
        values: (u, seriesIdx) => barsPctLayout[seriesIdx].offs,
      },
      size: {
        unit: 2,
        values: (u, seriesIdx) => barsPctLayout[seriesIdx].size,
      },
      ...disp,
    },
    each: (u, seriesIdx, dataIdx, lft, top, wid, hgt) => {
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

  function drawPoints(u, sidx, i0, i1) {
    const ctx = u.ctx;
    ctx.save();

    ctx.font = font;
    ctx.fillStyle = "black";

    uPlot.orient(
      u,
      sidx,
      (
        series,
        dataX,
        dataY,
        scaleX,
        scaleY,
        valToPosX,
        valToPosY,
        xOff,
        yOff,
        xDim,
        yDim
      ) => {
        const _dir = dir * (ori == 0 ? 1 : -1);

        const widPx = Math.round(barsPctLayout[sidx].size[0] * xDim);

        barsPctLayout[sidx].offs.forEach((offs, ix) => {
          const val = dataY[ix];
          if (val != null) {
            let x0 = xDim * offs;
            let lft = Math.round(xOff + (_dir == 1 ? x0 : xDim - x0 - widPx));
            let barWid = Math.round(widPx);

            let yPos = valToPosY(val, scaleY, yDim, yOff);
            let xPos =
              ori == 0 ? Math.round(lft + barWid / 2) : Math.round(yPos);

            let yPos2 =
              ori == 0 ? Math.round(yPos) : Math.round(lft + barWid / 2);

            ctx.textAlign = ori == 0 ? "center" : val >= 0 ? "left" : "right";
            ctx.textBaseline =
              ori == 1 ? "middle" : val >= 0 ? "bottom" : "top";

            ctx.fillText(val, xPos, yPos2);
          }
        });
      }
    );

    ctx.restore();
  }

  function range(u, dataMin, dataMax) {
    let [min, max] = uPlot.rangeNum(0, dataMax, 0.1, true);
    return [0, max];
  }

  return {
    hooks: {
      drawClear: (u) => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);
        qt.clear();

        u.series.forEach((s) => {
          s._paths = null;
        });

        let groupCount = u.data[0].length;
        let barCount = u.series.length - 1 - ignore.length;

        barsPctLayout = [null].concat(
          distrTwo(groupCount, barCount, !stacked, groupWidth)
        );
      },
    },
    opts: (u, optsObj) => {
      optsObj.axes = optsObj.axes || [];

      if (!optsObj.axes[0]) {
        optsObj.axes[0] = {};
      }

      const yScaleOpts = {
        range,
        ori: ori == 0 ? 1 : 0,
      };

      uPlot.assign(optsObj, {
        select: { show: false },
        cursor: {
          x: false,
          y: false,

          dataIdx: (u, seriesIdx) => {
            if (seriesIdx == 1) {
              hRect = null;
              let cx = u.cursor.left * pxRatio;
              let cy = u.cursor.top * pxRatio;

              qt.get(cx, cy, 1, 1, (o) => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h)) {
                  hRect = o;
                }
              });
            }
            return hRect && seriesIdx == hRect.sidx ? hRect.didx : null;
          },
          points: {
            fill: "rgba(255,255,255,0.25)",
            bbox: (u, seriesIdx) => {
              let isHovered = hRect && seriesIdx == hRect.sidx;
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
            range: (u, min, max) => {
              min = 0;
              max = Math.max(1, u.data[0].length - 1);

              let pctOffset = 0;
              distr(
                u.data[0].length,
                groupWidth,
                groupDistr,
                0,
                (di, lftPct, widPct) => {
                  pctOffset = lftPct + widPct / 2;
                }
              );

              let rn = max - min;
              if (pctOffset == 0.5) {
                min -= rn;
              } else {
                let upScale = 1 / (1 - pctOffset * 2);
                let offset = (upScale * rn - rn) / 2;
                min -= offset;
                max += offset;
              }
              return [min, max];
            },
          },

          rend: yScaleOpts,
          size: yScaleOpts,
          mem: yScaleOpts,
          inter: yScaleOpts,
          toggle: yScaleOpts,
        },
      });

      if (ori == 1) {
        optsObj.padding = [0, null, 0, null];
      }

      uPlot.assign(optsObj.axes[0], {
        splits: (u) => {
          const _dir = dir * (ori == 0 ? 1 : -1);
          let splits = u._data[0].slice();
          return _dir == 1 ? splits : splits.reverse();
        },
        values: (u) => u.data[0],
        gap: 10,
        size: ori == 0 ? 40 : 60,
        labelSize: 20,
        grid: { show: false },
        ticks: { show: false },
        side: ori == 0 ? 2 : 3,
      });

      optsObj.series.forEach((s, i) => {
        if (i > 0 && !ignore.includes(i)) {
          uPlot.assign(s, {
            paths: barsBuilder,
            points: {
              show: drawPoints,
            },
          });
        }
      });
    },
  };
}
