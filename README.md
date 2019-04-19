# NBA Stat Guessing Games

https://chesterjzara.github.io/nba-stats-game/index.html

This website primarily consists of a Player Comparison guessing game and a Team Guessing game. 

1. The Player Comparison is inspired by an all-too-common practice employed on basketball forums since time immemorial. If you think your guy is underrated, find another, better regarded, player with similar boxscores. Then you can post both and challenge other users to guess which is which. This way you can make your point while ignoring all context to the statistics! 

   For the website, the game will give two players and two statlines. The user will drag each player name to the statline they think coorelates to each player. The game will then evaluate if the user chose correctly or not. 
2. The Team guessing game comes from a brilliant segment from the basketball analysis TV show "Inside the NBA". In the show an ex-player analyst is challenged to determine "Who he play for?". Usually this purported expert will fail to identify any players' teams correctly, to humorous effect.

   On the website the game is played by clicking the button to get a random player and then clicking the correct team icon below. Users will need to switch the display between East and West to toggle the 15 teams in a given conference.

   <a href="http://www.youtube.com/watch?feature=player_embedded&v=cBHPQ25J07E
" target="_blank"><img src="http://img.youtube.com/vi/cBHPQ25J07E/0.jpg" 
alt="Inside the NBA Clip" width="400" height="300" border="10" /></a>

## Technology Used

### Website
This website was made with HTML, CSS, and Javascript.
* Using jQuery for DOM manipulation (https://jquery.com/)
* Also using jQueryUI for interactive effects (https://jqueryui.com/)
  * Specifically the following widgets: [Draggable](https://jqueryui.com/draggable/), [Droppable](https://jqueryui.com/droppable/), [Autocomplete](https://jqueryui.com/autocomplete/)

### Data

* The primary data source is the [balldontlie.io API](balldontlie.io).
  * This is where we lookup entered player names and get game stats for a player to tabulate their season averages.
* Using data from ESPN Fantasy Basketball as a proxy for the top 100 palyers - found via Reddit user [Larursa](https://www.reddit.com/r/fantasybball/comments/9in504/heres_a_spreadsheet_of_espns_projected_stats_and/). 
* NBA.com for player headshot images

## Approach

As outlined above, the general approach is a simple website that uses JS/jQuery to pull NBA player data from the balldontlie.io NBA Stats API. In order to make a one-page site, all content is generated with Javascript.

The general approach flows from the navigation buttons. Clicking either the Player Comp or Team Guess game will call functions that generate the HTML content for each game. From there the created clickable areas on the page will lead to the API calls and game logic.
  * After starting the game we make an initial call to the API to grab information on the player and create a Player Javascript Object to hold the information about each player.
    * In the case of the Player Comp we also make another call to the API to gather stats from all games this season so we can compute the player's averages. This is because there is no free API available currently that will give full season stats.
  * The Player instances created are stored in a "game" global object that tracks that game state:
    * Which game we are playing, which players are in the game, variables to evaluate if the game is lost or won, player images
  * Once the game is won or lost we'll show a modal and give an option to reset the "game" variables needed to launch a fresh game

## Code Path

[Link to Code Path Diagram](https://docs.google.com/presentation/d/1nlp0zW-yGjsSI5BqZHMwPQAUvTLpzgBSfxVpxEza0ZE/edit?usp=sharing)

![alt-text](https://github.com/chesterjzara/chesterjzara.github.io/blob/master/nba-stats-game/notes/code-diagram-4-18.png)

## Key Functionality

1. API Usage
    * Pulling player names, stats, teams from Balldontlie.io
    * Pulling player images from NBA.com (not officially supported API) and matching names
1. Game 1 - Player Comparison Game
    * Random and Random Top 100 Player Options
    * Autocomplete on player name entry
    * Drag and Drop UI to play the game
    * Modal win/loss screen
    * Animations on various elements (bounce, pulse, position change on wrong answer)
    * Able to specify players via URL parameters
1. Game 2 - Team Guessing Game
    * Animations on East/West button and changing teams
    * Modal win/loss screen - will explain why you lost
    * Able to specify players via URL parameters
    * Score board tracking and ability to reset
1. General
    * Responsive design on all pages
    * localStorage Caching of player stats to avoid too many API calls
    * Customizable color scheme (also persistently stored in localStorage)

## Unsolved Issues / Future Improvements

1. Tooltips for more stats or other information
1. Buttons to share comparison/player to social media instead of just copy-paste
1. Store data on all players season averages to offer harder comparisons
    * Eg: give 2 players with similar stats instead of random
1. Clean up code to use accessors instead of directly accessing class/object variables
1. For the Player Comparison add a dropdown to have Top 50, 25, etc
