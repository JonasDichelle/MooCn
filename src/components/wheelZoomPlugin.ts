import uPlot from "uplot";

/**
 * A plugin for uPlot that supports:
 * 1) Mouse wheel zoom around cursor (X & Y)
 * 2) Middle-click + drag to pan (X & Y)
 */
export function wheelZoomPlugin(opts: { factor?: number } = {}) {
  const factor = opts.factor ?? 0.75;

  let xMin: number, xMax: number;
  let yMin: number, yMax: number;
  let xRange: number, yRange: number;

  function clampRange(
    newRange: number,
    newMin: number,
    newMax: number,
    fullRange: number,
    fullMin: number,
    fullMax: number
  ) {
    if (newRange > fullRange) {
      newMin = fullMin;
      newMax = fullMax;
    } else if (newMin < fullMin) {
      newMin = fullMin;
      newMax = fullMin + newRange;
    } else if (newMax > fullMax) {
      newMax = fullMax;
      newMin = fullMax - newRange;
    }
    return [newMin, newMax];
  }

  return {
    hooks: {
      ready: (u: uPlot) => {
        xMin = u.scales.x.min!;
        xMax = u.scales.x.max!;
        yMin = u.scales.y.min!;
        yMax = u.scales.y.max!;

        xRange = xMax - xMin;
        yRange = yMax - yMin;

        const over = u.over;
        const rect = over.getBoundingClientRect();

        // Middle-click drag pan in both X & Y
        over.addEventListener("mousedown", (e) => {
          // Middle button is e.button == 1 on Windows
          if (e.button === 1) {
            e.preventDefault();

            // initial mouse position
            const startX = e.clientX;
            const startY = e.clientY;

            const scXMin0 = u.scales.x.min!;
            const scXMax0 = u.scales.x.max!;
            const scYMin0 = u.scales.y.min!;
            const scYMax0 = u.scales.y.max!;

            // how many "data units" per pixel horizontally
            const xUnitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x");
            // how many "data units" per pixel vertically
            const yUnitsPerPx = u.posToVal(1, "y") - u.posToVal(0, "y");

            function onmove(ev: MouseEvent) {
              ev.preventDefault();
              const deltaX = ev.clientX - startX;
              const deltaY = ev.clientY - startY;

              const dx = xUnitsPerPx * deltaX;
              const dy = yUnitsPerPx * deltaY;

              // new X bounds
              let nxMin = scXMin0 - dx;
              let nxMax = scXMax0 - dx;
              [nxMin, nxMax] = clampRange(
                nxMax - nxMin,
                nxMin,
                nxMax,
                xRange,
                xMin,
                xMax
              );

              // new Y bounds
              let nyMin = scYMin0 - dy;
              let nyMax = scYMax0 - dy;
              [nyMin, nyMax] = clampRange(
                nyMax - nyMin,
                nyMin,
                nyMax,
                yRange,
                yMin,
                yMax
              );

              u.batch(() => {
                u.setScale("x", { min: nxMin, max: nxMax });
                u.setScale("y", { min: nyMin, max: nyMax });
              });
            }

            function onup() {
              document.removeEventListener("mousemove", onmove);
              document.removeEventListener("mouseup", onup);
            }

            document.addEventListener("mousemove", onmove);
            document.addEventListener("mouseup", onup);
          }
        });

        // Wheel scroll zoom around cursor (X & Y)
        over.addEventListener("wheel", (e) => {
          e.preventDefault();

          const left = u.cursor.left!;
          const top = u.cursor.top!;

          const leftPct = left / rect.width;
          const btmPct = 1 - top / rect.height;

          const xVal = u.posToVal(left, "x");
          const yVal = u.posToVal(top, "y");

          const oxRange = u.scales.x.max! - u.scales.x.min!;
          const oyRange = u.scales.y.max! - u.scales.y.min!;

          const zoomOut = e.deltaY > 0; // scroll down => zoom out
          const nxRange = zoomOut ? oxRange / factor : oxRange * factor;
          const nyRange = zoomOut ? oyRange / factor : oyRange * factor;

          let nxMin = xVal - leftPct * nxRange;
          let nxMax = nxMin + nxRange;
          [nxMin, nxMax] = clampRange(
            nxRange,
            nxMin,
            nxMax,
            xRange,
            xMin,
            xMax
          );

          let nyMin = yVal - btmPct * nyRange;
          let nyMax = nyMin + nyRange;
          [nyMin, nyMax] = clampRange(
            nyRange,
            nyMin,
            nyMax,
            yRange,
            yMin,
            yMax
          );

          u.batch(() => {
            u.setScale("x", { min: nxMin, max: nxMax });
            u.setScale("y", { min: nyMin, max: nyMax });
          });
        });
      },
    },
  } as uPlot.Plugin;
}
