import {
  createCoreRowModel,
  createExpandedRowModel,
  createFacetedRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  createFacetedMinMaxValues,
  createFacetedUniqueValues,
  filterFns,
  aggregationFns,
  columnFacetingFeature,
  columnFilteringFeature,
  tableFeatures,
  useTable,
  type RowData,
  type TableOptions,
  createGroupedRowModel,
  sortFns,
  stockFeatures,
  type GroupingState,
} from "@tanstack/react-table";
import React, { useMemo, type RefObject } from "react";
import { createExpandColumn } from "./expand-column/expand-column";
import { createSelectionColumn } from "./selection-column/selection-column";
import { cellVisualizationTableFeature } from "./features/cell-visualization/cell-visualization-feature";
import { useCreateAtom, useSelector } from "@tanstack/react-store";
import { globalFilterFn, typedColumnFeature } from "./features/core-feature/core-feature";
import { rowHeightTableFeature } from "./features/density/density-feature";
import type { TableVirtualizer } from "./table-types";
import { clusterFeatuer, type ClusterState } from "./cluster-column/cluster-column-feature";
import { createClusterColumnDef } from "./cluster-column/utils";
import { _clusterLookupTable } from "./cluster-column/cluster-column";
import { numberColumnFeature, type NumberColumnBinsState } from "./number-column/feature";
import type { NumberColumnBinning } from "./number-column/types";
import { getNumberBinModel } from "./number-column/number-column-def";
import { DefaultGridCell, type GridTableOptions } from "./table-grid-cell";
import { computedColumnFeature, type ComputedColumnsState } from "./computed-column/feature";
import { createFormulaEvaluator } from "./computed-column/formula";
import { createComputedNumberColumn } from "./computed-column/util";

export const vantageFeatures = tableFeatures({
  ...stockFeatures,
  aggregationFns,
  clusterFeature: clusterFeatuer,
  cellVisualizationFeature: cellVisualizationTableFeature,
  coreRowModel: createCoreRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  rowHeightFeature: rowHeightTableFeature,
  numberColumnFeature,
  computedColumnFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
  columnFilteringFeature,
  columnFacetingFeature,
  typedColumnFeature: typedColumnFeature,
});

export type VantageFeatures = typeof vantageFeatures;

type IdentifiedRowData = RowData & {
  id: string;
};

export type AdditionalOptions<TData extends RowData> = GridTableOptions<TData> & {
  enableSelection?: boolean;

  rowVirtualizerRef?: RefObject<TableVirtualizer | undefined>;
};

export function useVantageTable<TData extends IdentifiedRowData>(
  tableOptions: TableOptions<VantageFeatures, TData> & AdditionalOptions<TData>,
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
      const columnCopy = { ...column } as typeof column & {
        accessorFn?: (row: TData, index: number) => number | undefined;
        bins?: NumberColumnBinning;
      };
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

    const valueAccessors = new Map<string, (row: TData, index: number) => unknown>();

    for (const column of enhancedCoreColumns) {
      const columnId = column.id;

      if (columnId !== undefined && typeof column.accessorFn === "function") {
        valueAccessors.set(columnId, column.accessorFn as (row: TData, index: number) => unknown);
      }
    }

    const computedNumberColumns = computedColumns
      .map((computedColumn) => {
        try {
          const evaluateFormula = createFormulaEvaluator(computedColumn.formula);

          return createComputedNumberColumn<TData>({
            id: computedColumn.id,
            header: computedColumn.header,
            accessorFn: (row, index) => {
              const values = Object.fromEntries(
                [...valueAccessors].map(([columnId, accessorFn]) => [
                  columnId,
                  accessorFn(row, index),
                ]),
              );

              return evaluateFormula(values);
            },
            enableGrouping: true,
            size: 120,
          });
        } catch {
          return null;
        }
      })
      .filter((column): column is NonNullable<typeof column> => Boolean(column));

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
    globalFilterFn,
    getColumnCanGlobalFilter: (column) => {
      const columnDef = column.columnDef as { globalFilterFn?: unknown };

      if (columnDef.globalFilterFn !== undefined) {
        return true;
      }

      const value = column.table.getCoreRowModel().flatRows[0]?.getValue(column.id);

      return typeof value === "string" || typeof value === "number";
    },
    getRowId: (original) => original.id,
    columns: enhancedTableColumns as TableOptions<VantageFeatures, TData>["columns"],
    atoms: {
      grouping: groupAtom,
      clusters: clustersAtom,
      bins: binsAtom,
      computedColumns: computedColumnsAtom,
    },
  });

  return instance;
}
