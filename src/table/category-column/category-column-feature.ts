import { memo, type RowData } from "@tanstack/react-table";
import type { Category, CategoryColumnOptions, CategoryFeatureShape, ValidCategory } from "./types";
import type { TanstabilColumn, TanstabilTable_Internal } from "../table-types";

const categoricalPalette = [
  "#209cd5",
  "#2fa773",
  "#ef9d1a",
  "#e03e69",
  "#8858da",
  "#e86830",
  "#259d9d",
  "#88a92d",
  "#436edb",
  "#cf4a9e",
  "#c1931f",
  "#308875",
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
  _table: TanstabilTable_Internal<TData>,
  column: TanstabilColumn<TData, any>,
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
