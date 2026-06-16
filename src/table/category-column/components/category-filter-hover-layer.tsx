import type { CategoryHistogramEntry } from "./category-filter-canvas";

export function CategoryFilterHoverLayer({
  height,
  histogram,
  hoveredCategoryIndex,
  width,
}: {
  height: number;
  histogram: CategoryHistogramEntry[];
  hoveredCategoryIndex: number | undefined;
  width: number;
}) {
  if (
    hoveredCategoryIndex === undefined ||
    histogram[hoveredCategoryIndex] === undefined ||
    histogram.length === 0
  ) {
    return null;
  }

  const slotWidth = width / histogram.length;
  const gap = slotWidth >= 4 ? 1 : 0;
  const x0 = Math.round(hoveredCategoryIndex * slotWidth);
  const x1 = Math.round((hoveredCategoryIndex + 1) * slotWidth);
  const rectX = hoveredCategoryIndex === 0 ? x0 : x0 + gap;
  const strokeWidth = 3;
  const strokeInset = strokeWidth / 2;
  const rectWidth = Math.max(x1 - rectX, 0);

  return (
    <svg
      aria-hidden="true"
      height={height + strokeWidth}
      width={width + strokeWidth}
      style={{
        height: height + strokeWidth,
        left: -strokeInset,
        pointerEvents: "none",
        position: "absolute",
        top: -strokeInset,
        width: width + strokeWidth,
        zIndex: 1000,
      }}
    >
      <rect
        fill="transparent"
        height={height}
        stroke="var(--color-foreground)"
        strokeWidth={strokeWidth}
        width={rectWidth}
        x={rectX + strokeInset}
        y={strokeInset}
      />
    </svg>
  );
}
