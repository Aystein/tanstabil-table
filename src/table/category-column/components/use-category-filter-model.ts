import type { RowData } from "@tanstack/react-table";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import type { MouseEvent, PointerEvent } from "react";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import type { CategoryFilterValue } from "../filter-fn";
import type { Category, CategoryColumn } from "../types";
import type { CategoryHistogramEntry } from "./category-filter-canvas";

const UNDEFINED_PLACEHOLDER = crypto.randomUUID();

export type CategoryFilterOptionValue = string | number | undefined;

export type CategoryComboboxItem = {
  value: string;
  label: string;
  category: Omit<Category, "value"> & { value: CategoryFilterOptionValue };
};

export function useCategoryFilterModel<TData extends RowData>({
  column,
  height,
  width,
}: {
  column: CategoryColumn<TData>;
  height: number;
  width: number;
}) {
  const externalFilterValue = column.getFilterValue() as CategoryFilterValue;
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<CategoryFilterOptionValue[] | null>(
    getSelectedCategoriesFromFilter(externalFilterValue),
  );

  const feature = column.feature();
  const categories = feature.getCategories();
  const totalUniqueValues = column.getCoreUniqueValues();
  const facetedUniqueValues = column.getFacetedUniqueValues();
  const valueToCategory = feature.getValueToCategoryMap() as Map<
    CategoryFilterOptionValue,
    Category
  >;
  const histogram = useMemo<CategoryHistogramEntry[]>(
    () =>
      categories.map((category) => ({
        category,
        filteredCount: facetedUniqueValues.get(category.value) ?? 0,
        totalCount: totalUniqueValues.get(category.value) ?? 0,
      })),
    [categories, facetedUniqueValues, totalUniqueValues],
  );
  const max = useMemo(
    () => Math.max(0, ...histogram.map((entry) => Math.max(entry.filteredCount, entry.totalCount))),
    [histogram],
  );
  const labelHeight = Math.min(14, height);
  const categoryWidth = histogram.length === 0 ? 0 : width / histogram.length;
  const showLabels = categoryWidth >= 24;
  const histogramHeight = Math.max(height - labelHeight, 0);
  const comboboxItems = useMemo<CategoryComboboxItem[]>(
    () =>
      categories.map((category, index) => ({
        value: category.value === undefined ? UNDEFINED_PLACEHOLDER : `${index}:${category.value}`,
        label: category.label,
        category: category as Omit<Category, "value"> & { value: CategoryFilterOptionValue },
      })),
    [categories],
  );
  const comboboxValueToCategoryValue = useMemo(() => {
    return new Map(comboboxItems.map((item) => [item.value, item.category.value]));
  }, [comboboxItems]);
  const categoryValueToComboboxValue = useMemo(() => {
    return new Map(comboboxItems.map((item) => [item.category.value, item.value]));
  }, [comboboxItems]);
  const selectedComboboxValues = useMemo(
    () =>
      selectedCategories
        ?.map((value) => categoryValueToComboboxValue.get(value))
        .filter((value): value is string => value !== undefined) ?? [],
    [categoryValueToComboboxValue, selectedCategories],
  );
  const hasFilter = selectedComboboxValues.length > 0;

  useLayoutEffect(() => {
    setSelectedCategories(getSelectedCategoriesFromFilter(externalFilterValue));
  }, [externalFilterValue]);

  const maybeSetFilterValue = useDebouncedCallback(
    (nextValue: CategoryFilterValue) => {
      column.setFilterValue(nextValue);
    },
    { wait: 250 },
  );

  const getCategoryIndexFromEvent = useCallback(
    (event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (
        width <= 0 ||
        x < 0 ||
        x > width ||
        y < 0 ||
        y > histogramHeight ||
        histogram.length === 0
      ) {
        return undefined;
      }

      return Math.min(histogram.length - 1, Math.floor((x / width) * histogram.length));
    },
    [histogram.length, histogramHeight, width],
  );

  const setFilterCategories = useCallback(
    (nextCategories: CategoryFilterOptionValue[] | null) => {
      if (nextCategories === null || nextCategories.length === 0) {
        setSelectedCategories(null);
        maybeSetFilterValue(undefined);
        return;
      }

      setSelectedCategories(nextCategories);
      maybeSetFilterValue({ categories: nextCategories });
    },
    [maybeSetFilterValue],
  );

  const onComboboxValueChange = useCallback(
    (newValue: string[]) => {
      if (newValue.length === 0) {
        setFilterCategories(null);
        return;
      }

      const nextCategories = newValue.map((value) => comboboxValueToCategoryValue.get(value));

      setFilterCategories(nextCategories);
    },
    [comboboxValueToCategoryValue, setFilterCategories],
  );

  const getComboboxChipLabel = useCallback(
    (value: string) => {
      const categoryValue = comboboxValueToCategoryValue.get(value);

      return valueToCategory.get(categoryValue)?.label ?? value;
    },
    [comboboxValueToCategoryValue, valueToCategory],
  );

  const onFilterPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const nextIndex = getCategoryIndexFromEvent(event);

      if (nextIndex === undefined) {
        setHoveredCategoryIndex(undefined);
        return;
      }

      setHoveredCategoryIndex(nextIndex);
    },
    [getCategoryIndexFromEvent],
  );

  const onFilterClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const categoryIndex = getCategoryIndexFromEvent(event);
      const category = categoryIndex === undefined ? undefined : histogram[categoryIndex]?.category;

      if (category === undefined) {
        return;
      }

      const nextCategories = selectedCategories === null ? [] : [...selectedCategories];

      if (!nextCategories.includes(category.value)) {
        nextCategories.push(category.value);
      }

      setFilterCategories(nextCategories);
    },
    [getCategoryIndexFromEvent, histogram, selectedCategories, setFilterCategories],
  );

  const onFilterPointerLeave = useCallback(() => {
    setHoveredCategoryIndex(undefined);
  }, []);

  return {
    comboboxItems,
    facetedUniqueValues,
    getComboboxChipLabel,
    hasFilter,
    hoveredCategoryIndex,
    histogram,
    histogramHeight,
    labelHeight,
    max,
    onComboboxValueChange,
    onFilterClick,
    onFilterPointerLeave,
    onFilterPointerMove,
    selectedCategories,
    selectedComboboxValues,
    showLabels,
    totalUniqueValues,
  };
}

function getSelectedCategoriesFromFilter(
  filterValue: CategoryFilterValue,
): CategoryFilterOptionValue[] | null {
  return (filterValue?.categories as CategoryFilterOptionValue[] | undefined) ?? null;
}
