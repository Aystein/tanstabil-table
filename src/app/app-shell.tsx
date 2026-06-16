import { type ReactNode } from "react";
import { Box } from "@mantine/core";
import { AiChat } from "@/ai";
import { AppHeader } from "./app-header";
import { useStartComputedColumnTour } from "./onboarding-flow";
import { SettingsModal } from "./settings-modal";
import { useUiStore } from "./ui-store";

type AppShellProps = {
  main: ReactNode;
};

export function AppShell({ main }: AppShellProps) {
  const isChatOpen = useUiStore((state) => state.isChatOpen);
  const isSettingsOpen = useUiStore((state) => state.isSettingsOpen);
  const setChatOpen = useUiStore((state) => state.setChatOpen);
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen);
  const startComputedColumnTour = useStartComputedColumnTour();

  return (
    <Box
      c="var(--color-foreground)"
      bg="color-mix(in oklab, var(--color-muted) 30%, transparent)"
      h="100dvh"
      mih={0}
      w="100%"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <AppHeader
        isChatOpen={isChatOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onStartComputedColumnTour={() => void startComputedColumnTour()}
        onToggleChat={() => setChatOpen(!isChatOpen)}
      />

      <Box
        mih={0}
        w="100%"
        style={{
          display: "grid",
          flex: "1 1 0",
          gridTemplateColumns: isChatOpen ? "minmax(0, 1fr) 22rem" : "minmax(0, 1fr) 0rem",
          overflow: "hidden",
          transition: "grid-template-columns 200ms ease",
        }}
      >
        <Box component="main" mih={0} miw={0} style={{ overflow: "hidden" }}>
          {main}
        </Box>

        <Box
          component="aside"
          aria-hidden={!isChatOpen}
          bg="var(--color-background)"
          mih={0}
          miw={0}
          style={{
            borderLeft: isChatOpen ? "1px solid var(--color-border)" : undefined,
            overflow: "hidden",
            transition: "opacity 200ms ease",
          }}
        >
          <AiChat />
        </Box>
      </Box>

      <SettingsModal open={isSettingsOpen} onOpenChange={setSettingsOpen} />
    </Box>
  );
}
