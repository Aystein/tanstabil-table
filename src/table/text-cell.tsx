import type { RowData } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import type { CellRenderer } from "./features/cell-visualization/types";
import type { TanstabilCellContext } from "./table-types";

const centeredTextStyle = {} as const;

export function TextCell<TData extends RowData>({ getValue }: TanstabilCellContext<TData>) {
  const value = getValue();
  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {formatDisplayValue(value)}
    </Text>
  );
}

export function TextSummaryCell<TData extends RowData>({ getValue }: TanstabilCellContext<TData>) {
  const value = getValue();

  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {formatDisplayValue(value)}
    </Text>
  );
}

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "symbol") {
    return value.description ?? value.toString();
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  return JSON.stringify(value);
}

export const textCellRenderer: CellRenderer = {
  component: TextCell,
  id: "text",
  name: "Text",
};

export const textSummaryCellRenderer: CellRenderer = {
  component: TextSummaryCell,
  id: "text",
  name: "Text",
};
