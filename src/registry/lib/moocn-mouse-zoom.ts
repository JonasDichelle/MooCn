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

  // Cache plot dimensions and update on resize
  let rect: DOMRect;
  let rafPending = false;

  // For throttling wheel events
  let lastWheelEvent = 0;
  const WHEEL_THROTTLE_MS = 16; // ~60fps

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
        // Store the initial full range of the data
        xMin = u.scales.x.min!;
        xMax = u.scales.x.max!;
        yMin = u.scales.y.min!;
        yMax = u.scales.y.max!;

        xRange = xMax - xMin;
        yRange = yMax - yMin;

        const over = u.over;
        rect = over.getBoundingClientRect();

        // Update rect when window resizes
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
        // Also update when the plot might resize
        new ResizeObserver(updateRect).observe(over);

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
            const visibleRange = scXMax0 - scXMin0;

            // Pre-calculate units per pixel for better performance
            const xUnitsPerPx = visibleRange / rect.width;

            let lastX = startX;
            let rafId: number | null = null;

            function updatePan(clientX: number) {
              if (rafId !== null) return; // Skip if a frame is already pending

              rafId = requestAnimationFrame(() => {
                const deltaX = clientX - lastX;
                lastX = clientX;

                // Scale pixel movement to data units
                const dx = xUnitsPerPx * deltaX;

                // Get current scale values (they may have changed)
                const currentMin = u.scales.x.min!;
                const currentMax = u.scales.x.max!;

                // new X bounds
                let nxMin = currentMin - dx;
                let nxMax = currentMax - dx;

                // Apply clamping
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

        // Wheel scroll zoom around cursor (X only)
        over.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();

            // Throttle wheel events for smoother zooming
            const now = performance.now();
            if (now - lastWheelEvent < WHEEL_THROTTLE_MS) return;
            lastWheelEvent = now;

            // Calculate cursor position relative to the plot
            const left = e.clientX - rect.left;

            // Only proceed if cursor is within plot area
            if (left < 0 || left > rect.width) return;

            // Calculate position as percentage of plot width
            const leftPct = left / rect.width;

            // Convert cursor position to value in data space
            const xVal = u.posToVal(left, "x");
            if (xVal === null || !isFinite(xVal)) return;

            // Current visible range
            const oxRange = u.scales.x.max! - u.scales.x.min!;

            // Calculate new range based on zoom direction
            const zoomOut = e.deltaY > 0; // scroll down => zoom out
            const nxRange = zoomOut ? oxRange / factor : oxRange * factor;

            // Calculate new min/max ensuring the cursor position stays fixed
            let nxMin = xVal - leftPct * nxRange;
            let nxMax = nxMin + nxRange;

            // Quick clamp without array creation for better performance
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

            // Apply the new scales
            u.setScale("x", { min: nxMin, max: nxMax });
          },
          { passive: false }
        );
      },

      // Update the bounds when the data changes
      setData: (u: uPlot) => {
        // Only update if data is available
        if (u.data[0] && u.data[0].length > 0) {
          // Only update the full range if it's actually bigger
          const dataXMin = u.data[0][0];
          const dataXMax = u.data[0][u.data[0].length - 1];

          // Only update if needed
          let updated = false;
          if (dataXMin < xMin) {
            xMin = dataXMin;
            updated = true;
          }
          if (dataXMax > xMax) {
            xMax = dataXMax;
            updated = true;
          }

          // Only recalculate range if min/max changed
          if (updated) {
            xRange = xMax - xMin;
          }
        }
      },
    },
  } as uPlot.Plugin;
}
