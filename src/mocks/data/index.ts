/**
 * Mock Data Index - Central export point for all mock data
 *
 * This file provides a clean import interface for all mock data
 * and helper functions used throughout the development environment.
 */

export {
	getActiveMockPlayers,
	getMockPlayerById,
	getMockPlayersWithTeams,
	mockPlayers,
	searchMockPlayers,
} from "./mockPlayers";
export { getActiveMockTeams, getMockTeamById, mockTeams } from "./mockTeams";
