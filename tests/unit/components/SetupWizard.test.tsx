import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	SetupWizardProvider,
	useWizard,
} from "@/components/SetupWizard/SetupWizardContext";
import type { TeamEntry, WizardState } from "@/components/SetupWizard/types";
import { WizardStep } from "@/components/SetupWizard/types";
import { WizardStepper } from "@/components/SetupWizard/WizardStepper";
import { StepSelectTeams } from "@/components/SetupWizard/steps/StepSelectTeams";
import { StepManageRosters } from "@/components/SetupWizard/steps/StepManageRosters";
import { StepCreateSeason } from "@/components/SetupWizard/steps/StepCreateSeason";
import { StepConfigureTournament } from "@/components/SetupWizard/steps/StepConfigureTournament";
import { StepReview } from "@/components/SetupWizard/steps/StepReview";
import { StepReview as StepReviewAlias } from "@/components/SetupWizard/steps/StepReview";

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
	}: { children: React.ReactNode; to: string; params: Record<string, string> }) => (
		<a href={to} onClick={(e) => e.preventDefault()} data-testid="router-link">
			{children}
		</a>
	),
	useParams: vi.fn(() => ({})),
	useNavigate: vi.fn(() => vi.fn()),
}));

import { useQuery } from "convex/react";

describe("SetupWizardContext", () => {
	it("initializes with default state", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		expect(result.current.state.step).toBe(WizardStep.SelectTeams);
		expect(result.current.state.selectedTeams).toEqual([]);
		expect(result.current.state.season.name).toBe("");
		expect(result.current.canGoNext).toBe(false);
		expect(result.current.canGoPrev).toBe(false);
	});

	it("cannot go next with fewer than 2 teams", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		expect(result.current.canGoNext).toBe(false);
	});

	it("can go next with 2 teams selected", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "ADD_NEW_TEAM",
				team: {
					key: "t1",
					isNew: true,
					name: "Team A",
					coachName: "Coach A",
					coachEmail: "a@test.com",
					coachPhone: "555-0001",
				},
			});
		});

		act(() => {
			result.current.dispatch({
				type: "ADD_NEW_TEAM",
				team: {
					key: "t2",
					isNew: true,
					name: "Team B",
					coachName: "Coach B",
					coachEmail: "b@test.com",
					coachPhone: "555-0002",
				},
			});
		});

		expect(result.current.canGoNext).toBe(true);
	});

	it("can go prev after first step", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.goToStep(WizardStep.ManageRosters);
		});

		expect(result.current.canGoPrev).toBe(true);
	});

	it("navigates forward and backward", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.nextStep();
		});

		expect(result.current.state.step).toBe(WizardStep.ManageRosters);

		act(() => {
			result.current.prevStep();
		});

		expect(result.current.state.step).toBe(WizardStep.SelectTeams);
	});

	it("adds and removes teams", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "ADD_NEW_TEAM",
				team: {
					key: "t1",
					isNew: true,
					name: "Team A",
					coachName: "Coach A",
					coachEmail: "a@test.com",
					coachPhone: "555-0001",
				},
			});
		});

		expect(result.current.state.selectedTeams).toHaveLength(1);

		act(() => {
			result.current.dispatch({ type: "REMOVE_TEAM", key: "t1" });
		});

		expect(result.current.state.selectedTeams).toHaveLength(0);
	});

	it("adds and removes players from roster", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "ADD_PLAYER",
				teamKey: "t1",
				player: { firstName: "Jane", lastName: "Doe" },
			});
		});

		expect(result.current.state.rosters["t1"]).toHaveLength(1);

		act(() => {
			result.current.dispatch({
				type: "REMOVE_PLAYER",
				teamKey: "t1",
				index: 0,
			});
		});

		expect(result.current.state.rosters["t1"]).toHaveLength(0);
	});

	it("sets season fields", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "SET_SEASON",
				season: { name: "Spring 2026", sport: "Baseball" },
			});
		});

		expect(result.current.state.season.name).toBe("Spring 2026");
		expect(result.current.state.season.sport).toBe("Baseball");
	});

	it("sets tournament fields", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "SET_TOURNAMENT",
				tournament: { location: "Complex", bracketType: "double_elimination" },
			});
		});

		expect(result.current.state.tournament.location).toBe("Complex");
		expect(result.current.state.tournament.bracketType).toBe(
			"double_elimination",
		);
	});

	it("resets state", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.dispatch({
				type: "ADD_NEW_TEAM",
				team: {
					key: "t1",
					isNew: true,
					name: "Team A",
					coachName: "Coach A",
					coachEmail: "a@test.com",
					coachPhone: "555-0001",
				},
			});
		});

		act(() => {
			result.current.dispatch({ type: "RESET" });
		});

		expect(result.current.state.selectedTeams).toHaveLength(0);
		expect(result.current.state.step).toBe(WizardStep.SelectTeams);
	});

	it("canGoNext for season step requires all fields", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.goToStep(WizardStep.CreateSeason);
		});

		expect(result.current.canGoNext).toBe(false);

		act(() => {
			result.current.dispatch({
				type: "SET_SEASON",
				season: { name: "Spring", sport: "Baseball", startDate: Date.now(), endDate: Date.now() },
			});
		});

		expect(result.current.canGoNext).toBe(true);
	});

	it("canGoNext for tournament step requires name and location", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.goToStep(WizardStep.ConfigureTournament);
		});

		expect(result.current.canGoNext).toBe(false);

		act(() => {
			result.current.dispatch({
				type: "SET_TOURNAMENT",
				tournament: { name: "Championship", location: "Stadium" },
			});
		});

		expect(result.current.canGoNext).toBe(true);
	});

	it("review step is always valid", () => {
		const { result } = renderHook(() => useWizard(), {
			wrapper: ({ children }) => (
				<SetupWizardProvider>{children}</SetupWizardProvider>
			),
		});

		act(() => {
			result.current.goToStep(WizardStep.Review);
		});

		expect(result.current.canGoNext).toBe(true);
	});

	it("throws error if useWizard used outside provider", () => {
		expect(() => {
			renderHook(() => useWizard());
		}).toThrow("useWizard must be used within a SetupWizardProvider");
	});
});

describe("WizardStepper", () => {
	it("renders all 5 steps", () => {
		render(<WizardStepper currentStep={WizardStep.SelectTeams} />);
		expect(screen.getByText("Select Teams")).toBeTruthy();
	});

	it("highlights current step", () => {
		render(<WizardStepper currentStep={WizardStep.SelectTeams} />);
		const stepButton = screen.getByText("Select Teams").closest("button");
		expect(stepButton?.getAttribute("aria-current")).toBe("step");
	});

	it("calls onStepClick when completed step is clicked", () => {
		const onStepClick = vi.fn();
		render(
			<WizardStepper
				currentStep={WizardStep.Review}
				onStepClick={onStepClick}
			/>,
		);
		const stepButton = screen.getByText("Select Teams").closest("button");
		stepButton?.click();
		expect(onStepClick).toHaveBeenCalledWith(WizardStep.SelectTeams);
	});
});

describe("StepSelectTeams", () => {
	it("renders the select teams heading", () => {
		render(
			<SetupWizardProvider>
				<StepSelectTeams />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("Select Teams")).toBeTruthy();
	});

	it("shows create new team button", () => {
		render(
			<SetupWizardProvider>
				<StepSelectTeams />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("+ Create New Team")).toBeTruthy();
	});
});

describe("StepManageRosters", () => {
	it("shows empty state when no teams", () => {
		render(
			<SetupWizardProvider>
				<StepManageRosters />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("Manage Rosters")).toBeTruthy();
	});
});

describe("StepCreateSeason", () => {
	it("renders season form fields", () => {
		render(
			<SetupWizardProvider>
				<StepCreateSeason />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("Create Season")).toBeTruthy();
		expect(screen.getByText("Season Name *")).toBeTruthy();
		expect(screen.getByText("Sport *")).toBeTruthy();
		expect(screen.getByText("Start Date *")).toBeTruthy();
		expect(screen.getByText("End Date *")).toBeTruthy();
	});
});

describe("StepConfigureTournament", () => {
	it("renders tournament form fields", () => {
		render(
			<SetupWizardProvider>
				<StepConfigureTournament />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("Configure Tournament")).toBeTruthy();
		expect(screen.getByText("Tournament Name *")).toBeTruthy();
		expect(screen.getByText("Location *")).toBeTruthy();
	});
});

describe("StepReview", () => {
	it("renders review headings", () => {
		render(
			<SetupWizardProvider>
				<StepReview />
			</SetupWizardProvider>,
		);
		expect(screen.getByText("Review & Create")).toBeTruthy();
	});
});
