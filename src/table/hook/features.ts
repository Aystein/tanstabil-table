import {
  tableFeatures,
  stockFeatures,
  aggregationFns,
  createCoreRowModel,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  filterFns,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  sortFns,
  columnFilteringFeature,
  columnFacetingFeature,
} from "@tanstack/react-table";
import { clusterFeatuer } from "../cluster-column/cluster-column-feature";
import { computedColumnFeature } from "../computed-column/feature";
import { cellVisualizationTableFeature } from "../features/cell-visualization/cell-visualization-feature";
import { rowHeightTableFeature } from "../features/density/density-feature";
import { inheritanceFeature } from "../features/inheritance/inheritance-feature";
import { numberColumnFeature } from "../number-column/feature";

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
  densityFeature: rowHeightTableFeature,
  numberColumnFeature,
  computedColumnFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
  columnFilteringFeature,
  columnFacetingFeature,
  inheritanceFeature: inheritanceFeature,
});
