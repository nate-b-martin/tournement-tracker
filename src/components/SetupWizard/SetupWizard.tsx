import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	initialState,
	SetupWizardProvider,
	useWizard,
	wizardReducer,
} from "./SetupWizardContext";
import { StepConfigureTournament } from "./steps/StepConfigureTournament";
import { StepCreateSeason } from "./steps/StepCreateSeason";
import { StepManageRosters } from "./steps/StepManageRosters";
import { StepReview } from "./steps/StepReview";
import { StepSelectTeams } from "./steps/StepSelectTeams";
import type { PlayerEntry } from "./types";
import { WizardStep } from "./types";
import { WizardStepper } from "./WizardStepper";

interface SetupWizardProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

function WizardContent({
	onOpenChange,
	onSuccess,
}: {
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const {
		state,
		dispatch,
		goToStep,
		nextStep,
		prevStep,
		canGoNext,
		canGoPrev,
	} = useWizard();
	const navigate = useNavigate();

	const createTeam = useMutation(api.teams.create);
	const createPlayer = useMutation(api.players.create);
	const createSeason = useMutation(api.seasons.create);
	const addSeasonTeams = useMutation(api.seasonTeams.addTeams);
	const createTournament = useMutation(api.tournaments.create);
	const assignPlayersToTeam = useMutation(api.players.bulkAssignToTeam);

	const handleSubmit = async () => {
		dispatch({ type: "SET_SUBMITTING", isSubmitting: true });

		try {
			// 1. Create season first to get its ID
			dispatch({ type: "SET_SUBMIT_PHASE", phase: "Creating season..." });
			const seasonId = await createSeason({
				name: state.season.name.trim(),
				sport: state.season.sport.trim(),
				startDate: state.season.startDate,
				endDate: state.season.endDate,
				description: state.season.description.trim() || undefined,
			});

			// 2. Create tournament with seasonId
			dispatch({ type: "SET_SUBMIT_PHASE", phase: "Creating tournament..." });
			const tournamentId = await createTournament({
				name: state.tournament.name.trim(),
				sport: state.season.sport.trim(),
				location: state.tournament.location.trim(),
				maxTeams: state.tournament.maxTeams,
				minTeams: state.tournament.minTeams,
				fieldsAvailable: state.tournament.fieldsAvailable,
				gameDuration: state.tournament.gameDuration,
				breakBetweenGames: state.tournament.breakBetweenGames,
				bracketType: state.tournament.bracketType,
				seedingType: state.tournament.seedingType,
				registrationDeadline: state.tournament.registrationDeadline,
				seasonId,
			});

			// 3. Create new teams, mapping temp keys to real IDs
			dispatch({ type: "SET_SUBMIT_PHASE", phase: "Creating teams..." });
			const newTeams = state.selectedTeams.filter((t) => t.isNew);
			const existingTeams = state.selectedTeams.filter((t) => !t.isNew);

			const teamIdMap = new Map<string, Id<"teams">>();

			// Create new teams
			for (const team of newTeams) {
				const id = await createTeam({
					tournamentId,
					name: team.name.trim(),
					coachName: team.coachName.trim(),
					coachEmail: team.coachEmail.trim(),
					coachPhone: team.coachPhone.trim(),
					city: team.city?.trim() || undefined,
				});
				teamIdMap.set(team.key, id);
			}

			// Add existing teams to the map
			for (const team of existingTeams) {
				if (team.existingId) {
					teamIdMap.set(team.key, team.existingId);
				}
			}

			// 4. Create/assign players for each team
			dispatch({ type: "SET_SUBMIT_PHASE", phase: "Creating players..." });
			for (const [teamKey, players] of Object.entries(state.rosters)) {
				const teamId = teamIdMap.get(teamKey);
				if (!teamId || players.length === 0) continue;

				const newPlayers = players.filter((p) => !p.existingPlayerId);
				const existingIds = players
					.filter(
						(p): p is PlayerEntry & { existingPlayerId: Id<"players"> } =>
							!!p.existingPlayerId,
					)
					.map((p) => p.existingPlayerId);

				for (const player of newPlayers) {
					await createPlayer({
						teamId,
						firstName: player.firstName.trim(),
						lastName: player.lastName.trim(),
						jerseyNumber: player.jerseyNumber,
					});
				}

				if (existingIds.length > 0) {
					await assignPlayersToTeam({ playerIds: existingIds, teamId });
				}
			}

			// 5. Link teams to season
			dispatch({
				type: "SET_SUBMIT_PHASE",
				phase: "Linking teams to season...",
			});
			const allTeamIds = Array.from(teamIdMap.values());
			await addSeasonTeams({
				seasonId,
				teamIds: allTeamIds,
			});

			dispatch({ type: "SET_SUBMIT_PHASE", phase: "Done!" });

			toast.success("Setup complete! Everything has been created.");
			dispatch({ type: "RESET" });
			onOpenChange(false);
			onSuccess?.();
			navigate({ to: `/seasons/${seasonId}` });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "An unexpected error occurred";
			toast.error(`Setup failed: ${message}`);
		} finally {
			dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
			dispatch({ type: "SET_SUBMIT_PHASE", phase: "" });
		}
	};

	const renderStep = () => {
		switch (state.step) {
			case WizardStep.SelectTeams:
				return <StepSelectTeams />;
			case WizardStep.ManageRosters:
				return <StepManageRosters />;
			case WizardStep.CreateSeason:
				return <StepCreateSeason />;
			case WizardStep.ConfigureTournament:
				return <StepConfigureTournament />;
			case WizardStep.Review:
				return <StepReview />;
			default:
				return null;
		}
	};

	const totalTeams = state.selectedTeams.length;
	const totalPlayers = Object.values(state.rosters).reduce(
		(s, p) => s + p.length,
		0,
	);

	return (
		<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Setup Season Wizard</DialogTitle>
				<DialogDescription>
					You have selected {totalTeams} team{totalTeams !== 1 ? "s" : ""}
					{totalPlayers > 0 &&
						` with ${totalPlayers} player${totalPlayers !== 1 ? "s" : ""}`}
					.
				</DialogDescription>
			</DialogHeader>

			<WizardStepper currentStep={state.step} onStepClick={goToStep} />

			<div className="py-4">{renderStep()}</div>

			<div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
				<div>
					{canGoPrev && !state.isSubmitting && (
						<Button type="button" variant="ghost" onClick={prevStep}>
							Back
						</Button>
					)}
				</div>
				<div className="flex gap-2">
					{state.isSubmitting && state.submitPhase && (
						<span className="flex items-center text-sm text-muted-foreground">
							{state.submitPhase}
						</span>
					)}
					{state.step < WizardStep.Review ? (
						<Button
							type="button"
							onClick={nextStep}
							disabled={!canGoNext || state.isSubmitting}
						>
							Next
						</Button>
					) : (
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={state.isSubmitting}
						>
							{state.isSubmitting ? "Creating..." : "Create All"}
						</Button>
					)}
				</div>
			</div>
		</DialogContent>
	);
}

export function SetupWizard({
	open,
	onOpenChange,
	onSuccess,
}: SetupWizardProps) {
	const [externalState, externalDispatch] = useReducer(
		wizardReducer,
		initialState,
	);
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

	const hasData =
		externalState.selectedTeams.length > 0 ||
		externalState.season.name.trim().length > 0 ||
		externalState.season.sport.trim().length > 0;

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen && hasData) {
			setShowDiscardConfirm(true);
		} else {
			onOpenChange(newOpen);
		}
	};

	const handleConfirmDiscard = () => {
		setShowDiscardConfirm(false);
		externalDispatch({ type: "RESET" });
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<SetupWizardProvider
					externalState={externalState}
					externalDispatch={externalDispatch}
				>
					<WizardContent onOpenChange={onOpenChange} onSuccess={onSuccess} />
				</SetupWizardProvider>
			</Dialog>

			<Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Discard progress?</DialogTitle>
						<DialogDescription>
							You have unsaved data. Are you sure you want to close the wizard?
							All progress will be lost.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowDiscardConfirm(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleConfirmDiscard}
						>
							Discard
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
