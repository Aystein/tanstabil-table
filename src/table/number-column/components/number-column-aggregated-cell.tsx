import type { RowData } from "@tanstack/react-table";
import type { CellRenderer } from "@/table/features/cell-visualization/types";
import type { TanstabilCellContext } from "@/table/table-types";
import type { AggregationValue } from "../types";
import { scaleLinear } from "d3";

// number formatter which should use the locale of the pc/browser
const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function NumberColumnAggregatedCell<TData extends RowData>({
  getValue, // Use getValue() instead of renderValue() to get the raw data
  table,
  column,
}: TanstabilCellContext<TData, any>) {
  const value = getValue();

  if (isAggregationValue(value)) {
    const rowHeight = table.atoms.rowHeight.get();
    const cellPadding = table.atoms.cellPadding.get() ?? 0;
    const width = Math.max(1, column.getSize() - cellPadding * 2);
    const centerY = rowHeight / 2;
    const scale = scaleLinear([value.min, value.max], [0, width]);
    const minX = scale(value.min);
    const q1X = scale(value.q1);
    const medianX = scale(value.median);
    const q3X = scale(value.q3);
    const maxX = scale(value.max);

    return (
      <div style={{ height: "100%", position: "relative", width: "100%" }}>
        <svg
          style={{
            height: "100%",
            inset: 0,
            overflow: "visible",
            position: "absolute",
            width: "100%",
          }}
        >
          <line
            x1={minX}
            x2={maxX}
            y1={centerY}
            y2={centerY}
            stroke="currentColor"
            strokeOpacity={0.45}
          />
          <rect
            x={q1X}
            y={centerY - 5}
            width={Math.max(1, q3X - q1X)}
            height={10}
            rx={1}
            fill="currentColor"
            fillOpacity={0.12}
            stroke="currentColor"
            strokeOpacity={0.7}
          />
          <line
            x1={medianX}
            x2={medianX}
            y1={centerY - 6}
            y2={centerY + 6}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <line x1={minX} x2={minX} y1={centerY - 4} y2={centerY + 4} stroke="currentColor" />
          <line x1={maxX} x2={maxX} y1={centerY - 4} y2={centerY + 4} stroke="currentColor" />
        </svg>
      </div>
    );
  }

  // Handle undefined, null, or non-numeric values
  if (typeof value !== "number" || isNaN(value)) {
    return (
      <div
        style={{
          textAlign: "right",
          color: "#9ca3af", // Subtle gray for missing data
          fontVariantNumeric: "tabular-nums",
        }}
        aria-label="No data"
      >
        {table.options.renderFallbackValue}
      </div>
    );
  }

  // Handle negative numbers to optionally style them differently
  const isNegative = value < 0;

  return (
    <div
      style={{
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        color: isNegative ? "#ef4444" : "inherit", // Red for negatives (optional)
      }}
    >
      {numberFormatter.format(value)}
    </div>
  );
}

function isAggregationValue(value: unknown): value is AggregationValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "min" in value &&
    "q1" in value &&
    "median" in value &&
    "q3" in value &&
    "max" in value
  );
}

export const numberSummaryCellRenderer: CellRenderer = {
  component: NumberColumnAggregatedCell,
  id: "number-summary",
  name: "Box plot",
};
