"use client";

import * as React from "react";
import UplotReact from "uplot-react";
import uPlot, { Options as UplotOptions } from "uplot";
import "uplot/dist/uPlot.min.css";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/registry/lib/moocn-utils";
import { cloneAndResolveColors } from "@/registry/lib/moocn-utils";

export interface MoocnProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  options: uPlot.Options;
  data: (number | null)[][];
}

export const Moocn = React.forwardRef<uPlot | null, MoocnProps>(
  (props, forwardedRef) => {
    const { options, data, className, style, ...rest } = props;
    const [hasMeasured, setHasMeasured] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const isDarkMode = useThemeMode();
    const [chartWidth, setChartWidth] = React.useState(options.width ?? 0);
    const [chartHeight, setChartHeight] = React.useState(options.height ?? 0);

    const typedData = data.map(
      (arr) => new Float64Array(arr.map((val) => (val === null ? NaN : val)))
    );

    React.useLayoutEffect(() => {
      const element = containerRef.current;
      if (!element) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === element) {
            const { width, height } = entry.contentRect;
            setChartWidth(Math.floor(width));
            setChartHeight(Math.floor(height));
            setHasMeasured(true);
          }
        }
      });
      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
    }, []);

    const colorResolvedOpts = React.useMemo(() => {
      return cloneAndResolveColors(options);
    }, [options, isDarkMode]);

    const { handleChartCreate, handleSetCursor } =
      React.useContext(MoocnContext);

    const finalOptions = React.useMemo(() => {
      const existingHooks = colorResolvedOpts.hooks ?? {};
      const mergedHooks = {
        ...existingHooks,
        setCursor: [
          ...(existingHooks.setCursor || []),
          (u: uPlot) => {
            handleSetCursor?.(
              u.cursor.idx ?? null,
              u.cursor.left ?? null,
              u.cursor.top ?? null
            );
          },
        ],
      };
      return {
        ...colorResolvedOpts,
        width: chartWidth,
        height: chartHeight,
        hooks: mergedHooks,
      } as uPlot.Options;
    }, [colorResolvedOpts, chartWidth, chartHeight, handleSetCursor]);

    const onCreate = React.useCallback(
      (chartInstance: uPlot) => {
        handleChartCreate?.(chartInstance);
      },
      [handleChartCreate]
    );

    return (
      <div className={cn("relative", className)} style={style} {...rest}>
        <div className="block box-border w-full h-full" ref={containerRef}>
          <div
            className=" absolute h-full w-full"
            style={{
              visibility: hasMeasured ? "visible" : "hidden",
            }}
          >
            <UplotReact
              options={finalOptions}
              data={typedData}
              onCreate={onCreate}
            />
          </div>
        </div>
      </div>
    );
  }
);
Moocn.displayName = "Moocn";

export interface MoocnContextValue {
  chart: uPlot | null;
  cursorState: {
    idx: number | null;
    left: number | null;
    top: number | null;
  };
  handleChartCreate?: (chart: uPlot) => void;
  handleSetCursor?: (
    idx: number | null,
    left: number | null,
    top: number | null
  ) => void;
}

export const MoocnContext = React.createContext<MoocnContextValue>({
  chart: null,
  cursorState: { idx: null, left: null, top: null },
});

export function MoocnProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChart] = React.useState<uPlot | null>(null);
  const [cursorState, setCursorState] = React.useState({
    idx: null as number | null,
    left: null as number | null,
    top: null as number | null,
  });

  const handleChartCreate = React.useCallback((uplotInstance: uPlot) => {
    setChart(uplotInstance);
  }, []);

  const handleSetCursor = React.useCallback(
    (idx: number | null, left: number | null, top: number | null) => {
      setCursorState({ idx, left, top });
    },
    []
  );

  const ctxValue = React.useMemo(
    () => ({
      chart,
      cursorState,
      handleChartCreate,
      handleSetCursor,
    }),
    [chart, cursorState, handleChartCreate, handleSetCursor]
  );

  return (
    <MoocnContext.Provider value={ctxValue}>{children}</MoocnContext.Provider>
  );
}
