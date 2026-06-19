import { Box, Checkbox } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import type { TableRow, TanstabilColumnDef } from "../table-types";

function setGroupedRowSelected<TData extends RowData>(row: TableRow<TData>, selected: boolean) {
  const selectionTable = row.table as typeof row.table & {
    setRowSelection: (
      updater: (previous: Record<string, boolean>) => Record<string, boolean>,
    ) => void;
  };

  selectionTable.setRowSelection((previous) => {
    const next = { ...previous };

    for (const leafRow of row.getLeafRows()) {
      if (!leafRow.getCanSelect()) {
        continue;
      }

      if (selected) {
        next[leafRow.id] = true;
      } else {
        delete next[leafRow.id];
      }
    }

    return next;
  });
}

export function createSelectionColumn<TData extends RowData>(): TanstabilColumnDef<TData> {
  return {
    id: "select",
    size: 12 + 16 + 12,
    enableResizing: false,
    enableColumnMenu: false,
    headerContainer: ({ table }) => (
      <Box
        style={{
          alignItems: "center",
          display: "flex",
          height: table.atoms.rowHeight.get(),
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={(event) => {
            table.toggleAllRowsSelected(event.currentTarget.checked);
          }}
          size="xs"
        />
      </Box>
    ),
    cell: ({ row, table }) => (
      <Box
        style={{
          alignItems: "center",
          display: "flex",
          height: table.atoms.rowHeight.get(),
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(event) => {
            row.toggleSelected(event.currentTarget.checked);
          }}
          size="xs"
        />
      </Box>
    ),
    aggregatedCell: ({ row }) => {
      return (
        <Box
          style={{
            alignItems: "center",
            display: "flex",
            height: row.table.atoms.rowHeight.get(),
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Checkbox
            checked={row.getIsAllSubRowsSelected()}
            indeterminate={row.getIsSomeSelected() && !row.getIsAllSubRowsSelected()}
            onChange={(event) => {
              setGroupedRowSelected(row, event.currentTarget.checked);
            }}
            size="xs"
          />
        </Box>
      );
    },
  };
}
