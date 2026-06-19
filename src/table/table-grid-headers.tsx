import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RowData } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { TableHeaderCell, TableHeaderContent } from "./table-header";
import {
  borderWidth,
  headerTextHeight,
  type PanePosition,
  type TableHeader,
  type TableInstance,
  type TanstabilColumn,
} from "./table-types";

type PointerSensorActivator = (typeof PointerSensor.activators)[number];
type PointerSensorActivatorEvent = Parameters<PointerSensorActivator["handler"]>[0];
type PointerSensorActivatorOptions = Parameters<PointerSensorActivator["handler"]>[1];

export type VirtualCenterColumn<TData extends RowData> = {
  column: TanstabilColumn<TData>;
  header: TableHeader<TData>;
  index: number;
};

function isColumnResizeHandleEvent(event: Event) {
  const target = event.target;

  return target instanceof Element && target.closest("[data-column-resize-handle='true']") !== null;
}

class ColumnDragPointerSensor extends PointerSensor {
  static activators: PointerSensorActivator[] = [
    {
      eventName: "onPointerDown",
      handler: (
        { nativeEvent: event }: PointerSensorActivatorEvent,
        options: PointerSensorActivatorOptions,
      ) => {
        if (isColumnResizeHandleEvent(event)) {
          return false;
        }

        if (!event.isPrimary || event.button !== 0) {
          return false;
        }

        options.onActivation?.({ event });

        return true;
      },
    },
  ];
}

export function getVirtualCenterColumns<TData extends RowData>({
  centerColumns,
  centerHeaders,
  virtualColumns,
}: {
  centerColumns: TanstabilColumn<TData>[];
  centerHeaders: TableHeader<TData>[];
  virtualColumns: VirtualItem[];
}) {
  return virtualColumns
    .map((virtualColumn) => {
      const column = centerColumns[virtualColumn.index];
      const header = centerHeaders[virtualColumn.index];

      if (!column || !header) {
        return null;
      }

      return {
        column,
        header,
        index: virtualColumn.index,
      };
    })
    .filter((entry): entry is VirtualCenterColumn<TData> => entry !== null);
}

function moveColumnId(columnIds: string[], activeId: string, overId: string) {
  const fromIndex = columnIds.indexOf(activeId);
  const toIndex = columnIds.indexOf(overId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return columnIds;
  }

  const nextColumnIds = [...columnIds];
  const [columnId] = nextColumnIds.splice(fromIndex, 1);

  if (!columnId) {
    return columnIds;
  }

  nextColumnIds.splice(toIndex, 0, columnId);
  return nextColumnIds;
}

function SortableTableHeaderCell<TData extends RowData>({
  header,
  instance,
  pane,
}: {
  header: TableHeader<TData>;
  instance: TableInstance<TData>;
  pane: PanePosition;
}) {
  const { isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } =
    useSortable({
      id: header.column.id,
    });

  return (
    <TableHeaderCell
      header={header}
      instance={instance}
      isDragging={isDragging}
      pane={pane}
      sortableProps={{
        activatorRef: setActivatorNodeRef,
        listeners,
        ref: setNodeRef,
        style: {
          opacity: isDragging ? 0.75 : undefined,
          transform: isDragging ? undefined : CSS.Translate.toString(transform),
          transition,
          visibility: isDragging ? "hidden" : undefined,
          zIndex: isDragging ? 60 : undefined,
        },
      }}
    />
  );
}

function TableHeaderDragOverlay<TData extends RowData>({
  header,
  instance,
}: {
  header: TableHeader<TData>;
  instance: TableInstance<TData>;
}) {
  const filterHeight = instance.atoms.filterHeight.get();
  const headerHeight = headerTextHeight + filterHeight + borderWidth;

  return (
    <div
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)",
        height: headerHeight - 1,
        overflow: "hidden",
        width: header.getSize(),
      }}
    >
      <TableHeaderContent header={header} instance={instance} />
    </div>
  );
}

export function TableHeaderRows<TData extends RowData>({
  centerColumnIds,
  centerContentWidth,
  contentWidth,
  instance,
  leftHeaders,
  leftWidth,
  rightHeaders,
  rightWidth,
  scrollElementRef,
  virtualCenterColumns,
}: {
  centerColumnIds: string[];
  centerContentWidth: number;
  contentWidth: number;
  instance: TableInstance<TData>;
  leftHeaders: TableHeader<TData>[];
  leftWidth: number;
  rightHeaders: TableHeader<TData>[];
  rightWidth: number;
  scrollElementRef: RefObject<HTMLDivElement | null>;
  virtualCenterColumns: VirtualCenterColumn<TData>[];
}) {
  const [activeHeader, setActiveHeader] = useState<TableHeader<TData> | null>(null);
  const lockedScrollTopRef = useRef<number | null>(null);
  const filterHeight = instance.atoms.filterHeight.get();
  const headerHeight = headerTextHeight + filterHeight + borderWidth;
  const sensors = useSensors(
    useSensor(ColumnDragPointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const restoreLockedScrollTop = useCallback(() => {
    const lockedScrollTop = lockedScrollTopRef.current;
    const scrollElement = scrollElementRef.current;

    if (lockedScrollTop === null || !scrollElement) {
      return;
    }

    if (scrollElement.scrollTop !== lockedScrollTop) {
      scrollElement.scrollTop = lockedScrollTop;
    }
  }, [scrollElementRef]);

  function clearHeaderDrag() {
    lockedScrollTopRef.current = null;
    setActiveHeader(null);
  }

  function handleColumnDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    const activeColumn = virtualCenterColumns.find(({ header }) => header.column.id === activeId);

    lockedScrollTopRef.current = scrollElementRef.current?.scrollTop ?? null;
    setActiveHeader(activeColumn?.header ?? null);
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    clearHeaderDrag();

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const allColumnIds = instance.getAllLeafColumns().map((column) => column.id);
    instance.setColumnOrder(moveColumnId(allColumnIds, activeId, overId));
  }

  useEffect(() => {
    const scrollElement = scrollElementRef.current;

    if (!activeHeader || !scrollElement) {
      return;
    }

    scrollElement.addEventListener("scroll", restoreLockedScrollTop, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", restoreLockedScrollTop);
    };
  }, [activeHeader, restoreLockedScrollTop, scrollElementRef]);

  return (
    <div
      style={{
        background: "var(--color-background)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        height: headerHeight,
        position: "sticky",
        top: 0,
        width: contentWidth,
        zIndex: 30,
      }}
    >
      {leftWidth > 0 ? (
        <div
          style={{
            background: "var(--color-background)",
            height: "100%",
            left: 0,
            position: "sticky",
            width: leftWidth,
            zIndex: 20,
          }}
        >
          {leftHeaders.map((header) => (
            <TableHeaderCell key={header.id} header={header} instance={instance} pane="left" />
          ))}
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={clearHeaderDrag}
        onDragEnd={handleColumnDragEnd}
        onDragMove={restoreLockedScrollTop}
        onDragStart={handleColumnDragStart}
        sensors={sensors}
      >
        <SortableContext items={centerColumnIds} strategy={horizontalListSortingStrategy}>
          <div
            style={{
              height: headerHeight - 1,
              left: leftWidth,
              position: "absolute",
              top: 0,
              width: centerContentWidth,
            }}
          >
            {virtualCenterColumns.map(({ header }) => (
              <SortableTableHeaderCell
                key={header.id}
                header={header}
                instance={instance}
                pane="center"
              />
            ))}
          </div>
        </SortableContext>

        {createPortal(
          <DragOverlay>
            {activeHeader ? (
              <TableHeaderDragOverlay header={activeHeader} instance={instance} />
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {rightWidth > 0 ? (
        <div
          style={{
            background: "var(--color-background)",
            height: "100%",
            marginLeft: "auto",
            position: "sticky",
            right: 0,
            width: rightWidth,
            zIndex: 20,
          }}
        >
          {rightHeaders.map((header) => (
            <TableHeaderCell key={header.id} header={header} instance={instance} pane="right" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
