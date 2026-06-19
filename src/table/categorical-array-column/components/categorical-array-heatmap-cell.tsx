import { Tooltip } from "@mantine/core";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import { isClusterColumn } from "@/table/cluster-column/types";
import type { TanstabilCellContext } from "@/table/table-types";
import type { RowData } from "@tanstack/react-table";
import { useMemo, useState, type MouseEvent } from "react";
import { isCategoricalArrayColumn } from "../types";

const verticalInset = 4;

function normalizeCellValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string"))];
}

export function CategoricalArrayHeatmapCell<TData extends RowData>({
  column,
  getValue,
  table,
}: TanstabilCellContext<TData, string[] | undefined>) {
  const { ref, width, height, pixelWidth, pixelHeight, context } = useCanvas();
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const isSupportedColumn = isCategoricalArrayColumn(column) || isClusterColumn(column);
  const value = getValue();
  const values = useMemo(() => normalizeCellValue(value), [value]);
  const activeSet = useMemo(() => new Set(values), [values]);
  const categories = useMemo(
    () => (isSupportedColumn ? column.feature().getValidCategories() : []),
    [column, isSupportedColumn],
  );
  const visibleCategories = useMemo(
    () => categories.filter((category) => activeSet.has(category.value)),
    [activeSet, categories],
  );

  useFrameEffect(() => {
    if (context === null || pixelWidth === 0 || pixelHeight === 0) {
      return;
    }

    context.clearRect(0, 0, pixelWidth, pixelHeight);

    if (visibleCategories.length === 0) {
      return;
    }

    const bandWidth = pixelWidth / visibleCategories.length;
    const bandHeight = Math.max(0, pixelHeight - verticalInset * 2);
    const rectWidth = Math.ceil(bandWidth);

    for (let index = 0; index < visibleCategories.length; index++) {
      const category = visibleCategories[index]!;
      const x = Math.round(index * bandWidth);

      context.fillStyle = category.color;
      context.fillRect(x, verticalInset, rectWidth, bandHeight);
    }
  }, [context, pixelWidth, pixelHeight, visibleCategories]);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    if (visibleCategories.length === 0 || bounds.width === 0 || event.buttons !== 0) {
      return;
    }

    const offsetX = event.clientX - bounds.left;
    const nextIndex = Math.min(
      visibleCategories.length - 1,
      Math.max(0, Math.floor((offsetX / bounds.width) * visibleCategories.length)),
    );

    setHoveredIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
  }

  if (!isSupportedColumn) {
    return null;
  }

  if (value === undefined) {
    return table.options.renderFallbackValue;
  }

  if (visibleCategories.length === 0) {
    return null;
  }

  const hoveredCategory = hoveredIndex === undefined ? undefined : visibleCategories[hoveredIndex];
  const hasHover = hoveredCategory !== undefined && width > 0 && height > 0;
  const hoverIndex = hasHover && hoveredIndex !== undefined ? hoveredIndex : 0;
  const hoverWidth = hasHover ? width / visibleCategories.length : 0;
  const hoverX = hoverIndex * hoverWidth;
  const visibleHoverWidth = Math.min(hoverWidth, width - hoverX);
  const hoverHeight = Math.max(0, height - verticalInset * 2);

  return (
    <div
      onMouseLeave={() => setHoveredIndex(undefined)}
      onMouseMove={handleMouseMove}
      style={{ height: "100%", position: "relative", width: "100%" }}
    >
      <canvas
        ref={ref}
        style={{ height: "100%", pointerEvents: "none", width: "100%" }}
        width={pixelWidth}
        height={pixelHeight}
        aria-hidden="true"
      />
      {hasHover ? (
        <Tooltip label={hoveredCategory.label} opened>
          <div
            style={{
              background: "transparent",
              border: 0,
              boxShadow: "inset 0 0 0 2px black",
              display: "block",
              height: hoverHeight,
              left: hoverX,
              padding: 0,
              position: "absolute",
              top: verticalInset,
              width: visibleHoverWidth,
            }}
          />
        </Tooltip>
      ) : null}
    </div>
  );
}
