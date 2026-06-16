import { type ReactNode, useCallback } from "react";
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { create } from "zustand";

export const computedColumnTourStepIds = [
  "computed-column-entry",
  "computed-column-trigger",
  "computed-column-name",
  "computed-column-formula",
  "computed-column-create",
] as const;

export type ComputedColumnTourStepId = (typeof computedColumnTourStepIds)[number];

type TourId = "computed-column";

type TourState = {
  activeTourId: TourId | null;
  run: boolean;
  stepIndex: number;
  setComputedColumnTourStep: (stepId: ComputedColumnTourStepId) => void;
  setStepIndex: (stepIndex: number) => void;
  startComputedColumnTour: () => void;
  stopTour: () => void;
};

export const useTourStore = create<TourState>((set) => ({
  activeTourId: null,
  run: false,
  stepIndex: 0,
  setComputedColumnTourStep: (stepId) =>
    set((state) => {
      if (state.activeTourId !== "computed-column") {
        return state;
      }

      return {
        stepIndex: computedColumnTourStepIds.indexOf(stepId),
      };
    }),
  setStepIndex: (stepIndex) => set({ stepIndex }),
  startComputedColumnTour: () =>
    set({
      activeTourId: "computed-column",
      run: true,
      stepIndex: 0,
    }),
  stopTour: () =>
    set({
      activeTourId: null,
      run: false,
      stepIndex: 0,
    }),
}));

export function getComputedColumnTourStepId(stepIndex: number) {
  return computedColumnTourStepIds[stepIndex];
}

export function isComputedColumnTourStepId(
  value: string | number | undefined,
): value is ComputedColumnTourStepId {
  return computedColumnTourStepIds.includes(value as ComputedColumnTourStepId);
}

function clickComputedColumnAddButton() {
  document.querySelector<HTMLButtonElement>("[data-computed-column-add='true']")?.click();
}

const computedColumnTourSteps: Step[] = [
  {
    content: "Start guided workflows from here. This one creates a computed column.",
    disableFocusTrap: true,
    id: "computed-column-entry",
    placement: "bottom-end",
    spotlightPadding: 6,
    skipBeacon: true,
    target: "[data-tour-entry='true']",
    title: "Tours",
  },
  {
    content: "This calculator opens the formula builder for new numeric columns.",
    disableFocusTrap: true,
    id: "computed-column-trigger",
    placement: "left",
    spotlightPadding: 6,
    skipBeacon: true,
    target: "[data-computed-column-trigger='true']",
    title: "Computed columns",
  },
  {
    content: "The tour preloads Power Score so the new column is easy to spot.",
    disableFocusTrap: true,
    id: "computed-column-name",
    placement: "right-start",
    spotlightPadding: 6,
    skipBeacon: true,
    target: "[data-computed-column-name='true']",
    targetWaitTimeout: 3000,
    title: "Name",
  },
  {
    content: "Use column IDs in brackets. This example adds Attack and Defense.",
    disableFocusTrap: true,
    id: "computed-column-formula",
    placement: "right-start",
    spotlightPadding: 6,
    skipBeacon: true,
    target: "[data-computed-column-formula='true']",
    targetWaitTimeout: 3000,
    title: "Formula",
  },
  {
    content: "Create the example column and append it to the table.",
    disableFocusTrap: true,
    id: "computed-column-create",
    locale: {
      last: "Create column",
    },
    placement: "top-end",
    spotlightPadding: 6,
    skipBeacon: true,
    target: "[data-computed-column-add='true']",
    targetWaitTimeout: 3000,
    title: "Create it",
  },
];

function ComputedColumnJoyrideTour() {
  const activeTourId = useTourStore((state) => state.activeTourId);
  const run = useTourStore((state) => state.run);
  const stepIndex = useTourStore((state) => state.stepIndex);
  const setStepIndex = useTourStore((state) => state.setStepIndex);
  const stopTour = useTourStore((state) => state.stopTour);
  const isComputedColumnTour = activeTourId === "computed-column";

  function handleJoyrideEvent(data: EventData) {
    const { action, index, status, type } = data;
    const didFinishTour = status === STATUS.FINISHED || status === STATUS.SKIPPED;

    if (didFinishTour) {
      stopTour();
      return;
    }

    if (type !== EVENTS.STEP_AFTER && type !== EVENTS.TARGET_NOT_FOUND) {
      return;
    }

    if (index === computedColumnTourSteps.length - 1 && action === ACTIONS.NEXT) {
      clickComputedColumnAddButton();
      stopTour();
      return;
    }

    const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

    setStepIndex(Math.max(0, Math.min(nextStepIndex, computedColumnTourSteps.length - 1)));
  }

  return (
    <Joyride
      continuous
      locale={{
        back: "Back",
        close: "Close tour",
        last: "Create column",
        next: "Next",
        nextWithProgress: "Next",
        skip: "Skip",
      }}
      onEvent={handleJoyrideEvent}
      options={{
        arrowColor: "var(--color-popover)",
        backgroundColor: "var(--color-popover)",
        closeButtonAction: "skip",
        overlayClickAction: false,
        overlayColor: "rgb(9 9 11 / 0.48)",
        primaryColor: "var(--color-primary)",
        showProgress: true,
        spotlightRadius: 8,
        textColor: "var(--color-popover-foreground)",
        width: "18rem",
        zIndex: 10000,
      }}
      run={isComputedColumnTour && run}
      scrollToFirstStep={false}
      spotlightClicks
      stepIndex={stepIndex}
      steps={computedColumnTourSteps}
      styles={{
        tooltip: {
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          fontFamily: "var(--font-sans)",
          padding: "0.75rem",
          width: "18rem",
        },
        tooltipContent: {
          color: "var(--color-muted-foreground)",
          fontSize: "0.75rem",
          lineHeight: "1.15rem",
          padding: "0.375rem 0 0.25rem",
          textAlign: "left",
        },
        tooltipFooter: {
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.5rem",
        },
        tooltipTitle: {
          color: "var(--color-popover-foreground)",
          fontSize: "0.875rem",
          fontWeight: 700,
          lineHeight: "1.25rem",
          textAlign: "left",
        },
      }}
    />
  );
}

export function AppOnboardingProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ComputedColumnJoyrideTour />
    </>
  );
}

export function useStartComputedColumnTour() {
  const startComputedColumnTour = useTourStore((state) => state.startComputedColumnTour);

  return useCallback(() => {
    startComputedColumnTour();
  }, [startComputedColumnTour]);
}
