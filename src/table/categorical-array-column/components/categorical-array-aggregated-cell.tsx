import type { VantageFeatures } from "@/table/use-vantage-table";
import type { CellRenderer } from "@/table/features/cell-visualization/types";
import type { RowData, CellContext } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import { isCategoricalArrayColumn, type AggregationValue } from "../types";
import { UpsetGlyph } from "./upset-glyph";

const categoryThreshold = 20;

export function CategoricalArrayColumnAggregatedCell<TData extends RowData, TValue>({
  getValue,
  table,
  column,
}: CellContext<VantageFeatures, TData, TValue>) {
  if (!isCategoricalArrayColumn(column)) {
    return null;
  }

  const aggregatedValue = getValue() as AggregationValue | undefined;

  if (aggregatedValue === undefined || aggregatedValue.totalRows === 0) {
    return (
      <Text c="gray.5" component="span">
        {table.options.renderFallbackValue}
      </Text>
    );
  }

  const categories = column.feature().getValidCategoryValues();

  const activeCategories = categories.filter(
    (category) => (aggregatedValue.counts[category] ?? 0) > 0,
  );
  const frequencies = Object.fromEntries(
    categories.map((category) => [
      category,
      (aggregatedValue.counts[category] ?? 0) / aggregatedValue.totalRows,
    ]),
  );

  if (categories.length > categoryThreshold) {
    return (
      <Text c="gray.7" component="span" size="sm" style={{ lineHeight: "inherit" }}>
        {activeCategories
          .slice(0, 2)
          .map((category) => `${category} ${aggregatedValue.counts[category]}`)
          .join(" · ")}
        {activeCategories.length > 2 ? " ..." : ""}
        {aggregatedValue.totalRows > 0 && activeCategories.length === 0
          ? ` ${aggregatedValue.totalRows} rows`
          : ""}
      </Text>
    );
  }

  return (
    <UpsetGlyph
      activeCategories={activeCategories}
      categories={categories}
      frequencies={frequencies}
    />
  );
}

export const categoricalArraySummaryCellRenderer: CellRenderer = {
  component: CategoricalArrayColumnAggregatedCell,
  id: "categorical-array-summary",
  name: "Upset glyph",
};
