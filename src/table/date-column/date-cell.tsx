import type { RowData } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import type { CellRenderer } from "../features/cell-visualization/types";
import type { TanstabilCellContext } from "../table-types";
import { assertDateColumn } from "./types";

export const defaultDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const centeredTextStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  lineHeight: "inherit",
} as const;

export function DateCell({
  getValue,
  table,
  column,
}: TanstabilCellContext<RowData, Date | undefined>) {
  assertDateColumn(column);

  const value = getValue();

  if (value === undefined || Number.isNaN(value.getTime())) {
    return table.options.renderFallbackValue;
  }

  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {defaultDateFormatter.format(value)}
    </Text>
  );
}

export const dateCellRenderer: CellRenderer<RowData> = {
  component: DateCell,
  id: "date",
  name: "Date",
};
