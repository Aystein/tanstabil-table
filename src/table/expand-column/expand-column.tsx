import { ActionIcon, Box } from "@mantine/core";
import type { ColumnDef, Row, RowData, Table } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsDownIcon,
  ChevronsRightIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import type { VantageFeatures } from "../use-vantage-table";

function ExpandButton<TData extends RowData>({ row }: { row: Row<VantageFeatures, TData> }) {
  const isGroupedRow = row.getIsGrouped();
  const isDetailRow = row.getCanExpand() && !isGroupedRow;
  const isExpanded = row.getIsExpanded();

  if (!isGroupedRow && !isDetailRow) {
    return null;
  }

  return (
    <ActionIcon
      aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
      onClick={row.getToggleExpandedHandler()}
      size="sm"
      variant="subtle"
    >
      {isDetailRow ? isExpanded ? <MinusIcon size={14} /> : <PlusIcon size={14} /> : null}
      {isGroupedRow ? (
        isExpanded ? (
          <ChevronDownIcon size={14} />
        ) : (
          <ChevronRightIcon size={14} />
        )
      ) : null}
    </ActionIcon>
  );
}

function ExpandAllButton<TData extends RowData>({
  table,
}: {
  table: Table<VantageFeatures, TData>;
}) {
  const isAllExpanded = table.getIsAllRowsExpanded();

  return (
    <ActionIcon
      aria-label={isAllExpanded ? "Collapse all rows" : "Expand all rows"}
      onClick={table.getToggleAllRowsExpandedHandler()}
      size="sm"
      variant="subtle"
    >
      {isAllExpanded ? <ChevronsDownIcon size={14} /> : <ChevronsRightIcon size={14} />}
    </ActionIcon>
  );
}

export function createExpandColumn<TData extends RowData>(
  depth: number,
): ColumnDef<VantageFeatures, TData> {
  return {
    id: "expand",
    size: 28 + 12 + 12 + depth * 12,
    enableResizing: false,
    enableColumnMenu: false,
    header: ({ table }) => (
      <Box
        style={{
          alignItems: "center",
          display: "flex",
          height: table.atoms.rowHeight.get(),
        }}
      >
        <ExpandAllButton table={table} />
      </Box>
    ),
    cell: ({ row, table }) => {
      return (
        <Box
          style={{
            alignItems: "center",
            display: "flex",
            height: table.atoms.rowHeight.get(),
            paddingLeft: row.depth * 12,
          }}
        >
          <ExpandButton row={row} />
        </Box>
      );
    },
    aggregatedCell: ({ row }) => {
      return (
        <Box
          style={{
            alignItems: "center",
            display: "flex",
            height: row.table.atoms.rowHeight.get(),
            paddingLeft: row.depth * 12,
          }}
        >
          <ExpandButton row={row} />
        </Box>
      );
    },
  };
}
