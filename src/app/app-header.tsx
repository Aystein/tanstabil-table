import { ActionIcon, Box, Button, Group, Menu, Text } from "@mantine/core";
import {
  CalculatorIcon,
  ChevronDownIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";

type AppHeaderProps = {
  isChatOpen: boolean;
  onOpenSettings: () => void;
  onStartComputedColumnTour: () => void;
  onToggleChat: () => void;
};

export function AppHeader({
  isChatOpen,
  onOpenSettings,
  onStartComputedColumnTour,
  onToggleChat,
}: AppHeaderProps) {
  const ChatPanelIcon = isChatOpen ? PanelRightCloseIcon : PanelRightOpenIcon;

  return (
    <Box
      component="header"
      bg="var(--color-background)"
      h={48}
      px="md"
      style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}
    >
      <Group h="100%" justify="space-between">
        <Group gap="xs" miw={0}>
          <Box bg="var(--color-primary)" h={8} style={{ borderRadius: 999 }} w={8} />
          <Text component="h1" fw={600} size="sm" truncate>
            Tanstabil table
          </Text>
        </Group>

        <Group gap={4}>
          <Menu position="bottom-end" shadow="md" width={220}>
            <Menu.Target>
              <Button
                aria-label="Open onboarding tours"
                data-tour-entry="true"
                h={32}
                leftSection={<SparklesIcon size={14} />}
                rightSection={<ChevronDownIcon size={14} />}
                size="xs"
                styles={{
                  root: {
                    background: "linear-gradient(135deg, #0f766e 0%, #2563eb 48%, #c026d3 100%)",
                    border: "0",
                    boxShadow: "0 8px 22px rgb(37 99 235 / 0.22)",
                    color: "white",
                    fontWeight: 700,
                  },
                  section: {
                    color: "white",
                  },
                }}
                type="button"
              >
                Tours
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Onboarding</Menu.Label>
              <Menu.Item
                leftSection={<CalculatorIcon size={14} />}
                onClick={onStartComputedColumnTour}
              >
                Computed column
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon
            type="button"
            variant="subtle"
            size="md"
            title="Settings"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <SettingsIcon size={14} />
          </ActionIcon>
          <ActionIcon
            type="button"
            variant="subtle"
            size="md"
            title={isChatOpen ? "Collapse AI chat" : "Expand AI chat"}
            aria-label={isChatOpen ? "Collapse AI chat" : "Expand AI chat"}
            aria-pressed={isChatOpen}
            onClick={onToggleChat}
          >
            <ChatPanelIcon size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
