import type { CellContext, RowData } from "@tanstack/react-table";
import type { CellRenderer } from "../../features/cell-visualization/types";
import type { VantageFeatures } from "@/table/use-vantage-table";
import type { CellValue } from "../types";
import { assertIsNumberColumn } from "../typeguards";

// number formatter which should use the locale of the pc/browser
const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function NumberCell<TData extends RowData>({
  getValue,
  table,
  column,
}: CellContext<VantageFeatures, TData, CellValue>) {
  assertIsNumberColumn(column);

  const value = getValue();
  const feature = column.feature();
  const columnWidth = column.getSize();
  const cellPadding = table.atoms.cellPadding.get();
  const scale = feature.getColorScale();
  const rowHeight = table.atoms.rowHeight.get();

  const domain = feature.getDomain();

  if (domain === undefined) {
    return table.options.renderFallbackValue;
  }

  const color = scale(value);

  // Handle undefined, null, or non-numeric values
  if (typeof value !== "number" || isNaN(value)) {
    return (
      <div
        style={{
          textAlign: "right",
          paddingInline: cellPadding,
        }}
      >
        {table.options.renderFallbackValue}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative", width: "100%" }}>
      <svg style={{ height: "100%", position: "absolute", width: "100%" }}>
        <rect fill={color} x={0} y={0} width={columnWidth} height={rowHeight} />
      </svg>

      <div
        style={{
          height: "100%",
          position: "absolute",
          textAlign: "right",
          paddingInline: cellPadding,
          width: "100%",
        }}
      >
        {numberFormatter.format(value)}
      </div>
    </div>
  );
}

export const numberCellRenderer: CellRenderer = {
  component: NumberCell,
  id: "number",
  name: "Number",
};
