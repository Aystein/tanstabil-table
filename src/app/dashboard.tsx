import { Fragment, useMemo } from "react";
import { ActionIcon, Box, Center, Group, Stack, Text, Title } from "@mantine/core";
import { BarChart3Icon, CircleDotIcon, Grid2X2Icon, XIcon } from "lucide-react";
import { z } from "zod";
import { useRegisterTool } from "@/ai";
import { VantageTable } from "@/table/table";
import type { Pokemon } from "@/data";
import type { TableInstance } from "@/table/table-types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable-panels";
import { ScatterPlot } from "./scatter-plot";
import {
  dashboardLayoutDirections,
  dashboardSplitPlacements,
  dashboardViewTypes,
  getDashboardPanes,
  useUiStore,
  type DashboardLayoutInput,
  type DashboardLayoutNode,
  type DashboardPane,
  type DashboardLayoutDirection,
  type DashboardViewInput,
  type DashboardViewType,
} from "./ui-store";

const viewLabels: Record<DashboardViewType, string> = {
  table: "Table",
  scatterPlot: "Scatter Plot",
  violinPlot: "Violin Plot",
};

const viewDescriptions: Record<DashboardViewType, string> = {
  table: "Live data grid",
  scatterPlot: "Numeric row model plot",
  violinPlot: "Dummy violin plot view",
};

const viewIcons = {
  table: Grid2X2Icon,
  scatterPlot: CircleDotIcon,
  violinPlot: BarChart3Icon,
} satisfies Record<DashboardViewType, typeof Grid2X2Icon>;

function PlaceholderView({ type }: { type: Exclude<DashboardViewType, "table" | "scatterPlot"> }) {
  const Icon = viewIcons[type];

  return (
    <Center bg="color-mix(in oklab, var(--color-muted) 20%, transparent)" h="100%" mih={0} p="xl">
      <Stack align="center" gap="sm" maw={320} ta="center">
        <Center
          bg="var(--color-background)"
          h={48}
          style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}
          w={48}
        >
          <Icon color="var(--color-muted-foreground)" size={20} />
        </Center>
        <Stack gap={4}>
          <Title order={3} size="sm">
            {viewLabels[type]}
          </Title>
          <Text c="dimmed" size="xs">
            {viewDescriptions[type]}
          </Text>
        </Stack>
      </Stack>
    </Center>
  );
}

function DashboardPaneContent({
  isTableLoading,
  pane,
  tableInstance,
}: {
  isTableLoading: boolean;
  pane: DashboardPane;
  tableInstance: TableInstance<Pokemon>;
}) {
  if (pane.type === "table") {
    return (
      <Box h="100%" mih={0} p="md">
        <VantageTable instance={tableInstance} isLoading={isTableLoading} />
      </Box>
    );
  }

  if (pane.type === "scatterPlot") {
    return <ScatterPlot instance={tableInstance} isLoading={isTableLoading} />;
  }

  return <PlaceholderView type={pane.type} />;
}

function DashboardPaneChrome({
  isTableLoading,
  pane,
  tableInstance,
}: {
  isTableLoading: boolean;
  pane: DashboardPane;
  tableInstance: TableInstance<Pokemon>;
}) {
  const paneCount = useUiStore((state) => getDashboardPanes(state.dashboardLayout).length);
  const activePaneId = useUiStore((state) => state.activeDashboardPaneId);
  const setActivePaneId = useUiStore((state) => state.setActiveDashboardPaneId);
  const removePane = useUiStore((state) => state.removeDashboardPane);
  const Icon = viewIcons[pane.type];

  return (
    <Box
      component="section"
      bg="var(--color-background)"
      data-active={activePaneId === pane.id ? "true" : undefined}
      data-dashboard-pane-id={pane.id}
      h="100%"
      mih={0}
      onFocus={() => setActivePaneId(pane.id)}
      onMouseDown={() => setActivePaneId(pane.id)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Group
        h={40}
        justify="space-between"
        gap="xs"
        px="sm"
        style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}
      >
        <Group gap="xs" miw={0}>
          <Icon color="var(--color-muted-foreground)" size={14} />
          <Text fw={500} size="xs" truncate>
            {pane.title}
          </Text>
        </Group>
        <ActionIcon
          type="button"
          variant="subtle"
          size="sm"
          title="Close view"
          aria-label="Close view"
          disabled={paneCount === 1}
          onClick={() => removePane(pane.id)}
        >
          <XIcon size={14} />
        </ActionIcon>
      </Group>

      <Box mih={0} style={{ flex: "1 1 0", overflow: "hidden" }}>
        <DashboardPaneContent
          isTableLoading={isTableLoading}
          pane={pane}
          tableInstance={tableInstance}
        />
      </Box>
    </Box>
  );
}

function DashboardLayoutRenderer({
  isTableLoading,
  node,
  tableInstance,
}: {
  isTableLoading: boolean;
  node: DashboardLayoutNode;
  tableInstance: TableInstance<Pokemon>;
}) {
  const setGroupSizes = useUiStore((state) => state.setDashboardGroupSizes);

  if (node.kind === "view") {
    return (
      <DashboardPaneChrome
        isTableLoading={isTableLoading}
        pane={node}
        tableInstance={tableInstance}
      />
    );
  }

  return (
    <ResizablePanelGroup
      id={node.id}
      orientation={node.direction}
      defaultLayout={Object.fromEntries(node.children.map((child) => [child.id, child.size]))}
      onLayoutChanged={(layout) => {
        setGroupSizes(node.id, layout);
      }}
    >
      {node.children.map((child, index) => (
        <Fragment key={child.id}>
          <ResizablePanel id={child.id} defaultSize={`${child.size}%`} minSize="15%">
            <DashboardLayoutRenderer
              isTableLoading={isTableLoading}
              node={child}
              tableInstance={tableInstance}
            />
          </ResizablePanel>
          {index < node.children.length - 1 ? <ResizableHandle withHandle /> : null}
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
}

const dashboardViewSchema: z.ZodType<DashboardViewInput> = z.object({
  kind: z.literal("view").optional(),
  id: z.string().min(1).optional(),
  type: z.enum(dashboardViewTypes),
  title: z.string().optional(),
  size: z.number().positive().optional(),
});

const dashboardLayoutSchema: z.ZodType<DashboardLayoutInput> = z.lazy(() =>
  z.union([
    dashboardViewSchema,
    z.object({
      kind: z.literal("group"),
      id: z.string().min(1).optional(),
      direction: z.enum(dashboardLayoutDirections),
      size: z.number().positive().optional(),
      children: z.array(dashboardLayoutSchema).min(1),
    }),
  ]),
);

function getPaneSplitDirection(paneId: string): DashboardLayoutDirection {
  const paneElement = Array.from(
    document.querySelectorAll<HTMLElement>("[data-dashboard-pane-id]"),
  ).find((element) => element.dataset.dashboardPaneId === paneId);

  if (!paneElement) {
    return "horizontal";
  }

  const { height, width } = paneElement.getBoundingClientRect();

  return width >= height ? "horizontal" : "vertical";
}

export function Dashboard({
  isTableLoading,
  tableInstance,
}: {
  isTableLoading: boolean;
  tableInstance: TableInstance<Pokemon>;
}) {
  const layout = useUiStore((state) => state.dashboardLayout);
  const panes = useMemo(() => getDashboardPanes(layout), [layout]);
  const activePaneId = useUiStore((state) => state.activeDashboardPaneId);
  const layoutVersion = useUiStore((state) => state.dashboardLayoutVersion);
  const addPane = useUiStore((state) => state.addDashboardPane);
  const setLayout = useUiStore((state) => state.setDashboardLayout);
  const splitPane = useUiStore((state) => state.splitDashboardPane);
  const updatePane = useUiStore((state) => state.updateDashboardPane);
  const removePane = useUiStore((state) => state.removeDashboardPane);

  function handleAddView(type: DashboardViewType) {
    const paneId = panes.some((pane) => pane.id === activePaneId) ? activePaneId : panes[0]?.id;

    if (!paneId) {
      addPane(type);
      return;
    }

    const createdPane = splitPane({
      paneId,
      direction: getPaneSplitDirection(paneId),
      placement: "after",
      view: { type },
    });

    if (!createdPane) {
      addPane(type);
    }
  }

  useRegisterTool({
    id: "dashboard.get-state",
    name: "getDashboardState",
    inputSchema: z.object({}),
    description:
      "Get the dashboard layout tree. Group direction 'horizontal' means children are side-by-side left to right. Group direction 'vertical' means children are stacked top to bottom. The chat sidebar is separate and is not included.",
    fn: () => ({
      activePaneId,
      availableDirections: dashboardLayoutDirections,
      availableViewTypes: dashboardViewTypes,
      layout,
      panes,
    }),
  });

  useRegisterTool({
    id: "dashboard.set-layout",
    name: "setDashboardLayout",
    inputSchema: z.object({
      activePaneId: z.string().optional(),
      layout: dashboardLayoutSchema,
    }),
    description:
      "Replace the dashboard with a tree of views and split groups. Use horizontal groups for columns/left-right splits and vertical groups for rows/top-bottom splits. Example: a top half with two plots and a bottom table is a vertical root whose first child is a horizontal group of two plot views and second child is a table view. This does not control the AI chat sidebar.",
    fn: ({ activePaneId: nextActivePaneId, layout: nextLayout }) => {
      setLayout(nextLayout, nextActivePaneId);
      return useUiStore.getState().dashboardLayout;
    },
  });

  useRegisterTool({
    id: "dashboard.add-pane",
    name: "addDashboardPane",
    inputSchema: z.object({
      type: z.enum(dashboardViewTypes),
      title: z.string().optional(),
    }),
    description: "Add a dashboard pane with one of the supported view types.",
    fn: ({ type, title }) => addPane(type, title),
  });

  useRegisterTool({
    id: "dashboard.split-pane",
    name: "splitDashboardPane",
    inputSchema: z.object({
      paneId: z.string(),
      direction: z.enum(dashboardLayoutDirections),
      placement: z.enum(dashboardSplitPlacements).optional(),
      view: dashboardViewSchema,
    }),
    description:
      "Split an existing dashboard view pane into two panes. Use direction='horizontal' to put panes left/right. Use direction='vertical' to put panes top/bottom. placement controls whether the new view appears before or after the target pane in that direction.",
    fn: ({ direction, paneId, placement, view }) => {
      const pane = splitPane({ direction, paneId, placement, view });

      return {
        createdPane: pane,
        layout: useUiStore.getState().dashboardLayout,
      };
    },
  });

  useRegisterTool({
    id: "dashboard.update-pane",
    name: "updateDashboardPane",
    inputSchema: z.object({
      id: z.string(),
      title: z.string().optional(),
      type: z.enum(dashboardViewTypes).optional(),
      size: z.number().positive().optional(),
    }),
    description: "Update one dashboard pane by id.",
    fn: ({ id, ...patch }) => {
      updatePane(id, patch);
      return (
        getDashboardPanes(useUiStore.getState().dashboardLayout).find((pane) => pane.id === id) ??
        null
      );
    },
  });

  useRegisterTool({
    id: "dashboard.remove-pane",
    name: "removeDashboardPane",
    inputSchema: z.object({
      id: z.string(),
    }),
    description: "Remove a dashboard pane by id. The dashboard keeps at least one pane.",
    fn: ({ id }) => {
      removePane(id);
      return useUiStore.getState().dashboardLayout;
    },
  });

  return (
    <Box
      bg="color-mix(in oklab, var(--color-muted) 30%, transparent)"
      h="100%"
      mih={0}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <Group
        bg="var(--color-background)"
        h={44}
        justify="space-between"
        px="md"
        style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}
      >
        <Group gap="xs" miw={0}>
          <Grid2X2Icon color="var(--color-muted-foreground)" size={16} />
          <Text component="h2" fw={600} size="sm" truncate>
            Dashboard
          </Text>
        </Group>
        <Group gap={4}>
          {dashboardViewTypes.map((type) => {
            const Icon = viewIcons[type];

            return (
              <ActionIcon
                key={type}
                type="button"
                variant="subtle"
                size="md"
                title={`Add ${viewLabels[type]}`}
                aria-label={`Add ${viewLabels[type]}`}
                onClick={() => handleAddView(type)}
              >
                <Icon size={14} />
              </ActionIcon>
            );
          })}
        </Group>
      </Group>

      <Box mih={0} style={{ flex: "1 1 0", overflow: "hidden" }}>
        <Box key={layoutVersion} h="100%" mih={0}>
          <DashboardLayoutRenderer
            isTableLoading={isTableLoading}
            node={layout}
            tableInstance={tableInstance}
          />
        </Box>
      </Box>
    </Box>
  );
}
