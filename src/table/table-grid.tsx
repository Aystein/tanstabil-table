import { Box } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { useState } from "react";
import { GridMode } from "./table-card-grid-mode";
import { OverviewMode } from "./table-overview-mode";
import { TableMode } from "./table-mode";
import { TableToolbar } from "./table-toolbar";
import type { OverviewRowHeight, TableInstance, TableViewMode } from "./table-types";

export function TableGrid<TData extends RowData>({ instance }: { instance: TableInstance<TData> }) {
  const [overviewRowHeight, setOverviewRowHeight] = useState<OverviewRowHeight>(1);
  const [viewMode, setViewMode] = useState<TableViewMode>("table");

  const isColumnResizing = instance.atoms.columnResizing.get().isResizingColumn !== false;

  return (
    <Box
      data-column-resizing={isColumnResizing ? "true" : undefined}
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--mantine-radius-md)",
        cursor: isColumnResizing ? "ew-resize" : undefined,
        display: "flex",
        flexDirection: "column",
        fontSize: "var(--mantine-font-size-sm)",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        userSelect: isColumnResizing ? "none" : undefined,
      }}
    >
      <TableToolbar
        instance={instance}
        overviewRowHeight={overviewRowHeight}
        onOverviewRowHeightChange={setOverviewRowHeight}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "overview" ? (
        <OverviewMode instance={instance} overviewRowHeight={overviewRowHeight} />
      ) : viewMode === "grid" ? (
        <GridMode instance={instance} />
      ) : (
        <TableMode instance={instance} />
      )}
    </Box>
  );
}
