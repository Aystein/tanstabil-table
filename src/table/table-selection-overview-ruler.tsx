import { Box } from "@mantine/core";
import { useLayoutEffect, useRef } from "react";

const rulerWidth = 4;
const minMarkHeight = 2;

function getCssVarValue(element: HTMLElement, name: string, fallback: string) {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function resolveCssColor(element: HTMLElement, value: string, fallback: string) {
  const parent = element.parentElement;

  if (!parent) {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  parent.append(probe);

  const color = getComputedStyle(probe).color || fallback;
  probe.remove();

  return color;
}

function getMarkColor(element: HTMLElement) {
  const primaryColor = getCssVarValue(
    element,
    "--mantine-primary-color-filled",
    getCssVarValue(element, "--color-primary", "#0f766e"),
  );

  return resolveCssColor(element, primaryColor, "#0f766e");
}

function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number, ratio: number) {
  const pixelWidth = Math.max(1, Math.ceil(width * ratio));
  const pixelHeight = Math.max(1, Math.ceil(height * ratio));

  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }

  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }
}

export function TableSelectionOverviewRuler({
  rowCount,
  selectedRowIndexes,
  tableHeaderHeight,
  viewportHeight,
}: {
  rowCount: number;
  selectedRowIndexes: number[];
  tableHeaderHeight: number;
  viewportHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const height = Math.max(0, viewportHeight - tableHeaderHeight);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || height <= 0) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    resizeCanvas(canvas, rulerWidth, height, ratio);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.resetTransform();
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, rulerWidth, height);

    if (rowCount === 0 || selectedRowIndexes.length === 0) {
      return;
    }

    const markHeight = Math.max(minMarkHeight, height / rowCount);
    const availableHeight = Math.max(0, height - markHeight);

    ctx.fillStyle = getMarkColor(canvas);

    for (const rowIndex of selectedRowIndexes) {
      const clampedIndex = Math.max(0, Math.min(rowCount - 1, rowIndex));
      const top = rowCount <= 1 ? 0 : (clampedIndex / (rowCount - 1)) * availableHeight;

      ctx.fillRect(0, Math.round(top), rulerWidth, markHeight);
    }
  }, [height, rowCount, selectedRowIndexes]);

  if (height <= 0) {
    return null;
  }

  return (
    <Box
      aria-hidden
      style={{
        height,
        pointerEvents: "none",
        position: "absolute",
        right: 0,
        top: tableHeaderHeight,
        width: rulerWidth,
        zIndex: 70,
      }}
    >
      <canvas
        ref={canvasRef}
        data-selection-overview-ruler="true"
        style={{
          display: "block",
          height,
          width: rulerWidth,
        }}
      />
    </Box>
  );
}
