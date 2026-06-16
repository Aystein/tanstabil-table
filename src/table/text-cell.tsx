import type { CellContext, RowData } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import type { VantageFeatures } from "./use-vantage-table";
import type { CellRenderer } from "./features/cell-visualization/types";

const centeredTextStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  lineHeight: "inherit",
} as const;

export function TextCell<TData extends RowData>({ getValue }: CellContext<VantageFeatures, TData>) {
  const value = getValue();
  return (
    <Text size="sm" style={centeredTextStyle} truncate>
      {formatDisplayValue(value)}
    </Text>
  );
}

export function TextSummaryCell<TData extends RowData>({
  getValue,
}: CellContext<VantageFeatures, TData>) {
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
