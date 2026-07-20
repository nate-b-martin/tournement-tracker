import { cn } from "@/lib/utils";
import { WizardStep } from "./types";

const STEP_LABELS: Record<WizardStep, string> = {
	[WizardStep.SelectTeams]: "Select Teams",
	[WizardStep.ManageRosters]: "Manage Rosters",
	[WizardStep.CreateSeason]: "Create Season",
	[WizardStep.ConfigureTournament]: "Configure Tournament",
	[WizardStep.Review]: "Review & Create",
};

interface WizardStepperProps {
	currentStep: WizardStep;
	onStepClick?: (step: WizardStep) => void;
}

export function WizardStepper({
	currentStep,
	onStepClick,
}: WizardStepperProps) {
	const steps = Object.values(WizardStep).filter(
		(v) => typeof v === "number",
	) as WizardStep[];

	return (
		<nav className="w-full" aria-label="Setup progress">
			<ol className="flex items-center justify-between">
				{steps.map((step) => {
					const isCompleted = step < currentStep;
					const isCurrent = step === currentStep;
					const isClickable = isCompleted;

					return (
						<li key={step} className="flex items-center">
							<button
								type="button"
								disabled={!isClickable}
								onClick={() => isClickable && onStepClick?.(step)}
								className={cn(
									"flex flex-col items-center gap-1 transition-colors",
									isClickable && "cursor-pointer",
									!isClickable && "cursor-default",
								)}
								aria-current={isCurrent ? "step" : undefined}
							>
								<span
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
										isCompleted && "bg-emerald-500/20 text-emerald-400",
										isCurrent &&
											"bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/40",
										!isCompleted &&
											!isCurrent &&
											"bg-slate-700/50 text-slate-400",
									)}
								>
									{isCompleted ? (
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									) : (
										step + 1
									)}
								</span>
								<span
									className={cn(
										"hidden text-xs font-medium sm:block",
										isCompleted && "text-emerald-400",
										isCurrent && "text-indigo-400",
										!isCompleted && !isCurrent && "text-slate-500",
									)}
								>
									{STEP_LABELS[step]}
								</span>
							</button>
							{step < WizardStep.Review && (
								<div
									className={cn(
										"mx-2 h-px w-8 sm:w-16 md:w-24",
										step < currentStep
											? "bg-emerald-500/40"
											: "bg-slate-700/50",
									)}
									aria-hidden="true"
								/>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
