import { getPixelSnappedHistogramBarXLayout } from "../../features/histogram/histogram-layout";
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

  const bar = getPixelSnappedHistogramBarXLayout({
    count: histogram.length,
    desiredGap: 1,
    minBarWidthForGap: 2,
    width,
  })[hoveredCategoryIndex];

  if (bar === undefined) {
    return null;
  }

  const strokeWidth = 3;
  const strokeInset = strokeWidth / 2;

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
        width={bar.width}
        x={bar.x + strokeInset}
        y={strokeInset}
      />
    </svg>
  );
}
