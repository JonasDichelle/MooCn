"use client";

import * as React from "react";
import UplotReact from "uplot-react";
import uPlot, { Options as UplotOptions } from "uplot";
import "uplot/dist/uPlot.min.css";
import { cn } from "@/lib/utils";

function expandCssVars(color: string, el: HTMLElement): string {
  const style = getComputedStyle(el);
  const varRegex = /var\((--[a-zA-Z0-9\-_]+)\)/;
  let result = color;
  let match: RegExpMatchArray | null;
  while ((match = result.match(varRegex))) {
    const [fullMatch, varName] = match;
    const varValue = style.getPropertyValue(varName).trim();
    result = result.replace(fullMatch, varValue || "");
  }
  return result;
}

function fixDoubleWrapping(color: string): string {
  const colorFnRegex = /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(\s*(.+)\)$/i;

  while (true) {
    const match = color.match(colorFnRegex);
    if (!match) break;
    const outerFn = match[1].toLowerCase();
    const inside = match[2].trim();
    const innerFnMatch = inside.match(
      /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(/i
    );
    if (!innerFnMatch) break;
    const innerFn = innerFnMatch[1].toLowerCase();
    if (outerFn === innerFn) {
      color = inside;
    } else {
      break;
    }
  }
  return color;
}

function fixSlashPlacement(color: string): string {
  const regex = /^(\w+)\(([^)]*)\)\s*\/\s*(\S+)$/;
  const match = color.match(regex);
  if (match) {
    const [, fnName, inside, alpha] = match;
    return `${fnName}(${inside.trim()} / ${alpha.trim()})`;
  }
  return color;
}

export function computeCssColor(
  color: any,
  el: HTMLElement | null = null
): string {
  if (el === null) {
    if (typeof window === "undefined") return "#000";
    el = document.documentElement;
  }
  const expanded = expandCssVars(color, el);
  const unwrapped = fixDoubleWrapping(expanded);
  const fixedSlash = fixSlashPlacement(unwrapped);
  return fixedSlash;
}

export function checkDarkMode() {
  if (typeof window === "undefined") return false;
  const htmlEl = document.documentElement;
  const isDark = htmlEl.classList.contains("dark");
  return isDark;
}

export function useThemeMode() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const htmlEl = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(checkDarkMode());
    });
    observer.observe(htmlEl, { attributes: true, attributeFilter: ["class"] });
    setIsDark(checkDarkMode());
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function createVerticalGradient(
  u: uPlot,
  seriesIdx: number,
  topColor: string,
  bottomColor: string
) {
  const ctx = u.ctx;
  const scaleKey = "y";
  const yMin = u.scales[scaleKey].min!;
  const yMax = u.scales[scaleKey].max!;
  const y0 = u.valToPos(yMin, scaleKey, true);
  const y1 = u.valToPos(yMax, scaleKey, true);
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  gradient.addColorStop(0, computeCssColor(topColor));
  gradient.addColorStop(1, computeCssColor(bottomColor));
  return gradient;
}

export function cloneAndResolveColors(options: UplotOptions): UplotOptions {
  const newOptions = { ...options };
  if (Array.isArray(options.series)) {
    newOptions.series = options.series.map((seriesItem: any) => {
      const newSeries = { ...seriesItem };
      if (seriesItem.stroke) {
        newSeries.stroke = computeCssColor(seriesItem.stroke);
      }
      if (seriesItem.fill) {
        if (typeof seriesItem.fill === "string") {
          newSeries.fill = computeCssColor(seriesItem.fill);
        } else if (typeof seriesItem.fill === "function") {
          newSeries.fill = seriesItem.fill;
        }
      }
      return newSeries;
    }) as any;
  }
  if (Array.isArray(options.axes)) {
    newOptions.axes = options.axes.map((axisItem) => {
      const newAxis = { ...axisItem };
      if (axisItem.stroke) {
        newAxis.stroke = computeCssColor(axisItem.stroke);
      }
      if (axisItem.grid && typeof axisItem.grid === "object") {
        newAxis.grid = { ...axisItem.grid };
        if (axisItem.grid.stroke) {
          newAxis.grid.stroke = computeCssColor(axisItem.grid.stroke);
        }
      }
      if (axisItem.ticks && typeof axisItem.ticks === "object") {
        newAxis.ticks = { ...axisItem.ticks };
        if (axisItem.ticks.stroke) {
          newAxis.ticks.stroke = computeCssColor(axisItem.ticks.stroke);
        }
      }
      return newAxis;
    });
  }
  return newOptions;
}

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
              style={{
                visibility: hasMeasured ? "visible" : "hidden",
              }}
              options={finalOptions}
              data={data}
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

export interface MoocnTooltipProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showIndexValue?: boolean;
  indexValueLabel?: string;
  collisionAvoidance?: boolean;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  labelFormatter?: (xValue: number, items: TooltipItem[]) => React.ReactNode;
  formatter?: (
    value: number,
    label: string,
    seriesIndex: number,
    rawSeries: uPlot.Series,
    rawData: uPlot
  ) => React.ReactNode;
  color?: string;
  labelClassName?: string;
}

interface TooltipItem {
  key: string;
  label: string;
  color?: string;
  value?: number;
  seriesIndex?: number;
  seriesRef?: uPlot.Series;
}

export const MoocnTooltip = React.forwardRef<HTMLDivElement, MoocnTooltipProps>(
  function MoocnTooltip(
    {
      className,
      showIndexValue = true,
      indexValueLabel = "X",
      collisionAvoidance = true,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      nameKey,
      labelKey,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      ...divProps
    },
    ref
  ) {
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const [tooltipSize, setTooltipSize] = React.useState({
      width: 0,
      height: 0,
    });
    const { chart, cursorState } = React.useContext(MoocnContext);

    React.useLayoutEffect(() => {
      if (tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect();
        if (
          rect.width !== tooltipSize.width ||
          rect.height !== tooltipSize.height
        ) {
          setTooltipSize({ width: rect.width, height: rect.height });
        }
      }
    }, [cursorState]);

    const hoveredIdx = cursorState.idx;
    const cursorLeft = cursorState.left;
    const cursorTop = cursorState.top;
    const items: TooltipItem[] = [];
    let xValue: number | undefined;

    if (chart) {
      const { data, series } = chart;

      if (showIndexValue && hoveredIdx != null && !hideLabel) {
        const rawX = data?.[0]?.[hoveredIdx];
        if (typeof rawX === "number") {
          xValue = rawX;
        }
      }
      for (let i = 1; i < series.length; i++) {
        const s = series[i];
        if (!s.show || hoveredIdx === null) continue;
        const rawVal = data?.[i]?.[hoveredIdx];
        if (typeof rawVal === "number") {
          const defaultColor =
            (s as any).stroke?.() || (s as any).fill || "#666";
          items.push({
            key: `series-${i}`,
            label: s.label ?? `Series ${i}`,
            color: color || defaultColor,
            value: rawVal,
            seriesIndex: i,
            seriesRef: s,
          });
        }
      }
    }

    const active =
      !!chart &&
      hoveredIdx !== null &&
      cursorLeft !== null &&
      cursorTop !== null;

    if (!active || items.length === 0) {
      return null;
    }

    const { width: tw, height: th } = tooltipSize;
    const padding = 16;
    let tooltipLeft = cursorLeft + tw / 4 + padding;
    let tooltipTop = cursorTop + th / 4 + padding;
    if (collisionAvoidance && chart) {
      const rect = chart.bbox;
      const chartWidth = rect.width + rect.left;
      const chartHeight = rect.height + rect.top;
      if (tooltipLeft + tw > chartWidth) {
        tooltipLeft = chartWidth - tw;
      }
      if (tooltipTop + th > chartHeight) {
        tooltipTop = chartHeight - th;
      }
    }

    const nestLabel = items.length === 1 && indicator !== "dot";
    let tooltipLabel: React.ReactNode = null;
    if (xValue != null && !hideLabel) {
      if (typeof labelFormatter === "function") {
        tooltipLabel = (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(xValue, items)}
          </div>
        );
      } else {
        tooltipLabel = (
          <div className={cn("font-medium", labelClassName)}>
            {indexValueLabel}: {xValue.toLocaleString()}
          </div>
        );
      }
    }

    return (
      <div
        ref={ref}
        className={cn("absolute pointer-events-none z-10", className)}
        style={{
          transform: `translate(${tooltipLeft}px, ${tooltipTop}px)`,
          ...divProps.style,
        }}
      >
        <div
          ref={tooltipRef}
          className={cn(
            "border-border/50 bg-background",
            "grid min-w-[8rem] items-start gap-1.5 rounded-lg border",
            "px-2.5 py-1.5 text-xs shadow-xl"
          )}
        >
          {!nestLabel && tooltipLabel}
          <div className="grid gap-1.5">
            {items.map((item) => {
              const itemContent = formatter
                ? formatter(
                    item.value ?? 0,
                    item.label,
                    item.seriesIndex ?? -1,
                    item.seriesRef!,
                    chart
                  )
                : null;

              const indicatorColor = color || item.color;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2",
                    "[&>svg]:h-2.5 [&>svg]:w-2.5",
                    indicator === "dot" && "items-center"
                  )}
                >
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                        indicator === "dot" && "h-2.5 w-2.5",
                        indicator === "line" && "w-1",
                        indicator === "dashed" &&
                          "w-0 border-[1.5px] border-dashed bg-transparent",
                        nestLabel && indicator === "dashed" && "my-0.5"
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel && tooltipLabel}
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    {item.value !== undefined && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {itemContent ?? item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

MoocnTooltip.displayName = "MoocnTooltip";

export interface MoocnLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  verticalAlign?: "top" | "bottom";
  showIndexValue?: boolean;
  indexValueLabel?: string;
}

export const MoocnLegendContent = React.forwardRef<
  HTMLDivElement,
  MoocnLegendProps
>(function MoocnLegendContent(
  {
    className,
    hideIcon = false,
    verticalAlign = "bottom",
    showIndexValue = true,
    indexValueLabel = "X",
    ...divProps
  },
  ref
) {
  const { chart, cursorState } = React.useContext(MoocnContext);
  const [isStale, setStale] = React.useState(false);
  const hoveredIdx = cursorState.idx;

  if (!chart) {
    return null;
  }

  const { data, series } = chart;
  function buildItems() {
    const results: {
      index: number;
      name: string;
      color: string;
      value: number | null;
      show: boolean;
      clickable: boolean;
    }[] = [];
    const hoveredVals =
      hoveredIdx != null
        ? data.map((arr) => {
            const val = arr[hoveredIdx];
            return typeof val === "number" ? val : null;
          })
        : data.map(() => null);
    if (showIndexValue) {
      let xVal: number | null = null;
      if (hoveredIdx != null && data[0][hoveredIdx] != null) {
        const val = data[0][hoveredIdx];
        xVal = typeof val === "number" ? val : null;
      }
      results.push({
        index: -1,
        name: indexValueLabel,
        color: "transparent",
        value: xVal,
        show: true,
        clickable: false,
      });
    }
    for (let i = 1; i < series.length; i++) {
      const s = series[i];
      const labelName = s.label || `Series ${i}`;
      const color = (s as any).stroke?.() || (s as any).fill || "#666";
      results.push({
        index: i,
        name: labelName,
        color,
        value: hoveredVals[i],
        show: s.show !== false,
        clickable: true,
      });
    }
    return results;
  }

  const items = buildItems();
  if (items.length === 0) {
    return null;
  }
  return (
    <div
      {...divProps}
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        "border-0 border-border/50 bg-background py-2 px-4 text-xs",
        className
      )}
    >
      {items.map((item) => {
        if (item.index === -1 && item.value == null) return null;

        let labelText = item.name;
        if (item.value != null) {
          labelText += `: ${item.value.toLocaleString()}`;
        }
        const handleClick = () => {
          if (!item.clickable) return;
          chart.setSeries(item.index, { show: !item.show });
          setStale(!isStale);
        };
        const handleMouseEnter = () => {
          if (!item.clickable) return;
          chart.setSeries(item.index, { focus: true });
        };
        const handleMouseLeave = () => {
          if (!item.clickable) return;
          chart.setSeries(null, { focus: false });
        };
        return (
          <div
            key={item.index}
            className={cn(
              "flex items-center gap-1.5 select-none cursor-pointer",
              !item.show && "opacity-50"
            )}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="font-mono">{labelText}</span>
          </div>
        );
      })}
    </div>
  );
});
