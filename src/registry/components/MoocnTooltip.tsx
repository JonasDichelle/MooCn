import * as React from "react";
import uPlot, { Options as UplotOptions } from "uplot";
import "uplot/dist/uPlot.min.css";
import { cn } from "@/lib/utils";
import { MoocnContext } from "@/registry/components/Moocn";

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
    }, [cursorState, tooltipSize]);

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

    // If not hovering or no items, don't render
    if (!active || items.length === 0) {
      return null;
    }

    const { width: tw, height: th } = tooltipSize;
    let tooltipLeft = cursorLeft;
    let tooltipTop = cursorTop;

    if (collisionAvoidance && chart) {
      const axes = chart.axes;
      //   const axisXSize = axes?.[0]?.size() ?? 0;
      //   const axisYSize = axes?.[1]?.size() ?? 0;
      const axisXSize = 0;
      const axisYSize = 0;

      const PAD = 16;
      tooltipLeft += axisYSize + PAD * 3;
      tooltipTop += axisXSize + PAD * 2;

      const {
        left: chartX,
        top: chartY,
        width: chartW,
        height: chartH,
      } = chart.bbox;

      if (tooltipLeft + tw > chartX + chartW) {
        tooltipLeft = chartX + chartW - tw - PAD;
      }
      if (tooltipLeft < chartX) {
        tooltipLeft = chartX + PAD;
      }

      if (tooltipTop + th > chartY + chartH) {
        tooltipTop = chartY + chartH - th - PAD;
      }
      if (tooltipTop < chartY) {
        tooltipTop = chartY + PAD;
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
