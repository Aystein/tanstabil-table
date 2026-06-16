import { isClusterColumn } from "@/table/cluster-column/types";
import type { VantageFeatures } from "@/table/use-vantage-table";
import type { RowData, CellContext } from "@tanstack/react-table";
import { isCategoricalArrayColumn } from "../types";
import { UpsetGlyph } from "./upset-glyph";

const maxVisibleCategories = 8;
const categoryThreshold = 20;

function normalizeCellValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string"))];
}

type DomainLookupTable = {
  getCoreRowModel: () => {
    flatRows: Array<{
      getValue: (columnId: string) => unknown;
    }>;
  };
};

export function CategoricalArrayColumnCell<TData extends RowData>({
  getValue,
  table,
  column,
}: CellContext<VantageFeatures, TData, string[] | undefined>) {
  if (!isCategoricalArrayColumn(column) && !isClusterColumn(column)) {
    return null;
  }

  const value = getValue();
  const values = normalizeCellValue(getValue());

  const categories = column.feature().getValidCategoryValues();

  if (categories.length > categoryThreshold) {
    return (
      <span>
        {values.slice(0, 2).join(", ")}
        {values.length > 2 ? ` +${values.length - 2}` : ""}
      </span>
    );
  }

  const visibleValues = values.filter((value) => categories.includes(value));
  const overflowCount = values.length - visibleValues.length;

  return <UpsetGlyph activeCategories={value} categories={categories} />;
}
