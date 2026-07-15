# Quickstart Guide

## Sign In / Sign Up

1. Navigate to any page in the app (e.g., [http://localhost:3000](http://localhost:3000) for local dev)
2. Click **Sign In** in the sidebar navigation (bottom of the slide-out menu)
3. Choose to sign in with an existing account or create a new one (Clerk handles sign-up)
4. After first sign-in, you are automatically assigned the **Admin** role (first user only)
5. Subsequent users default to the **Spectator** role

## Understanding Your Role

After signing in, the app determines what you can see and do based on your role:

| Role | Icon/Badge | What You Can Do |
|------|------------|-----------------|
| **Admin** | (full access) | Create/edit/delete anything. Manage users. |
| **Organizer** | (tournament mgmt) | Create and manage tournaments, schedule games |
| **Player** | (team data) | Manage team rosters, view schedules |
| **Spectator** | (read-only) | View brackets, schedules, stats. Cannot make changes. |

If you're not an admin, you'll see a yellow banner: *"Viewing as spectator. Contact an admin to make changes."*

## Where to Go Next

- **Dashboard** (`/dashboard`) — Overview cards for teams, players, tournaments. Quick-access tables.
- **Players** (`/playerspage`) — Browse all players, search by name, filter by status/team
- **Teams** (`/teamspage`) — Browse teams, view roster sizes
- **Tournaments** (`/tournamentspage`) — Browse or create tournaments
- **Games** (`/gamespage`) — View scheduled games
- **Tournament Detail** — Click into a tournament to see its teams, games, bracket, standings, and fields

## Tips

- Use the hamburger menu (top-left) to open navigation
- Tables support: text search, column sorting, status filters, pagination
- Edit/Delete actions appear on table rows when you have sufficient permissions
- The app updates in real-time — data changes sync automatically via Convex
