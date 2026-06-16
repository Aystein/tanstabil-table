import { Box } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import type { TableRow } from "./table-types";

function getRowSurfaceStyle<TData extends RowData>(row: TableRow<TData>): CSSProperties {
  const isSelected = row.getIsSelected();
  const isPartiallySelected =
    !isSelected && (row.getIsSomeSelected() || row.getIsAllSubRowsSelected());

  return {
    "--row-bg": isSelected
      ? "color-mix(in oklab, var(--color-background) 88%, var(--color-primary) 12%)"
      : isPartiallySelected
        ? "color-mix(in oklab, var(--color-background) 94%, var(--color-primary) 6%)"
        : "var(--color-background)",
    "--row-hover-bg": isSelected
      ? "color-mix(in oklab, var(--color-background) 82%, var(--color-primary) 18%)"
      : isPartiallySelected
        ? "color-mix(in oklab, var(--color-background) 90%, var(--color-primary) 10%)"
        : "color-mix(in oklab, var(--color-background) 97%, var(--color-foreground) 3%)",
  } as CSSProperties;
}

function getRowSelectionInset<TData extends RowData>(row: TableRow<TData>) {
  if (row.getIsSelected()) {
    return "inset 3px 0 0 var(--color-primary)";
  }

  if (row.getIsSomeSelected() || row.getIsAllSubRowsSelected()) {
    return "inset 3px 0 0 color-mix(in oklab, var(--color-background) 35%, var(--color-primary) 65%)";
  }

  return undefined;
}

export function TableRowBand<TData extends RowData>({
  children,
  top,
  row,
  virtualRow,
  width,
}: {
  children: ReactNode;
  top?: number;
  row: TableRow<TData>;
  virtualRow: VirtualItem;
  width: number;
}) {
  return (
    <Box
      data-selected={row.getIsSelected() ? "true" : undefined}
      style={{
        ...getRowSurfaceStyle(row),
        background: "var(--row-bg)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: getRowSelectionInset(row),
        display: "flex",
        height: virtualRow.size,
        position: "absolute",
        top: 0,
        transform: `translateY(${top ?? virtualRow.start}px)`,
        width,
      }}
    >
      {children}
    </Box>
  );
}
