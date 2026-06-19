import { useTable, type RowData, type GroupingState } from "@tanstack/react-table";
import React, { useMemo, type RefObject } from "react";
import { createExpandColumn } from "../expand-column/expand-column";
import { createSelectionColumn } from "../selection-column/selection-column";
import { useCreateAtom, useSelector } from "@tanstack/react-store";
import { globalFilterFn } from "../features/inheritance/inheritance-feature";
import type { TanstabilTableOptions, TableVirtualizer } from "../table-types";
import type { ClusterState } from "../cluster-column/cluster-column-feature";
import { createClusterColumnDef } from "../cluster-column/utils";
import { _clusterLookupTable } from "../cluster-column/cluster-column";
import type { NumberColumnBinsState } from "../number-column/feature";
import { getNumberBinModel } from "../number-column/number-column-def";
import { DefaultGridCell, type GridTableOptions } from "../table-grid-cell";
import type { ComputedColumnsState } from "../computed-column/feature";
import { useComputedColumns } from "./use-computed-columns";

export { vantageFeatures } from "./features";

type IdentifiedRowData = RowData & {
  id: string;
};

export type AdditionalOptions<TData extends RowData> = GridTableOptions<TData> & {
  enableSelection?: boolean;

  rowVirtualizerRef?: RefObject<TableVirtualizer | undefined>;
};

export function useVantageTable<TData extends IdentifiedRowData>(
  tableOptions: TanstabilTableOptions<TData> & AdditionalOptions<TData>,
) {
  const isExpandEnabled = tableOptions.enableExpanding ?? false;
  const groupAtom = useCreateAtom<GroupingState>(tableOptions.initialState?.grouping ?? []);
  const clustersAtom = useCreateAtom<ClusterState>(
    tableOptions.initialState?.clusters ?? {
      clusterGroupsById: {},
    },
  );
  const binsAtom = useCreateAtom<NumberColumnBinsState>(tableOptions.initialState?.bins ?? {});
  const computedColumnsAtom = useCreateAtom<ComputedColumnsState>(
    tableOptions.initialState?.computedColumns ?? [],
  );

  const groupValue = useSelector(groupAtom);
  const clusters = useSelector(clustersAtom);
  const bins = useSelector(binsAtom);
  const computedColumns = useSelector(computedColumnsAtom);

  const groupDepth = groupValue.length;

  const enhancedTableColumns = React.useMemo(() => {
    const enhancedCoreColumns = (tableOptions.columns = tableOptions.columns.map((column) => {
      const columnCopy = { ...column };
      const binning = columnCopy.id ? bins[columnCopy.id] : undefined;

      if (columnCopy.columnType === "number") {
        if (binning !== undefined) {
          columnCopy.bins = binning;
        }

        const accessorFn =
          typeof columnCopy.accessorFn === "function"
            ? (columnCopy.accessorFn as (row: TData, index: number) => number | undefined)
            : undefined;

        if (accessorFn) {
          const values = tableOptions.data
            .map((row, index) => accessorFn(row, index))
            .filter((value): value is number => value !== undefined && !Number.isNaN(value));
          const binModel = getNumberBinModel(values, columnCopy.bins);

          columnCopy.getGroupingValue = (row) => {
            return binModel.getGroupingValue(accessorFn(row, 0));
          };
        }
      }

      return columnCopy;
    }));

    const computedNumberColumns = useComputedColumns(enhancedCoreColumns, computedColumns);

    const clusterColumns = Object.entries(clusters.clusterGroupsById).map(([_, clusterGroup]) => {
      const lookupMap = _clusterLookupTable(clusterGroup);

      return createClusterColumnDef<TData>({
        id: `${clusterGroup.id}`,
        header: clusterGroup.id,
        accessorFn: (original) => {
          return lookupMap.get(original.id);
        },
      });
    });

    return [
      groupDepth > 0 || isExpandEnabled ? createExpandColumn<TData>(groupDepth) : null,
      createSelectionColumn<TData>(),
      ...clusterColumns,
      ...enhancedCoreColumns,
      ...computedNumberColumns,
    ].filter((column): column is NonNullable<typeof column> => Boolean(column));
  }, [
    tableOptions.columns,
    tableOptions.data,
    groupDepth,
    isExpandEnabled,
    clusters,
    bins,
    computedColumns,
  ]);

  const data = useMemo(() => {
    return [...tableOptions.data];
    // eslint-disable-next-line react/exhaustive-deps
  }, [tableOptions.data, enhancedTableColumns]);

  const instance = useTable({
    gridCardHeight: 168,
    gridCardSizing: "fill",
    gridCardWidth: 150,
    gridCell: DefaultGridCell,
    ...tableOptions,
    data,
    globalFilterFn: globalFilterFn as TanstabilTableOptions<TData>["globalFilterFn"],
    getColumnCanGlobalFilter: (column) => {
      const columnDef = column.columnDef as { globalFilterFn?: unknown };
      return columnDef.globalFilterFn !== undefined;
    },
    getRowId: (original) => original.id,
    columns: enhancedTableColumns as TanstabilTableOptions<TData>["columns"],
    atoms: {
      grouping: groupAtom,
      clusters: clustersAtom,
      bins: binsAtom,
      computedColumns: computedColumnsAtom,
    },
  });

  return instance;
}
