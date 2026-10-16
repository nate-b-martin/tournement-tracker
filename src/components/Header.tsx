import { Link } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthWidget } from "./AuthWidget";

// Custom hook for media queries
function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		setMatches(media.matches);

		const listener = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, [query]);

	return matches;
}

const SMALL_SCREEN_BREAKPOINT = 768;

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const isSmallScreen = useMediaQuery(`(max-width: ${SMALL_SCREEN_BREAKPOINT}px)`);
	useAuth();

	return (
		<>
			{/* Header - always visible, contains logo */}
			<header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
				{/* Hamburger button only shown on small screens */}
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
						isSmallScreen ? "block" : "hidden md:block"
					}`}
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>

				<h1 className="ml-4 text-xl font-semibold">
					<Link to="/">
						<img
							src="/tanstack-word-logo-white.svg"
							alt="TanStack Logo"
							className="h-10"
						/>
					</Link>
				</h1>

				{/* Horizontal navigation links - shown only on large screens */}
				{!isSmallScreen && (
					<nav className="ml-auto flex items-center gap-1">
						<Link to="/" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<Home size={18} />
							<span>Home</span>
						</Link>

						<Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Dashboard</span>
						</Link>

						<Link to="/playerspage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Players</span>
						</Link>

						<Link to="/teamspage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Teams</span>
						</Link>

						<Link to="/tournamentspage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Tournaments</span>
						</Link>

						<Link to="/gamespage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Games</span>
						</Link>

						<Link to="/seasonspage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
							<span>Seasons</span>
						</Link>
					</nav>
				)}
			</header>

			{/* Sidebar - shown only on small screens */}
			{isSmallScreen && (
				<aside
					className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
						isOpen ? "translate-x-0" : "-translate-x-full"
					}`}
				>
					<div className="flex items-center justify-between p-4 border-b border-gray-700">
						<h2 className="text-xl font-bold">Navigation</h2>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
							aria-label="Close menu"
						>
							<X size={24} />
						</button>
					</div>

					<nav className="flex-1 p-4 overflow-y-auto">
						<Link
							to="/"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<Home size={20} />
							<span className="font-medium">Home</span>
						</Link>

						<Link
							to="/dashboard"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Dashboard</span>
						</Link>

						<Link
							to="/playerspage"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Players</span>
						</Link>

						<Link
							to="/teamspage"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Teams</span>
						</Link>

						<Link
							to="/tournamentspage"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Tournaments</span>
						</Link>

						<Link
							to="/gamespage"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Games</span>
						</Link>

						<Link
							to="/seasonspage"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<span className="font-medium">Seasons</span>
						</Link>
					</nav>

					<div className="p-4 border-t border-gray-700 bg-gray-800 flex flex-col gap-2">
						<AuthWidget />
					</div>
				</aside>
			)}
		</>
	);
}
