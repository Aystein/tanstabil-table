import type { RowData } from "@tanstack/react-table";
import type { TanstabilAccessorFnColumnDef } from "../table-types";
import { Menu } from "@mantine/core";
import type { NumberColumnDef } from "../number-column/types";
import { createNumberColumn } from "../number-column/util";

export function createComputedNumberColumn<TData extends RowData>(
  columnDef: TanstabilAccessorFnColumnDef<TData, number | undefined>,
): NumberColumnDef<TData> {
  const numberColumn = createNumberColumn<TData>(columnDef);
  const renderNumberColumnMenuItems = numberColumn.renderColumnMenuItems;

  return {
    ...numberColumn,
    renderColumnMenuItems: (table, column, context) => {
      return (
        <>
          <Menu.Item
            color="red"
            onClick={() => {
              const computedTable = table as typeof table & {
                setComputedColumns: (
                  updater: (
                    previous: Array<{
                      id: string;
                    }>,
                  ) => Array<{
                    id: string;
                  }>,
                ) => void;
              };

              computedTable.setComputedColumns((previous) =>
                previous.filter((computedColumn) => computedColumn.id !== column.id),
              );
            }}
          >
            Delete column
          </Menu.Item>
          {renderNumberColumnMenuItems?.(table, column, context)}
        </>
      );
    },
  };
}
