import { Badge, Box, Group, Text } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { TableInstance, TableRow, TanstabilColumn } from "./table-types";

export type GridCellProps<TData extends RowData> = {
  columns: TanstabilColumn<TData>[];
  height: number;
  row: TableRow<TData>;
  table: TableInstance<TData>;
  width: number;
};

export type GridCellRenderer<TData extends RowData> = (props: GridCellProps<TData>) => ReactNode;

export type GridTableOptions<TData extends RowData> = {
  gridCardHeight?: number;
  gridCardSizing?: "fill" | "fixed";
  gridCardWidth?: number;
  gridCell?: GridCellRenderer<TData>;
};

function getColumnLabel<TData extends RowData>(column: TanstabilColumn<TData>) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

function formatGridValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "-" : value.toLocaleDateString();
  }

  if (Array.isArray(value)) {
    return value.map(formatGridValue).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (typeof value === "symbol") {
    return value.description ?? value.toString();
  }

  return "-";
}

export function DefaultGridCell<TData extends RowData>({
  columns,
  row,
}: GridCellProps<TData>): ReactNode {
  return (
    <Box
      style={{
        alignContent: "flex-start",
        alignItems: "flex-start",
        display: "flex",
        gap: "0.375rem",
        height: "100%",
        overflow: "hidden",
        padding: "0.5rem",
      }}
    >
      {columns.map((column) => (
        <Badge
          key={column.id}
          color="gray"
          radius="sm"
          size="sm"
          variant="light"
          styles={{
            label: {
              maxWidth: "100%",
              minWidth: 0,
              textTransform: "none",
            },
            root: {
              border: "1px solid var(--color-border)",
              maxWidth: "100%",
              minWidth: 0,
              paddingInline: "0.375rem",
            },
          }}
        >
          <Group gap={4} wrap="nowrap" style={{ maxWidth: "100%", minWidth: 0 }}>
            <Text c="dimmed" maw={80} size="11px" truncate>
              {getColumnLabel(column)}
            </Text>
            <Text fw={500} size="11px" style={{ minWidth: 0 }} truncate>
              {formatGridValue(row.getValue(column.id))}
            </Text>
          </Group>
        </Badge>
      ))}
    </Box>
  );
}
