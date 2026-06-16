import { AiSettingsProvider } from "@/ai";
import { usePokemonTable } from "@/table/table";
import { Dashboard } from "./dashboard";
import { AppShell } from "./app-shell";
import { AppOnboardingProvider } from "./onboarding-flow";

function AppContent() {
  const table = usePokemonTable();

  return (
    <AppShell
      main={<Dashboard tableInstance={table.instance} isTableLoading={table.isLoading} />}
    />
  );
}

export function App() {
  return (
    <AiSettingsProvider>
      <AppOnboardingProvider>
        <AppContent />
      </AppOnboardingProvider>
    </AiSettingsProvider>
  );
}
