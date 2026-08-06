Scenario: Add Existing players during season wizard setup

Given Admin is going through setup wizard
And on manage rosters setup
Then admin can search and add existing player to teams or add new player.

Scenario: Submiting season 
Given user has gone through all steps
And reviewed season settigns
When user clicks create
Then season is created successfully
And user is directed to season url

Actual Outcome: 404 page not found.
  Note: Have to reload page to see details

Scenario: Seasons page 
Given user is on Seasons page
Then user can see all season details

Actual outcome: Only see text " Seasons " header and paragraph "Browse and mange seasons"
no other details on page
