import type { RowData } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import type { VantageCellContext } from "../table-types";
import { assertBooleanColumn } from "./types";
import type { CellRenderer } from "../features/cell-visualization/types";

const centeredTextStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  lineHeight: "inherit",
} as const;

export function BooleanCell({
  getValue,
  table,
  column,
}: VantageCellContext<RowData, boolean | undefined>) {
  assertBooleanColumn(column);

  const value = getValue();

  if (value === undefined) {
    return table.options.renderFallbackValue;
  }

  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {value === true ? "Yes" : "No"}
    </Text>
  );
}

export const booleanCellRenderer: CellRenderer = {
  component: BooleanCell,
  id: "boolean",
  name: "Boolean",
};
