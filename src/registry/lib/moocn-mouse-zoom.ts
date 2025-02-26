import uPlot from "uplot";

export function wheelZoomPlugin(opts: { factor?: number } = {}) {
  const factor = opts.factor ?? 0.75;

  let xMin: number, xMax: number;
  let yMin: number, yMax: number;
  let xRange: number, yRange: number;

  let rect: DOMRect;
  let rafPending = false;

  let lastWheelEvent = 0;
  const WHEEL_THROTTLE_MS = 16;

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
        rect = over.getBoundingClientRect();

        const updateRect = () => {
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              rect = over.getBoundingClientRect();
              rafPending = false;
            });
          }
        };

        window.addEventListener("resize", updateRect, { passive: true });

        new ResizeObserver(updateRect).observe(over);

        over.addEventListener("mousedown", (e) => {
          if (e.button === 1) {
            e.preventDefault();

            const startX = e.clientX;

            const scXMin0 = u.scales.x.min!;
            const scXMax0 = u.scales.x.max!;
            const visibleRange = scXMax0 - scXMin0;

            const xUnitsPerPx = visibleRange / rect.width;

            let lastX = startX;
            let rafId: number | null = null;

            function updatePan(clientX: number) {
              if (rafId !== null) return;

              rafId = requestAnimationFrame(() => {
                const deltaX = clientX - lastX;
                lastX = clientX;

                const dx = xUnitsPerPx * deltaX;

                const currentMin = u.scales.x.min!;
                const currentMax = u.scales.x.max!;

                let nxMin = currentMin - dx;
                let nxMax = currentMax - dx;

                if (nxMin < xMin) {
                  const offset = xMin - nxMin;
                  nxMin = xMin;
                  nxMax = nxMax + offset;
                } else if (nxMax > xMax) {
                  const offset = nxMax - xMax;
                  nxMax = xMax;
                  nxMin = nxMin - offset;
                }

                u.setScale("x", { min: nxMin, max: nxMax });
                rafId = null;
              });
            }

            function onmove(ev: MouseEvent) {
              ev.preventDefault();
              updatePan(ev.clientX);
            }

            function onup() {
              document.removeEventListener("mousemove", onmove);
              document.removeEventListener("mouseup", onup);
              if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
            }

            document.addEventListener("mousemove", onmove);
            document.addEventListener("mouseup", onup);
          }
        });

        over.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();

            const now = performance.now();
            if (now - lastWheelEvent < WHEEL_THROTTLE_MS) return;
            lastWheelEvent = now;

            const left = e.clientX - rect.left;

            if (left < 0 || left > rect.width) return;

            const leftPct = left / rect.width;

            const xVal = u.posToVal(left, "x");
            if (xVal === null || !isFinite(xVal)) return;

            const oxRange = u.scales.x.max! - u.scales.x.min!;

            const zoomOut = e.deltaY > 0;
            const nxRange = zoomOut ? oxRange / factor : oxRange * factor;

            let nxMin = xVal - leftPct * nxRange;
            let nxMax = nxMin + nxRange;

            if (nxRange > xRange) {
              nxMin = xMin;
              nxMax = xMax;
            } else if (nxMin < xMin) {
              nxMin = xMin;
              nxMax = xMin + nxRange;
            } else if (nxMax > xMax) {
              nxMax = xMax;
              nxMin = xMax - nxRange;
            }

            u.setScale("x", { min: nxMin, max: nxMax });
          },
          { passive: false }
        );
      },

      setData: (u: uPlot) => {
        if (u.data[0] && u.data[0].length > 0) {
          const dataXMin = u.data[0][0];
          const dataXMax = u.data[0][u.data[0].length - 1];

          let updated = false;
          if (dataXMin < xMin) {
            xMin = dataXMin;
            updated = true;
          }
          if (dataXMax > xMax) {
            xMax = dataXMax;
            updated = true;
          }

          if (updated) {
            xRange = xMax - xMin;
          }
        }
      },
    },
  } as uPlot.Plugin;
}
