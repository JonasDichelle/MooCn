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
  }
);
