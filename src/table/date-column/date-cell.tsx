import type { CellContext, RowData, TableFeatures } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import type { CellRenderer } from "../features/cell-visualization/types";
import { assertDateColumn } from "./types";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
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
}: CellContext<TableFeatures, RowData, Date | undefined>) {
  assertDateColumn(column);

  const value = getValue();

  if (value === undefined || Number.isNaN(value.getTime())) {
    return table.options.renderFallbackValue;
  }

  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {dateFormatter.format(value)}
    </Text>
  );
}

export const dateCellRenderer: CellRenderer<TableFeatures, RowData> = {
  component: DateCell,
  id: "date",
  name: "Date",
};
