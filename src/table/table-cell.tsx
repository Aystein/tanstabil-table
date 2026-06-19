import { Box } from "@mantine/core";
import { flexRender } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { PanePosition, TableCell, TableInstance } from "./table-types";

function renderCellContent<TData extends RowData>(
  instance: TableInstance<TData>,
  cell: TableCell<TData>,
) {
  const { column, row } = cell;
  const { columnDef, id } = column;
  const { enableCellPadding = true } = columnDef;
  const cellPadding = instance.atoms.cellPadding.get();

  const paddingStyle = enableCellPadding
    ? {
        paddingInline: cellPadding,
      }
    : undefined;
  const tableCellPaddingStyle = {
    paddingInline: cellPadding,
  };

  if (cell.getIsPlaceholder()) {
    return null;
  }

  if (cell.getIsGrouped()) {
    if (columnDef.groupedCell) {
      return (
        <Box
          style={{
            ...paddingStyle,
            height: "100%",
          }}
        >
          {flexRender(columnDef.groupedCell, getGroupedCellContext(instance, cell))}
        </Box>
      );
    }

    const groupedValue = row.getGroupingValue(id);

    const displayValue =
      typeof groupedValue === "string" || typeof groupedValue === "number"
        ? groupedValue
        : JSON.stringify(groupedValue);

    return (
      <Box
        style={{
          ...tableCellPaddingStyle,
          height: "100%",
        }}
      >
        <span>{displayValue ?? ""}</span>
        <span> ({row.subRows.length})</span>
      </Box>
    );
  }

  if (cell.getIsAggregated()) {
    return (
      <Box
        style={{
          ...tableCellPaddingStyle,
          height: "100%",
        }}
      >
        {renderSummaryCellContent(instance, cell)}
      </Box>
    );
  }

  return (
    <div
      style={{
        ...paddingStyle,
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <instance.FlexRender cell={cell} />
    </div>
  );
}

function renderSummaryCellContent<TData extends RowData>(
  instance: TableInstance<TData>,
  cell: TableCell<TData>,
) {
  const { column } = cell;
  const columnDef = column.columnDef;
  const summaryCellRenderers = columnDef.summaryCellRenderers ?? [];

  if (summaryCellRenderers.length > 0) {
    const summaryVisualizations = instance.atoms.summaryVisualizations.get();
    const selectedVisualization =
      summaryVisualizations[column.id] ?? columnDef.defaultSummaryCellVisualization;
    const renderer = summaryCellRenderers.find((renderer) => renderer.id === selectedVisualization);

    if (renderer) {
      return flexRender(renderer.component, cell.getContext() as never);
    }
  }

  return flexRender(columnDef.aggregatedCell ?? columnDef.cell, cell.getContext());
}

function getGroupedCellContext<TData extends RowData>(
  instance: TableInstance<TData>,
  cell: TableCell<TData>,
): ReturnType<TableCell<TData>["getContext"]> {
  const groupedValue = cell.row.getGroupingValue(cell.column.id);

  return {
    ...cell.getContext(),
    getValue: () => groupedValue,
    renderValue: () => groupedValue ?? instance.options.renderFallbackValue,
  } as ReturnType<TableCell<TData>["getContext"]>;
}

export function TableBodyCell<TData extends RowData>({
  cell,
  instance,
  pane,
}: {
  cell: TableCell<TData>;
  instance: TableInstance<TData>;
  pane: PanePosition;
}) {
  return (
    <Box
      style={{
        background: "inherit",
        fontSize: 14,
        height: instance.atoms.rowHeight.get(),
        left: cell.column.getStart(pane),
        overflow: "hidden",
        position: "absolute",
        top: 0,
        whiteSpace: "nowrap",
        width: cell.column.getSize(),
      }}
    >
      {renderCellContent(instance, cell)}
    </Box>
  );
}
