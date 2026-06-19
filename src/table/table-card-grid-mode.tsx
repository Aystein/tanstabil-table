import { Badge, Box, Checkbox, Group, Text } from "@mantine/core";
import { flexRender, type RowData } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GridTableOptions } from "./table-grid-cell";
import type { TableInstance, TableRow, TanstabilColumn } from "./table-types";

function getColumnLabel<TData extends RowData>(column: TanstabilColumn<TData>) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

function GridFilterCard<TData extends RowData>({
  column,
  filterHeight,
  isFiltered,
  instance,
  width,
}: {
  column: TanstabilColumn<TData>;
  filterHeight: number;
  isFiltered: boolean;
  instance: TableInstance<TData>;
  width: number;
}) {
  const cellPadding = instance.atoms.cellPadding.get();
  const contentPadding = column.columnDef.cellPadding ?? cellPadding;
  const contentWidth = Math.max(1, width - contentPadding * 2);

  return (
    <Box
      style={{
        background: isFiltered
          ? "color-mix(in oklab, var(--color-background) 95%, var(--color-primary) 5%)"
          : "var(--color-background)",
        border: `1px solid ${
          isFiltered
            ? "color-mix(in oklab, var(--color-border) 50%, var(--color-primary) 50%)"
            : "var(--color-border)"
        }`,
        borderRadius: "var(--mantine-radius-sm)",
        boxSizing: "border-box",
        maxWidth: width,
        minWidth: width,
        width,
      }}
    >
      <Group
        gap="xs"
        h={32}
        wrap="nowrap"
        style={{
          borderBottom: "1px solid var(--color-border)",
          boxSizing: "border-box",
          cursor: column.getCanSort() ? "pointer" : undefined,
          fontSize: "var(--mantine-font-size-xs)",
          fontWeight: 500,
          minWidth: 0,
          paddingInline: contentPadding,
        }}
        onClick={column.getCanSort() ? column.getToggleSortingHandler() : undefined}
      >
        <Text size="xs" style={{ flex: 1, minWidth: 0 }} truncate>
          {getColumnLabel(column)}
        </Text>
        {isFiltered ? (
          <Badge color="gray" size="xs" variant="light">
            Filtered
          </Badge>
        ) : null}
      </Group>

      {column.columnDef.filter ? (
        <Box
          style={{
            boxSizing: "border-box",
            height: filterHeight,
            overflow: "hidden",
            paddingInline: contentPadding,
            width,
          }}
        >
          {flexRender(column.columnDef.filter, {
            table: instance as never,
            column: column as never,
            width: contentWidth,
            height: filterHeight,
          })}
        </Box>
      ) : null}
    </Box>
  );
}

function GridControlsPanel<TData extends RowData>({
  columnFilters,
  instance,
  width,
}: {
  columnFilters: ReturnType<TableInstance<TData>["atoms"]["columnFilters"]["get"]>;
  instance: TableInstance<TData>;
  width: number;
}) {
  const filterHeight = instance.atoms.filterHeight.get();
  const contentWidth = Math.max(1, width - 16);
  const columns = [
    ...instance.getLeftVisibleLeafColumns(),
    ...instance.getCenterVisibleLeafColumns(),
    ...instance.getRightVisibleLeafColumns(),
  ];

  return (
    <Box
      data-grid-controls="true"
      style={{
        background: "var(--color-background)",
        borderLeft: "1px solid var(--color-border)",
        flexBasis: width,
        flexShrink: 0,
        maxWidth: width,
        minWidth: width,
        overflowX: "hidden",
        overflowY: "auto",
        width,
      }}
    >
      <Box
        style={{
          display: "grid",
          gap: "0.5rem",
          gridTemplateColumns: `${contentWidth}px`,
          padding: "0.5rem",
          width,
        }}
      >
        {columns.map((column) => {
          const isFiltered = columnFilters.some((filter) => filter.id === column.id);

          return (
            <GridFilterCard
              key={column.id}
              column={column}
              filterHeight={filterHeight}
              isFiltered={isFiltered}
              instance={instance}
              width={contentWidth}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function GridCard<TData extends RowData>({
  cardHeight,
  cardWidth,
  columns,
  gridCell,
  instance,
  left,
  row,
}: {
  cardHeight: number;
  cardWidth: number;
  columns: TanstabilColumn<TData>[];
  gridCell: GridTableOptions<TData>["gridCell"];
  instance: TableInstance<TData>;
  left: number;
  row: TableRow<TData>;
}) {
  const isSelected = row.getIsSelected();

  return (
    <Box
      data-grid-card="true"
      data-selected={isSelected ? "true" : undefined}
      style={{
        background: "var(--color-background)",
        border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: "var(--mantine-radius-sm)",
        boxShadow: isSelected
          ? "var(--mantine-shadow-sm), 0 0 0 1px color-mix(in oklab, var(--color-primary) 35%, transparent)"
          : "var(--mantine-shadow-xs)",
        height: cardHeight,
        left,
        overflow: "hidden",
        position: "absolute",
        top: 0,
        width: cardWidth,
      }}
    >
      {row.getCanSelect() ? (
        <Box
          style={{
            background: "color-mix(in oklab, var(--color-background) 85%, transparent)",
            borderRadius: "var(--mantine-radius-xs)",
            boxShadow: "var(--mantine-shadow-xs)",
            padding: "0.125rem",
            position: "absolute",
            right: "0.375rem",
            top: "0.375rem",
            zIndex: 10,
          }}
        >
          <Checkbox
            checked={isSelected}
            onChange={(event) => {
              event.stopPropagation();
              row.toggleSelected(event.currentTarget.checked);
            }}
            size="xs"
          />
        </Box>
      ) : null}

      {gridCell?.({
        columns,
        height: cardHeight,
        row,
        table: instance,
        width: cardWidth,
      })}
    </Box>
  );
}

export function GridMode<TData extends RowData>({ instance }: { instance: TableInstance<TData> }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [columnFilters, setColumnFilters] = useState(() => instance.atoms.columnFilters.get());
  const [, forceRowSelectionRender] = useState(0);
  const visibleRows = instance.getRowModel().rows;
  const gridOptions = instance.options as typeof instance.options & GridTableOptions<TData>;
  const measuredViewportWidth = viewportWidth;
  const gap = 8;
  const panePadding = 8;
  const controlsWidth = Math.max(1, Math.round(measuredViewportWidth * 0.2));
  const gridPaneWidth = Math.max(1, measuredViewportWidth - controlsWidth);
  const gridContentWidth = Math.max(1, gridPaneWidth - panePadding * 2);
  const targetCardWidth = gridOptions.gridCardWidth ?? 150;
  const cardSizing = gridOptions.gridCardSizing ?? "fill";
  const cardHeight = gridOptions.gridCardHeight ?? 168;
  const gridCell = gridOptions.gridCell;
  const columnCount = Math.max(1, Math.floor((gridContentWidth + gap) / (targetCardWidth + gap)));
  const cardWidth =
    cardSizing === "fixed"
      ? targetCardWidth
      : Math.max(
          1,
          Math.floor((gridContentWidth - gap * Math.max(0, columnCount - 1)) / columnCount),
        );
  const rowContentWidth = columnCount * cardWidth + gap * Math.max(0, columnCount - 1);
  const rowContentOffset =
    cardSizing === "fixed" ? Math.max(0, (gridContentWidth - rowContentWidth) / 2) : 0;
  const rowCount = Math.ceil(visibleRows.length / columnCount);
  const columns = [
    ...instance.getLeftVisibleLeafColumns(),
    ...instance.getCenterVisibleLeafColumns(),
    ...instance.getRightVisibleLeafColumns(),
  ];

  const gridVirtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => cardHeight + gap,
    getScrollElement: () => scrollViewportRef.current,
    overscan: 4,
  });

  instance.options.rowVirtualizerRef.current = gridVirtualizer;

  useLayoutEffect(() => {
    setColumnFilters(instance.atoms.columnFilters.get());

    const handle = instance.atoms.columnFilters.subscribe((nextColumnFilters) => {
      setColumnFilters(nextColumnFilters);
    });

    return handle?.unsubscribe;
  }, [instance.atoms.columnFilters]);

  useLayoutEffect(() => {
    forceRowSelectionRender((version) => version + 1);

    const handle = instance.atoms.rowSelection.subscribe(() => {
      forceRowSelectionRender((version) => version + 1);
    });

    return handle?.unsubscribe;
  }, [instance.atoms.rowSelection]);

  useLayoutEffect(() => {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = element.clientWidth;

      setViewportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };
    const resizeObserver = new ResizeObserver(updateWidth);

    updateWidth();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    gridVirtualizer.measure();
  }, [columnCount, gridVirtualizer]);

  return (
    <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Box
        ref={viewportRef}
        style={{
          display: "flex",
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
      >
        <Box
          ref={scrollViewportRef}
          style={{
            background: "color-mix(in oklab, var(--color-muted) 20%, transparent)",
            flexBasis: gridPaneWidth,
            flexShrink: 0,
            minWidth: 0,
            overflowX: "hidden",
            overflowY: "auto",
            padding: "0.5rem",
            width: gridPaneWidth,
          }}
        >
          <Box
            style={{
              height: Math.max(1, gridVirtualizer.getTotalSize()),
              position: "relative",
            }}
          >
            {gridVirtualizer.getVirtualItems().map((virtualRow) => (
              <Box
                key={virtualRow.key}
                style={{
                  height: cardHeight,
                  left: 0,
                  position: "absolute",
                  top: virtualRow.start,
                  width: gridContentWidth,
                }}
              >
                {Array.from({ length: columnCount }).map((_, laneIndex) => {
                  const row = visibleRows[virtualRow.index * columnCount + laneIndex];

                  if (!row) {
                    return null;
                  }

                  return (
                    <GridCard
                      key={row.id}
                      cardHeight={cardHeight}
                      cardWidth={cardWidth}
                      columns={columns}
                      gridCell={gridCell}
                      instance={instance}
                      left={rowContentOffset + laneIndex * (cardWidth + gap)}
                      row={row}
                    />
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>

        <GridControlsPanel
          width={controlsWidth}
          columnFilters={columnFilters}
          instance={instance}
        />
      </Box>
    </Box>
  );
}
