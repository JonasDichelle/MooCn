import * as React from "react";
import "uplot/dist/uPlot.min.css";
import { cn } from "@/lib/utils";
import { MoocnContext } from "@/registry/components/Moocn";

export interface MoocnLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  verticalAlign?: "top" | "bottom";
  showIndexValue?: boolean;
  indexValueLabel?: string;
}

interface MeasureTextWidth {
  (text: string, font?: string): number;
  _canvas?: HTMLCanvasElement;
}

const measureTextWidth: MeasureTextWidth = (
  text: string,
  font = "12px monospace"
): number => {
  const canvas =
    measureTextWidth._canvas ??
    (measureTextWidth._canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

export const MoocnLegend = React.forwardRef<HTMLDivElement, MoocnLegendProps>(
  function MoocnLegend(
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
    const [maxWidths, setMaxWidths] = React.useState<{ [key: number]: number }>(
      {}
    );

    const hoveredIdx = cursorState.idx;
    function buildItems() {
      if (!chart) return [];

      const { data, series } = chart;
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

    React.useEffect(() => {
      if (!chart || items.length === 0) return;
      const newMaxWidths = { ...maxWidths };
      for (const item of items) {
        if (item.index === -1 && item.value == null) {
          continue;
        }

        const labelWidth = measureTextWidth(item.name, "12px monospace");

        if (item.value != null) {
          const labelValueText = `${item.name}: ${item.value.toLocaleString()}`;
          const labelValueWidth = measureTextWidth(
            labelValueText,
            "12px monospace"
          );

          const currentMax = newMaxWidths[item.index] ?? 0;
          const bigger =
            labelValueWidth > currentMax ? labelValueWidth : currentMax;
          newMaxWidths[item.index] = Math.ceil(bigger);
        } else {
          newMaxWidths[item.index] = Math.ceil(labelWidth);
        }
      }

      const changed = Object.keys(newMaxWidths).some((k) => {
        const key = Number(k);
        return newMaxWidths[key] !== maxWidths[key];
      });

      if (changed) {
        setMaxWidths(newMaxWidths);
      }
    }, [chart, items, maxWidths]);

    if (!chart) {
      return null;
    }
    if (items.length === 0) {
      return null;
    }

    return (
      <div
        {...divProps}
        ref={ref}
        className={cn(
          "flex flex-nowrap items-center",

          "justify-start gap-4",
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

          const pinnedWidth = maxWidths[item.index]
            ? maxWidths[item.index] + 8
            : undefined;

          return (
            <div
              key={item.index}
              className={cn(
                "inline-flex items-center select-none cursor-pointer whitespace-nowrap",
                !item.show && "opacity-50"
              )}
              style={{
                width: pinnedWidth ? `${pinnedWidth}px` : undefined,
                transition: "width 0.3s ease",
              }}
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {!hideIcon && (
                <div
                  className="mr-1.5 h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="font-mono">{labelText}</span>
            </div>
          );
        })}
      </div>
    );
  }
);
