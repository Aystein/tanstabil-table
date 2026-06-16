import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { flexRender, type RowData } from "@tanstack/react-table";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { ArrowDownIcon, ArrowUpIcon, EllipsisVerticalIcon } from "lucide-react";
import {
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { NumberColumnBinningDialog } from "./number-column/components/number-column-binning-dialog";
import { isNumberColumn } from "./number-column/typeguards";
import {
  borderWidth,
  headerTextHeight,
  type PanePosition,
  type TableInstance,
  type TableHeader,
} from "./table-types";

function ColumnResizeHandle<TData extends RowData>({ header }: { header: TableHeader<TData> }) {
  const resizeHandler = header.getResizeHandler();

  function handleResizeStart(
    event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
  ) {
    if ("button" in event && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resizeHandler(event);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      data-column-resize-handle="true"
      draggable={false}
      onDragStart={handleDragStart}
      onMouseDown={handleResizeStart}
      onTouchStart={handleResizeStart}
      style={{
        WebkitUserSelect: "none",
        alignItems: "center",
        cursor: "ew-resize",
        display: "flex",
        height: "100%",
        justifyContent: "flex-end",
        position: "absolute",
        right: 0,
        top: 0,
        touchAction: "none",
        userSelect: "none",
        width: "0.375rem",
      }}
    >
      <div
        style={{
          background: "var(--color-border)",
          borderRadius: 4,
          height: "0.875rem",
          width: "0.125rem",
        }}
      />
    </div>
  );
}

function ColumnMenu<TData extends RowData>({
  header,
  instance,
}: {
  header: TableHeader<TData>;
  instance: TableInstance<TData>;
}) {
  const [isBinningOpen, setIsBinningOpen] = useState(false);
  const columnDef = header.column.columnDef;
  const column = header.column;
  const columnCellRenderer =
    instance.atoms.cellVisualizations.get()[column.id] ?? columnDef.defaultCellVisualization;
  const columnSummaryRenderer =
    instance.atoms.summaryVisualizations.get()[column.id] ??
    columnDef.defaultSummaryCellVisualization;
  const cellRenderers = columnDef.cellRenderers ?? [];
  const summaryCellRenderers = columnDef.summaryCellRenderers ?? [];
  const columnHeaderLabel = typeof columnDef.header === "string" ? columnDef.header : column.id;
  const sortDirection = column.getIsSorted();

  return (
    <>
      <Menu alignItemsLabels="all" position="bottom-start" shadow="md" width={180}>
        <Menu.Target>
          <Tooltip label="Column menu" openDelay={350}>
            <ActionIcon aria-label="Column menu" size="sm" variant="subtle">
              <EllipsisVerticalIcon size={14} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          {column.getCanSort() ? (
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>Sort</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.RadioGroup
                  value={sortDirection === false ? "none" : sortDirection}
                  onChange={(value) => {
                    if (value === "asc") {
                      column.toggleSorting(false);
                      return;
                    }

                    if (value === "desc") {
                      column.toggleSorting(true);
                      return;
                    }

                    column.clearSorting();
                  }}
                >
                  <Menu.RadioItem value="asc">Ascending</Menu.RadioItem>
                  <Menu.RadioItem value="desc">Descending</Menu.RadioItem>
                  <Menu.RadioItem value="none" disabled={sortDirection === false}>
                    Clear sort
                  </Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          ) : null}

          {column.getCanPin() ? (
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>Pin column</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.RadioGroup
                  value={column.getIsPinned() || "none"}
                  onChange={(value) => {
                    column.pin(value === "none" ? false : (value as "left" | "right"));
                  }}
                >
                  <Menu.RadioItem value="left">Left</Menu.RadioItem>
                  <Menu.RadioItem value="right">Right</Menu.RadioItem>
                  <Menu.RadioItem value="none">None</Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          ) : null}

          {column.getCanGroup() ? (
            <Menu.Item onClick={column.getToggleGroupingHandler()}>
              {column.getIsGrouped()
                ? `Ungroup by ${columnHeaderLabel}`
                : `Group by ${columnHeaderLabel}`}
            </Menu.Item>
          ) : null}

          {columnDef.renderColumnMenuItems
            ? columnDef.renderColumnMenuItems(instance as never, column as never, {
                openBinningDialog: () => setIsBinningOpen(true),
              })
            : null}

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item>Cell visualization</Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <Menu.Label>Cell</Menu.Label>
              <Menu.RadioGroup
                value={columnCellRenderer}
                onChange={(value) => {
                  instance.setCellVisualization((prev) => ({
                    ...prev,
                    [column.id]: value,
                  }));
                }}
              >
                {cellRenderers.map((renderer) => (
                  <Menu.RadioItem key={renderer.id} value={renderer.id}>
                    {renderer.name}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>

              {summaryCellRenderers.length > 0 ? (
                <>
                  <Menu.Divider />
                  <Menu.Label>Summary</Menu.Label>
                  <Menu.RadioGroup
                    value={columnSummaryRenderer}
                    onChange={(value) => {
                      instance.setSummaryVisualization((prev) => ({
                        ...prev,
                        [column.id]: value,
                      }));
                    }}
                  >
                    {summaryCellRenderers.map((renderer) => (
                      <Menu.RadioItem key={renderer.id} value={renderer.id}>
                        {renderer.name}
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </>
              ) : null}
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        </Menu.Dropdown>
      </Menu>

      {isNumberColumn(column) ? (
        <NumberColumnBinningDialog
          column={column}
          open={isBinningOpen}
          onOpenChange={setIsBinningOpen}
          table={instance as never}
        />
      ) : null}
    </>
  );
}

export function TableHeaderContent<TData extends RowData>({
  header,
  instance,
  sortableProps,
}: {
  header: TableHeader<TData>;
  instance: TableInstance<TData>;
  sortableProps?: {
    activatorRef?: (node: HTMLDivElement | null) => void;
    listeners?: DraggableSyntheticListeners;
  };
}) {
  const columnDef = header.column.columnDef;
  const column = header.column;
  const cellPadding = instance.atoms.cellPadding.get();
  const contentPadding = columnDef.cellPadding ?? cellPadding;
  const contentWidth = Math.max(1, header.getSize() - contentPadding * 2);
  const filterHeight = instance.atoms.filterHeight.get();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid var(--color-border)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          height: headerTextHeight,
          paddingInline: contentPadding,
          position: "relative",
        }}
      >
        {columnDef.headerContainer ? (
          flexRender(columnDef.headerContainer, {
            table: instance as never,
            column: column as never,
            width: contentWidth,
            height: filterHeight,
          })
        ) : (
          <>
            <div
              ref={sortableProps?.activatorRef}
              onClick={column.getCanSort() ? column.getToggleSortingHandler() : undefined}
              style={{
                alignItems: "center",
                cursor: column.getCanSort() ? "pointer" : undefined,
                display: "flex",
                flex: "1 1 0",
                minWidth: 0,
                userSelect: "none",
              }}
              {...sortableProps?.listeners}
            >
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  flex: "1 1 0",
                  gap: "0.25rem",
                  minWidth: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  <instance.FlexRender header={header} />
                </div>

                {column.getIsSorted() ? (
                  column.getIsSorted() === "asc" ? (
                    <ArrowUpIcon size={16} />
                  ) : (
                    <ArrowDownIcon size={16} />
                  )
                ) : null}
              </div>
            </div>

            {columnDef.enableColumnMenu !== false ? (
              <ColumnMenu header={header} instance={instance} />
            ) : null}
          </>
        )}

        {column.getCanResize() ? <ColumnResizeHandle header={header} /> : null}
      </div>
      <div
        style={{
          boxSizing: "border-box",
          height: filterHeight,
          paddingInline: contentPadding,
          width: header.getSize(),
        }}
      >
        {columnDef.filter
          ? flexRender(columnDef.filter, {
              table: instance as never,
              column: column as never,
              width: contentWidth,
              height: filterHeight,
            })
          : null}
      </div>
    </div>
  );
}

export function TableHeaderCell<TData extends RowData>({
  header,
  instance,
  isDragging = false,
  pane,
  sortableProps,
}: {
  header: TableHeader<TData>;
  instance: TableInstance<TData>;
  isDragging?: boolean;
  pane: PanePosition;
  sortableProps?: {
    activatorRef?: (node: HTMLDivElement | null) => void;
    listeners?: DraggableSyntheticListeners;
    ref?: (node: HTMLDivElement | null) => void;
    style?: CSSProperties;
  };
}) {
  const filterHeight = instance.atoms.filterHeight.get();
  const headerHeight = headerTextHeight + filterHeight + borderWidth;

  return (
    <div
      ref={sortableProps?.ref}
      style={{
        background: "var(--color-background)",
        border: isDragging ? "1px solid var(--color-border)" : undefined,
        borderRadius: isDragging ? "var(--radius-md)" : undefined,
        boxShadow: isDragging ? "var(--shadow-md)" : undefined,
        height: headerHeight - 1,
        left: header.column.getStart(pane),
        overflow: "visible",
        position: "absolute",
        top: 0,
        ...sortableProps?.style,
        width: header.getSize(),
      }}
    >
      <TableHeaderContent
        header={header}
        instance={instance}
        sortableProps={{
          activatorRef: sortableProps?.activatorRef,
          listeners: sortableProps?.listeners,
        }}
      />
    </div>
  );
}
