# Tournament Glossary

## General Terms

| Term | Definition |
|------|------------|
| **Tournament** | A competition with multiple teams playing a series of games to determine a winner. |
| **Bracket** | The structured format showing which teams play whom and when. |
| **Seeding** | The process of ranking and placing teams into bracket positions. |
| **Bye** | A team that advances to the next round without playing (used when the number of teams doesn't fit a perfect bracket). |
| **Round** | A stage of the tournament where all remaining teams play simultaneously. |
| **Matchup** | A pair of teams scheduled to play each other. |
| **Standings** | The ranked list of teams based on their results. |

## Bracket Types

### Single Elimination

The most common format. Each loss eliminates a team. The winner must win every match.

```
Round 1      Semifinals      Finals
  Team A ─────┐
               ├── Winner ──┐
  Team B ─────┘            │
                            ├── Champion
  Team C ─────┐            │
               ├── Winner ──┘
  Team D ─────┘
```

- Quickest format
- Works well for 2, 4, 8, 16, 32 teams (powers of 2)
- Each team must lose to be eliminated

### Double Elimination

Teams must lose twice to be eliminated. Has a winners' bracket and losers' bracket.

```
Winners Bracket          Losers Bracket
  Team A ──┐              ┌── Loser A
            ├── Winner ──┐│
  Team B ──┘            ││├── Survivor ──┐
                        └┤│              │├── Playoff
  Team C ──┐            ┌┘              ││
            ├── Winner ──┘  ┌── Loser B ─┘
  Team D ──┘               │
                            └── Survivor ──┘
```

- Each team gets a second chance
- More games = more playing time
- Ends with a final match where the losers' bracket winner must beat the winners' bracket winner twice

### Round Robin

Every team plays every other team. Winner is determined by best record.

- Most fair — all teams play the same number of games
- Requires many games (N teams = N*(N-1)/2 games)
- Best for small groups (4-8 teams)
- Standings based on: wins, losses, ties, point differential

## Seeding Types

| Type | How It Works | When to Use |
|------|-------------|-------------|
| **Random** | Teams are placed into bracket positions by random draw | Casual tournaments, no ranking data |
| **Manual** | Organizer assigns bracket positions by hand | When specific matchups are desired |
| **Ranking** | Teams are ordered by skill/rating then placed into standard bracket positions (1 vs 16, 8 vs 9, etc.) | Competitive tournaments with rankings |

## Tournament States

| State | Meaning |
|-------|---------|
| **Draft** | Tournament is being created. Not yet visible to the public. |
| **Registration Open** | Teams can sign up to participate. |
| **Registration Closed** | Team registration is locked. Rosters are final. |
| **Active** | Games are being played. Scores updated live. |
| **Complete** | All games finished. Final results posted. |

## Game States

| State | Meaning |
|-------|---------|
| **Scheduled** | Game has been assigned teams, time, and field. |
| **In Progress** | Game is currently being played. |
| **Completed** | Final score recorded. Winner determined. |
| **Postponed** | Game moved to a later time. |
| **Cancelled** | Game will not be played. |

## Player & Team States

| State | Meaning |
|-------|---------|
| **Active** (player) | Player is eligible to play. |
| **Inactive** (player) | Player is not currently on a team. |
| **Injured** (player) | Player is temporarily unable to play. |
| **Active** (team) | Team is participating in tournaments. |
| **Inactive** (team) | Team is not currently active. |
| **Suspended** (team) | Team is temporarily banned from play. |

## Scoring & Statistics

| Term | Definition |
|------|------------|
| **At Bat (AB)** | Number of times a player has batted (excluding walks, sacrifices). |
| **Hit (H)** | A batted ball that lets the batter reach base safely. |
| **Single (1B)** | A hit that advances the batter to first base. |
| **Double (2B)** | A hit that advances the batter to second base. |
| **Triple (3B)** | A hit that advances the batter to third base. |
| **Home Run (HR)** | A hit that allows the batter to round all bases and score. |
| **Runs Batted In (RBI)** | Number of runs scored because of a player's hit. |
| **Batting Average (AVG)** | `Hits / At Bats` — the most common measure of batting performance. |
| **Games Played (GP)** | Number of games a player has participated in. |

## Field Management

| Term | Definition |
|------|------------|
| **Field** | A physical playing surface (diamond, court, pitch) used for games. |
| **Available** | Field is ready for play. |
| **Maintenance** | Field is being worked on (temporarily unavailable). |
| **Unavailable** | Field is not usable (permanent closure, weather damage). |
