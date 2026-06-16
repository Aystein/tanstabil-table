import { memo, type Column, type RowData, type Table_Internal } from "@tanstack/react-table";
import type { Category, CategoryColumnOptions, CategoryFeatureShape, ValidCategory } from "./types";
import type { VantageFeatures } from "../use-vantage-table";

const categoricalPalette = [
  "hsl(199 74% 48%)",
  "hsl(154 56% 42%)",
  "hsl(37 87% 52%)",
  "hsl(344 72% 56%)",
  "hsl(262 64% 60%)",
  "hsl(18 80% 55%)",
  "hsl(180 62% 38%)",
  "hsl(76 58% 42%)",
  "hsl(223 68% 56%)",
  "hsl(322 58% 55%)",
  "hsl(43 72% 44%)",
  "hsl(167 48% 36%)",
];

export function getCategoricalColor(value: string | undefined) {
  const category = String(value ?? "(missing)");
  let hash = 0;

  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }

  return categoricalPalette[Math.abs(hash) % categoricalPalette.length]!;
}

function _getCategories(coreUniqueValues: Map<any, number>): Category[] {
  const allKeys = Array.from(coreUniqueValues.keys());

  return allKeys.map((key, index) => {
    if (key === undefined) {
      return { value: undefined, label: "(Missing)", color: "#ccc" };
    }

    return {
      value: key,
      label: String(key),
      color: categoricalPalette[index % categoricalPalette.length]!,
    };
  });
}

export function createCategoryFeature<TData extends RowData>(
  _table: Table_Internal<VantageFeatures, TData>,
  column: Column<VantageFeatures, TData>,
): CategoryFeatureShape {
  const columnDef = column.columnDef as typeof column.columnDef & CategoryColumnOptions;
  const getCategories = memo({
    fn: (coreUniqueValues, overrideCategories) => {
      const categories = _getCategories(coreUniqueValues);

      return overrideCategories?.(categories) ?? categories;
    },
    memoDeps: () => [column.getCoreUniqueValues(), columnDef.overrideCategories],
  });

  const getValidCategories = memo({
    fn: (categories) => {
      return categories.filter(
        (category): category is ValidCategory => category.value !== undefined,
      );
    },
    memoDeps: () => [getCategories()],
  });

  return {
    getCategories,
    getCategoryValues: memo({
      fn: (categories) => {
        return categories.map((category) => category.value);
      },
      memoDeps: () => [getCategories()],
    }),
    getValidCategories,
    getValidCategoryValues: memo({
      fn: (validCategories) => {
        return validCategories.map((category) => category.value);
      },
      memoDeps: () => [getValidCategories()],
    }),
    getColorScale: memo({
      fn: () => {
        return getCategoricalColor;
      },
      memoDeps: () => [],
    }),
    getValueToCategoryMap: memo({
      fn: (categories) => {
        const map = new Map<string | undefined, Category>();

        for (const category of categories) {
          map.set(category.value, category);
        }

        return map;
      },
      memoDeps: () => [getCategories()],
    }),
  };
}
