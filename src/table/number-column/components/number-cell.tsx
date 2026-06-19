import type { RowData } from "@tanstack/react-table";
import type { CellRenderer } from "../../features/cell-visualization/types";
import type { TanstabilCellContext } from "@/table/table-types";
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
}: TanstabilCellContext<TData, CellValue>) {
  assertIsNumberColumn(column);

  const value = getValue();
  const feature = column.feature();
  const cellPadding = table.atoms.cellPadding.get();
  const scale = feature.getColorScale();

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
    <div
      style={{
        width: "100%",
        height: "100%",
        paddingInline: cellPadding,
        backgroundColor: color,
        alignContent: "center",
        textAlign: "right",
      }}
    >
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
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
