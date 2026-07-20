import { createContext, useContext, useMemo, useReducer } from "react";
import type { WizardAction, WizardContextValue, WizardState } from "./types";
import { WizardStep } from "./types";

export const initialState: WizardState = {
	step: WizardStep.SelectTeams,
	selectedTeams: [],
	rosters: {},
	season: {
		name: "",
		sport: "",
		startDate: 0,
		endDate: 0,
		description: "",
	},
	tournament: {
		name: "",
		location: "",
		bracketType: "single_elimination",
		maxTeams: 4,
		minTeams: 2,
		fieldsAvailable: 4,
		gameDuration: 60,
		breakBetweenGames: 15,
		seedingType: "random",
	},
	isSubmitting: false,
	submitPhase: "",
};

export function wizardReducer(
	state: WizardState,
	action: WizardAction,
): WizardState {
	switch (action.type) {
		case "SET_STEP":
			return { ...state, step: action.step };
		case "SET_TEAMS":
			return { ...state, selectedTeams: action.teams };
		case "ADD_NEW_TEAM":
			return {
				...state,
				selectedTeams: [...state.selectedTeams, action.team],
			};
		case "REMOVE_TEAM": {
			const newTeams = state.selectedTeams.filter((t) => t.key !== action.key);
			const newRosters = { ...state.rosters };
			delete newRosters[action.key];
			return { ...state, selectedTeams: newTeams, rosters: newRosters };
		}
		case "SET_ROSTER":
			return {
				...state,
				rosters: { ...state.rosters, [action.teamKey]: action.players },
			};
		case "ADD_PLAYER": {
			const existing = state.rosters[action.teamKey] || [];
			return {
				...state,
				rosters: {
					...state.rosters,
					[action.teamKey]: [...existing, action.player],
				},
			};
		}
		case "REMOVE_PLAYER": {
			const current = state.rosters[action.teamKey] || [];
			return {
				...state,
				rosters: {
					...state.rosters,
					[action.teamKey]: current.filter((_, i) => i !== action.index),
				},
			};
		}
		case "SET_SEASON":
			return {
				...state,
				season: { ...state.season, ...action.season },
			};
		case "SET_TOURNAMENT":
			return {
				...state,
				tournament: { ...state.tournament, ...action.tournament },
			};
		case "SET_SUBMITTING":
			return { ...state, isSubmitting: action.isSubmitting };
		case "SET_SUBMIT_PHASE":
			return { ...state, submitPhase: action.phase };
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

function getCanGoNext(state: WizardState): boolean {
	switch (state.step) {
		case WizardStep.SelectTeams:
			return state.selectedTeams.length >= 2;
		case WizardStep.ManageRosters:
			return true;
		case WizardStep.CreateSeason:
			return (
				state.season.name.trim().length > 0 &&
				state.season.sport.trim().length > 0 &&
				state.season.startDate > 0 &&
				state.season.endDate > 0
			);
		case WizardStep.ConfigureTournament:
			return (
				state.tournament.name.trim().length > 0 &&
				state.tournament.location.trim().length > 0
			);
		case WizardStep.Review:
			return true;
		default:
			return false;
	}
}

const WizardContext = createContext<WizardContextValue | null>(null);

interface SetupWizardProviderProps {
	children: React.ReactNode;
	externalState?: WizardState;
	externalDispatch?: React.Dispatch<WizardAction>;
}

export function SetupWizardProvider({
	children,
	externalState,
	externalDispatch,
}: SetupWizardProviderProps) {
	const [internalState, internalDispatch] = useReducer(
		wizardReducer,
		initialState,
	);
	const state = externalState ?? internalState;
	const dispatch = externalDispatch ?? internalDispatch;

	const value = useMemo<WizardContextValue>(
		() => ({
			state,
			dispatch,
			goToStep: (step: WizardStep) => {
				dispatch({ type: "SET_STEP", step });
			},
			nextStep: () => {
				if (state.step < WizardStep.Review) {
					dispatch({ type: "SET_STEP", step: state.step + 1 });
				}
			},
			prevStep: () => {
				if (state.step > WizardStep.SelectTeams) {
					dispatch({ type: "SET_STEP", step: state.step - 1 });
				}
			},
			canGoNext: getCanGoNext(state),
			canGoPrev: state.step > WizardStep.SelectTeams,
		}),
		[state, dispatch],
	);

	return (
		<WizardContext.Provider value={value}>{children}</WizardContext.Provider>
	);
}

export function useWizard(): WizardContextValue {
	const ctx = useContext(WizardContext);
	if (!ctx) {
		throw new Error("useWizard must be used within a SetupWizardProvider");
	}
	return ctx;
}
