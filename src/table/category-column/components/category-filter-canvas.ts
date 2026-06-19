import type { Category } from "../types";
import { getPixelSnappedHistogramBars } from "../../features/histogram/histogram-layout";
import type { CategoryFilterOptionValue } from "./use-category-filter-model";

export type CategoryHistogramEntry = {
  category: Category;
  filteredCount: number;
  totalCount: number;
};

export type CategoryHistogramBarGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getCategoryHistogramBarGeometry({
  gap,
  height,
  histogram,
  index,
  max,
  width,
}: {
  gap: number;
  height: number;
  histogram: CategoryHistogramEntry[];
  index: number;
  max: number;
  width: number;
}): CategoryHistogramBarGeometry | undefined {
  if (histogram[index] === undefined || histogram.length === 0) {
    return undefined;
  }

  const bar = getPixelSnappedHistogramBars({
    desiredGap: gap,
    entries: histogram,
    getFiltered: (entry) => entry.filteredCount,
    getTotal: (entry) => entry.totalCount,
    height,
    max,
    width,
  })[index];

  if (bar === undefined || bar.width === 0 || bar.totalHeight === 0) {
    return undefined;
  }

  return {
    x: bar.x,
    y: bar.totalY,
    width: bar.width,
    height: bar.totalHeight,
  };
}

export function drawCategoryFilterHistogram({
  context,
  cssWidth,
  hasFilter,
  histogram,
  max,
  pixelHeight,
  pixelWidth,
  selectedCategories,
}: {
  context: CanvasRenderingContext2D;
  cssWidth: number;
  hasFilter: boolean;
  histogram: CategoryHistogramEntry[];
  max: number;
  pixelHeight: number;
  pixelWidth: number;
  selectedCategories: CategoryFilterOptionValue[] | null;
}) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, pixelWidth, pixelHeight);

  if (histogram.length === 0) {
    return;
  }

  const gap = Math.max(1, Math.round(pixelWidth / Math.max(cssWidth, 1)));
  const bars = getPixelSnappedHistogramBars({
    desiredGap: gap,
    entries: histogram,
    getFiltered: (entry) => entry.filteredCount,
    getTotal: (entry) => entry.totalCount,
    height: pixelHeight,
    max,
    minBarWidthForGap: gap * 2,
    width: pixelWidth,
  });

  for (const { entry, filteredHeight, filteredY, totalHeight, totalY, width, x } of bars) {
    const { category } = entry;

    if (width === 0 || totalHeight === 0) {
      continue;
    }

    context.fillStyle = category.color;
    context.globalAlpha = 0.2;
    context.fillRect(x, totalY, width, totalHeight);

    if (filteredHeight === 0) {
      context.globalAlpha = 1;
      continue;
    }

    if (hasFilter && !selectedCategories?.includes(category.value)) {
      context.globalAlpha = 0.28;
    } else {
      context.globalAlpha = 1;
    }
    context.fillRect(x, filteredY, width, filteredHeight);
    context.globalAlpha = 1;
  }

  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, pixelHeight - 0.5);
  context.lineTo(pixelWidth, pixelHeight - 0.5);
  context.stroke();
}
