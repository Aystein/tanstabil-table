import {
  ActionIcon,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { TableInstance } from "./table-types";

type TableColumn<TData extends RowData> = ReturnType<
  TableInstance<TData>["getAllLeafColumns"]
>[number];

function getColumnLabel<TData extends RowData>(column: TableColumn<TData>) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

function moveColumn<TData extends RowData>(
  instance: TableInstance<TData>,
  columnId: string,
  direction: -1 | 1,
) {
  const columnIds = instance.getAllLeafColumns().map((column) => column.id);
  const fromIndex = columnIds.indexOf(columnId);
  const toIndex = fromIndex + direction;

  if (fromIndex < 0 || toIndex < 0 || toIndex >= columnIds.length) {
    return;
  }

  const nextColumnIds = [...columnIds];
  const [column] = nextColumnIds.splice(fromIndex, 1);

  if (!column) {
    return;
  }

  nextColumnIds.splice(toIndex, 0, column);
  instance.setColumnOrder(nextColumnIds);
}

export function ColumnsModal<TData extends RowData>({
  instance,
  open,
  onOpenChange,
}: {
  instance: TableInstance<TData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const columns = instance.getAllLeafColumns();

  return (
    <Modal centered onClose={() => onOpenChange(false)} opened={open} size="32rem" title="Columns">
      <ScrollArea.Autosize mah="calc(min(82vh, 36rem) - 5rem)" type="auto">
        <Stack gap={4}>
          {columns.map((column, index) => {
            const canHide = column.getCanHide();
            const isFirst = index === 0;
            const isLast = index === columns.length - 1;
            const columnLabel = getColumnLabel(column);

            return (
              <Group
                gap="xs"
                key={column.id}
                mih={36}
                px="xs"
                py={4}
                style={{ borderRadius: "var(--mantine-radius-sm)" }}
                wrap="nowrap"
              >
                <Checkbox
                  aria-label={`Toggle ${columnLabel} column`}
                  checked={column.getIsVisible()}
                  disabled={!canHide}
                  onChange={(event) => column.toggleVisibility(event.currentTarget.checked)}
                  size="xs"
                />

                <Text
                  c={canHide ? undefined : "dimmed"}
                  fw={500}
                  size="xs"
                  style={{ flex: 1, minWidth: 0 }}
                  truncate
                >
                  {columnLabel}
                </Text>

                <ActionIcon.Group>
                  <Tooltip label="Move up" openDelay={350}>
                    <ActionIcon
                      aria-label="Move up"
                      disabled={isFirst}
                      onClick={() => moveColumn(instance, column.id, -1)}
                      size="sm"
                      variant="subtle"
                    >
                      <ArrowUpIcon size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Move down" openDelay={350}>
                    <ActionIcon
                      aria-label="Move down"
                      disabled={isLast}
                      onClick={() => moveColumn(instance, column.id, 1)}
                      size="sm"
                      variant="subtle"
                    >
                      <ArrowDownIcon size={14} />
                    </ActionIcon>
                  </Tooltip>
                </ActionIcon.Group>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
}
