import { useRegisterTool } from "@/ai";
import { z } from "zod";
import type { RowData } from "@tanstack/react-table";
import type { TableInstance } from "./table-types";

export function useTableAiTools<TData extends RowData>(instance: TableInstance<TData>) {
  useRegisterTool({
    id: "vantage-table.get-state",
    name: "getState",
    inputSchema: z.object({}),
    description:
      "Get the current state of the table, including filters, sorting, grouping and column visibility.",
    fn: () => {
      return {
        grouping: instance.atoms.grouping.get(),
        sorting: instance.atoms.sorting.get(),
        columnPinning: instance.atoms.columnPinning.get(),
        rowSelection: instance.atoms.rowSelection.get(),
      };
    },
  });

  useRegisterTool({
    id: "vantage-table.set-state",
    name: "setState",
    inputSchema: z.object({
      grouping: z.array(z.string()).optional(),
      sorting: z
        .array(
          z.object({
            id: z.string(),
            desc: z.boolean(),
          }),
        )
        .optional(),
      columnPinning: z
        .object({
          left: z.array(z.string()),
          right: z.array(z.string()),
        })
        .optional(),
      rowSelection: z.record(z.string(), z.boolean()).optional(),
    }),
    description:
      "Set the state of the table, including filters, sorting, grouping and column visibility.",
    fn: (state) => {
      if (state.grouping) {
        instance.setGrouping(state.grouping);
      }

      if (state.sorting) {
        instance.setSorting(state.sorting);
      }

      if (state.columnPinning) {
        instance.setColumnPinning(state.columnPinning);
      }

      if (state.rowSelection) {
        instance.setRowSelection(state.rowSelection);
      }
    },
  });

  useRegisterTool({
    id: "vantage-table.get-columns",
    name: "getColumns",
    description: "Get the current table columns and their visible UI state.",
    fn: () => {
      return instance.getAllLeafColumns().map((column) => {
        const columnDef = column.columnDef;
        const header = typeof columnDef.header === "string" ? columnDef.header : column.id;

        return {
          id: column.id,
          header,
          size: column.getSize(),
          isPinned: column.getIsPinned() || false,
          canSort: column.getCanSort(),
          sortDirection: column.getIsSorted() || false,
          canGroup: column.getCanGroup(),
          isGrouped: column.getIsGrouped(),
          canFilter: column.getCanFilter(),
          filterValue: column.getFilterValue(),
        };
      });
    },
  });
}
