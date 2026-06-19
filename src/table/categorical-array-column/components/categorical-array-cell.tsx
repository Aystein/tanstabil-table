import { isClusterColumn } from "@/table/cluster-column/types";
import type { TanstabilCellContext } from "@/table/table-types";
import type { RowData } from "@tanstack/react-table";
import { isCategoricalArrayColumn } from "../types";
import { UpsetGlyph } from "./upset-glyph";

const categoryThreshold = 20;

function normalizeCellValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string"))];
}

export function CategoricalArrayColumnCell<TData extends RowData>({
  getValue,
  column,
}: TanstabilCellContext<TData, string[] | undefined>) {
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

  return <UpsetGlyph activeCategories={value} categories={categories} />;
}
