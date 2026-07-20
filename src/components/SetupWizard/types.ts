import type { Id } from "../../../convex/_generated/dataModel";

export enum WizardStep {
	SelectTeams = 0,
	ManageRosters = 1,
	CreateSeason = 2,
	ConfigureTournament = 3,
	Review = 4,
}

export interface TeamEntry {
	key: string;
	existingId?: Id<"teams">;
	isNew: boolean;
	name: string;
	coachName: string;
	coachEmail: string;
	coachPhone: string;
	city?: string;
}

export interface PlayerEntry {
	firstName: string;
	lastName: string;
	jerseyNumber?: number;
}

export interface SeasonEntry {
	name: string;
	sport: string;
	startDate: number;
	endDate: number;
	description: string;
}

export interface TournamentEntry {
	name: string;
	location: string;
	bracketType: "single_elimination" | "double_elimination" | "round_robin";
	maxTeams: number;
	minTeams: number;
	fieldsAvailable: number;
	gameDuration: number;
	breakBetweenGames: number;
	seedingType: "random" | "manual" | "ranking";
	registrationDeadline?: number;
}

export interface WizardState {
	step: WizardStep;
	selectedTeams: TeamEntry[];
	rosters: Record<string, PlayerEntry[]>;
	season: SeasonEntry;
	tournament: TournamentEntry;
	isSubmitting: boolean;
	submitPhase: string;
}

export type WizardAction =
	| { type: "SET_STEP"; step: WizardStep }
	| { type: "SET_TEAMS"; teams: TeamEntry[] }
	| { type: "ADD_NEW_TEAM"; team: TeamEntry }
	| { type: "REMOVE_TEAM"; key: string }
	| { type: "SET_ROSTER"; teamKey: string; players: PlayerEntry[] }
	| { type: "ADD_PLAYER"; teamKey: string; player: PlayerEntry }
	| { type: "REMOVE_PLAYER"; teamKey: string; index: number }
	| { type: "SET_SEASON"; season: Partial<SeasonEntry> }
	| { type: "SET_TOURNAMENT"; tournament: Partial<TournamentEntry> }
	| { type: "SET_SUBMITTING"; isSubmitting: boolean }
	| { type: "SET_SUBMIT_PHASE"; phase: string }
	| { type: "RESET" };

export interface WizardContextValue {
	state: WizardState;
	dispatch: React.Dispatch<WizardAction>;
	goToStep: (step: WizardStep) => void;
	nextStep: () => void;
	prevStep: () => void;
	canGoNext: boolean;
	canGoPrev: boolean;
}
