"use client";

import * as React from "react";
import UplotReact from "uplot-react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/registry/lib/moocn-utils";
import { cloneAndResolveColors } from "@/registry/lib/moocn-utils";

export type MoocnOptions = Omit<
  uPlot.Options,
  "width" | "height" | "select"
> & {
  select?: Partial<uPlot.Select>;
};

export interface MoocnProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  options: MoocnOptions;
  data: (number | null)[][] | Float64Array[];
}

export function Moocn(props: MoocnProps) {
  const { options, data, className, style, ...rest } = props;
  const [hasMeasured, setHasMeasured] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDarkMode = useThemeMode();
  const [chartWidth, setChartWidth] = React.useState(0);
  const [chartHeight, setChartHeight] = React.useState(0);

  const [chartInstance, setChartInstance] = React.useState<uPlot | null>(null);

  const typedData = React.useMemo(() => {
    return data.map((arr) => {
      if (
        arr instanceof Float64Array ||
        arr instanceof Float32Array ||
        arr instanceof Int32Array ||
        arr instanceof Int16Array ||
        arr instanceof Int8Array ||
        arr instanceof Uint32Array ||
        arr instanceof Uint16Array ||
        arr instanceof Uint8ClampedArray ||
        arr instanceof Uint8Array
      ) {
        return arr;
      } else {
        return new Float64Array(arr.map((val) => (val == null ? NaN : val)));
      }
    });
  }, [data]);

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

  const { handleChartCreate, handleSetCursor } = React.useContext(MoocnContext);

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
      hooks: mergedHooks,
    } as uPlot.Options;
  }, [colorResolvedOpts, handleSetCursor]);

  const onCreate = React.useCallback(
    (instance: uPlot) => {
      setChartInstance(instance);
      handleChartCreate?.(instance);
    },
    [handleChartCreate]
  );

  React.useEffect(() => {
    if (chartInstance) {
      chartInstance.setSize({
        width: chartWidth,
        height: chartHeight,
      });
    }
  }, [chartWidth, chartHeight, chartInstance]);

  return (
    <div className={cn("relative", className)} style={style} {...rest}>
      <div className="block box-border w-full h-full" ref={containerRef}>
        <div
          className="absolute h-full w-full"
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
