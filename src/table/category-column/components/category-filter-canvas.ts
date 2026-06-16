import type { Category } from "../types";
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
  const entry = histogram[index];

  if (entry === undefined || histogram.length === 0) {
    return undefined;
  }

  const slotWidth = width / histogram.length;
  const x0 = Math.round(index * slotWidth);
  const x1 = Math.round((index + 1) * slotWidth);
  const x = index === 0 ? x0 : x0 + gap;
  const barWidth = Math.max(x1 - x, 0);
  const drawableHeight = Math.max(height - 1, 0);
  const barHeight = max === 0 ? 0 : Math.round((entry.totalCount / max) * drawableHeight);

  if (barWidth === 0 || barHeight === 0) {
    return undefined;
  }

  return {
    x,
    y: height - barHeight,
    width: barWidth,
    height: barHeight,
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

  const slotWidth = pixelWidth / histogram.length;
  const gap = slotWidth >= 4 ? Math.max(1, Math.round(pixelWidth / Math.max(cssWidth, 1))) : 0;

  for (const [index, { category, filteredCount }] of histogram.entries()) {
    const barGeometry = getCategoryHistogramBarGeometry({
      gap,
      height: pixelHeight,
      histogram,
      index,
      max,
      width: pixelWidth,
    });

    if (barGeometry === undefined) {
      continue;
    }

    const drawableHeight = Math.max(pixelHeight - 1, 0);
    const filteredBarHeight = max === 0 ? 0 : Math.round((filteredCount / max) * drawableHeight);

    context.fillStyle = category.color;
    context.globalAlpha = 0.2;
    context.fillRect(barGeometry.x, barGeometry.y, barGeometry.width, barGeometry.height);

    if (filteredBarHeight === 0) {
      context.globalAlpha = 1;
      continue;
    }

    if (hasFilter && !selectedCategories?.includes(category.value)) {
      context.globalAlpha = 0.28;
    } else {
      context.globalAlpha = 1;
    }
    context.fillRect(
      barGeometry.x,
      pixelHeight - filteredBarHeight,
      barGeometry.width,
      filteredBarHeight,
    );
    context.globalAlpha = 1;
  }

  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, pixelHeight - 0.5);
  context.lineTo(pixelWidth, pixelHeight - 0.5);
  context.stroke();
}
