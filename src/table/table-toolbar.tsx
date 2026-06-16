import {
  ActionIcon,
  Box,
  Group,
  SegmentedControl,
  Slider,
  Text,
  TextInput,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import {
  CalculatorIcon,
  Columns3Icon,
  LayoutGridIcon,
  ListIcon,
  LocateFixedIcon,
  ScanLineIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import {
  getComputedColumnTourStepId,
  isComputedColumnTourStepId,
  useTourStore,
} from "@/app/onboarding-flow";
import { ComputedColumnDialog } from "./computed-column/components/computed-column-dialog";
import { ColumnsModal } from "./columns-modal";
import {
  borderWidth,
  headerTextHeight,
  type OverviewRowHeight,
  type TableInstance,
  type TableViewMode,
} from "./table-types";

function scrollToTestRow<TData extends RowData>(instance: TableInstance<TData>) {
  const rowVirtualizer = instance.options.rowVirtualizerRef.current;
  const scrollElement = rowVirtualizer?.scrollElement;

  if (!rowVirtualizer || !scrollElement) {
    return;
  }

  const targetOffset =
    headerTextHeight +
    instance.atoms.filterHeight.get() +
    borderWidth +
    500_000 * instance.atoms.rowHeight.get();
  const logicalScrollableHeight = Math.max(
    1,
    rowVirtualizer.getTotalSize() - scrollElement.clientHeight,
  );
  const nativeScrollableHeight = Math.max(
    1,
    scrollElement.scrollHeight - scrollElement.clientHeight,
  );
  const scrollScale = Math.max(1, logicalScrollableHeight / nativeScrollableHeight);

  scrollElement.scrollTo({
    top: targetOffset / scrollScale,
  });
}

export function TableToolbar<TData extends RowData>({
  instance,
  overviewRowHeight,
  onOverviewRowHeightChange,
  viewMode,
  onViewModeChange,
}: {
  instance: TableInstance<TData>;
  overviewRowHeight: OverviewRowHeight;
  onOverviewRowHeightChange: (rowHeight: OverviewRowHeight) => void;
  viewMode: TableViewMode;
  onViewModeChange: (mode: TableViewMode) => void;
}) {
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isComputedColumnOpen, setIsComputedColumnOpen] = useState(false);
  const activeTourId = useTourStore((state) => state.activeTourId);
  const stepIndex = useTourStore((state) => state.stepIndex);
  const setComputedColumnTourStep = useTourStore((state) => state.setComputedColumnTourStep);
  const stopTour = useTourStore((state) => state.stopTour);
  const globalFilterValue = useSelector(instance.atoms.globalFilter);
  const rowHeight = useSelector(instance.atoms.rowHeight);
  const globalFilter = typeof globalFilterValue === "string" ? globalFilterValue : "";
  const activeStepId =
    activeTourId === "computed-column" ? getComputedColumnTourStepId(stepIndex) : undefined;
  const isComputedColumnTourActive = isComputedColumnTourStepId(activeStepId);
  const isComputedColumnDialogTourStep =
    activeStepId === "computed-column-name" ||
    activeStepId === "computed-column-formula" ||
    activeStepId === "computed-column-create";
  const viewModeOptions = [
    {
      value: "table",
      label: (
        <>
          <ListIcon aria-hidden size={14} />
          <VisuallyHidden>Table view</VisuallyHidden>
        </>
      ),
    },
    {
      value: "overview",
      label: (
        <>
          <ScanLineIcon aria-hidden size={14} />
          <VisuallyHidden>Overview view</VisuallyHidden>
        </>
      ),
    },
    {
      value: "grid",
      label: (
        <>
          <LayoutGridIcon aria-hidden size={14} />
          <VisuallyHidden>Grid view</VisuallyHidden>
        </>
      ),
    },
  ];

  useEffect(() => {
    if (!isComputedColumnTourActive) {
      return;
    }

    onViewModeChange("table");
  }, [isComputedColumnTourActive, onViewModeChange]);

  useEffect(() => {
    if (!isComputedColumnTourActive) {
      return;
    }

    setIsComputedColumnOpen(isComputedColumnDialogTourStep);
  }, [isComputedColumnDialogTourStep, isComputedColumnTourActive]);

  function handleComputedColumnOpenChange(open: boolean) {
    setIsComputedColumnOpen(open);

    if (!open && isComputedColumnTourActive) {
      stopTour();
    }
  }

  function handleComputedColumnTriggerClick() {
    setIsComputedColumnOpen(true);

    if (activeStepId === "computed-column-trigger") {
      setComputedColumnTourStep("computed-column-name");
    }
  }

  return (
    <>
      <Group
        gap={6}
        h={40}
        px="xs"
        style={{
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
        wrap="nowrap"
      >
        <SegmentedControl
          aria-label="Table view mode"
          data={viewModeOptions}
          onChange={(value) => onViewModeChange(value as TableViewMode)}
          radius="sm"
          size="xs"
          value={viewMode}
        />

        {viewMode === "overview" ? (
          <Group
            gap="xs"
            h={30}
            px="xs"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--mantine-radius-sm)",
            }}
            wrap="nowrap"
          >
            <Slider
              aria-label="Overview row height"
              label={(value) => `${value}px rows`}
              max={10}
              min={1}
              onChange={(value) => onOverviewRowHeightChange(value as OverviewRowHeight)}
              size="xs"
              step={1}
              style={{ width: 96 }}
              value={overviewRowHeight}
            />
            <Text
              c="dimmed"
              fw={500}
              miw={16}
              size="10px"
              style={{ fontVariantNumeric: "tabular-nums" }}
              ta="center"
            >
              {overviewRowHeight}
            </Text>
          </Group>
        ) : null}

        <Group
          gap="xs"
          h={30}
          px="xs"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--mantine-radius-sm)",
          }}
          wrap="nowrap"
        >
          <Slider
            aria-label="Table row height"
            label={(value) => `${value}px rows`}
            max={96}
            min={28}
            onChange={(value) => instance.setRowHeight(value)}
            size="xs"
            step={2}
            style={{ width: 112 }}
            value={rowHeight}
          />
          <Text
            c="dimmed"
            fw={500}
            miw={24}
            size="10px"
            style={{ fontVariantNumeric: "tabular-nums" }}
            ta="center"
          >
            {rowHeight}
          </Text>
        </Group>

        <TextInput
          aria-label="Global filter"
          leftSection={<SearchIcon size={14} />}
          onChange={(event) => {
            const nextValue = event.target.value;

            instance.setGlobalFilter(nextValue === "" ? undefined : nextValue);
          }}
          placeholder="Search rows"
          radius="sm"
          rightSection={
            globalFilter === "" ? null : (
              <ActionIcon
                aria-label="Clear search"
                onClick={() => instance.resetGlobalFilter(true)}
                size="xs"
                variant="subtle"
              >
                <XIcon size={12} />
              </ActionIcon>
            )
          }
          size="xs"
          style={{ minWidth: 0, width: 224 }}
          type="search"
          value={globalFilter}
        />

        <Box style={{ flex: 1 }} />

        <ActionIcon.Group>
          <Tooltip label="Scroll to row 500,000" openDelay={350}>
            <ActionIcon
              aria-label="Scroll to row 500,000"
              disabled={viewMode !== "table"}
              onClick={() => scrollToTestRow(instance)}
              size="md"
              variant="subtle"
            >
              <LocateFixedIcon size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Add computed column" openDelay={350}>
            <ActionIcon
              aria-label="Add computed column"
              data-computed-column-trigger="true"
              onClick={handleComputedColumnTriggerClick}
              size="md"
              variant="subtle"
            >
              <CalculatorIcon size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Columns" openDelay={350}>
            <ActionIcon
              aria-label="Columns"
              onClick={() => setIsColumnsOpen(true)}
              size="md"
              variant="subtle"
            >
              <Columns3Icon size={16} />
            </ActionIcon>
          </Tooltip>
        </ActionIcon.Group>
      </Group>

      <ComputedColumnDialog
        instance={instance}
        open={isComputedColumnOpen}
        onOpenChange={handleComputedColumnOpenChange}
        tourMode={isComputedColumnTourActive}
      />
      <ColumnsModal instance={instance} open={isColumnsOpen} onOpenChange={setIsColumnsOpen} />
    </>
  );
}
