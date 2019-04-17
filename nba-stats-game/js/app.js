let searchString = 'player_ids[]=237&seasons[]=2018';

const gamesUrl = 'https://www.balldontlie.io/api/v1/games';
const statsUrl = 'https://www.balldontlie.io/api/v1/stats';
const playersUrl = 'https://www.balldontlie.io/api/v1/players';
const currSeason = 2018;

const game = {
    playerCache : [],
    playersInGame : [],
    matchPlaced: [false, false],
    matchAnswer: [false, false],
    activeGame: 0,
    teamGuessActivePlayer : null,
    teamGuessScore: [0, 0],
    currentSeason : 2018,
    playerHeadshotObj: [],
    wasSwapped : null
}

const checkURLParameters = () => {
    let returnParams = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        returnParams[key] = value;
    });
    return returnParams;
}
// Got info on how to do this from https://html-online.com/articles/get-url-parameters-javascript/ and https://css-tricks.com/snippets/javascript/get-url-and-url-parts-in-javascript/

const processNBAOfficialData = (dataObj) => {
    let retObj = [];
    let allPlayerArr = dataObj["data"]["players"]

    for (let i = 0; i < allPlayerArr.length; i++){
        if (allPlayerArr[i][4] === game.currentSeason) {
            //let playerHeadShotURL = `http://stats.nba.com/media/players/230x185/${allPlayerArr[i][0]}.png`
            let playerHeadShotURL = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${allPlayerArr[i][0]}.png`;
            allPlayerArr[i].push(playerHeadShotURL);
            retObj[allPlayerArr[i][1]] = allPlayerArr[i];
        }
    }
    return retObj;
}

const addMinutes = (string) => {
    //Prevent errors if player plays no minutes
    if(string === null || string === ''){
        return 0;
    }
    let colonIndex = string.indexOf(":");
    if(!colonIndex || colonIndex === -1){
        return 0;
    }
    let min = parseInt(string.substring(0,colonIndex));
    let sec = parseInt(string.substring(colonIndex+1));

    let ret = ( (min) + (sec/60)).toFixed(1);

    return parseFloat(ret);
}

const updateSelectedPlayerDisplay = () => {
    $('.player-selected-list').empty();
    let numPlayersSelected = game.playersInGame.length;
    if(numPlayersSelected > 0){
        for(let i = 0 ; i < numPlayersSelected; i++ ) {
            $('.player-selected-list').append( $(`<li> ${game.playersInGame[i].fullName} added... </li>`) );
        }
    }
}

class Player {
    constructor (id, firstName, lastName, teamID, teamName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = firstName + ' ' + lastName;
        this.teamID = teamID;
        this.teamName = teamName;
        this.imageURL = '';
        this.stats = {};

        //this.chooseTeamHandler = this.chooseTeam();   //.bind(this);
    }

    getCurrSeasonStats() {
        console.log('Hit: getting current season game stats');

        // Search for a players stats in each game this season
        $.ajax({
            url: `${statsUrl}?seasons[]=${currSeason}&player_ids[]=${this.id}&per_page=100`,
            context: this
        }).then(
            (statsData) => {
                console.log(`Stats from each game for ${this.fullName}:`);
                console.log(statsData);
                
                this.stats = this.calculateCurrentSeasonStats(statsData);

                game.playerCache.push(this);
                game.playersInGame.push(this);

                console.log('Players:', game.playersInGame);

                //Refresh Display of selected players:
                updateSelectedPlayerDisplay();

                //TODO #2 - move this to its own button/event handler function
                    //Will be needed to support other player entry options (random/topX)
                if(game.playersInGame.length > 1) {
                    showPlayerComparison();
                }
                
                console.log("Player added",this);


            },
            () => {
                console.log('Season Stats: bad request');
            }
        );
        
        //For testing use this call of example data:
        //return this.calculateCurrentSeasonStats(getDataExample());
        //this.stats = this.calculateCurrentSeasonStats(getDataExample());

    }
    calculateCurrentSeasonStats(statsData) {
        console.log('Checking game stats data: ',statsData);

        let retStats = {
            total : { ast: 0, blk: 0, pts: 0, dreb: 0, oreb: 2, stl: 0, pf: 0, fg3a: 0, fg3m: 0, fga: 0, fgm: 0, fta: 0, ftm: 0, min: 0},
            average : {},
            gamesPlayed : 0
        };

        let gamesArr = statsData["data"];
        let totalGames = gamesArr.length;

        for(let gameObj of gamesArr) {

            for(let key in retStats.total) {
                if(key === "min"){
                    let minutesFromGame = addMinutes(gameObj["min"]);
                    retStats.total[key] += minutesFromGame
                    if(minutesFromGame === 0){
                        totalGames--;
                    }
                }
                else {
                    retStats.total[key] += gameObj[key];
                }
            }
        }
        if(totalGames === 0) {
            for(let key in retStats.total) {
                retStats.average[key] = 0;
            }
        }
        else {
            for(let key in retStats.total) {
                retStats.average[key] = parseFloat((retStats.total[key] / totalGames).toFixed(2));
            }
        }
        
        //Get image url:
        let nbaDataName = this.lastName + ", " + this.firstName;
        if(game.playerHeadshotObj[nbaDataName] !== undefined) {
            let playerHeadshotURL = game.playerHeadshotObj[nbaDataName][7];
            this.imageURL = playerHeadshotURL;
        }
        //Update total games played after subtracting 0 minute games
        retStats.gamesPlayed = totalGames;
       
        return retStats;
    }

    playTeamGame() {
        
        console.log('Entered playTeamGame');
        console.log(this);

        //Update Scoreboard then increment number of games
        $('.score-board').text(`Score: ${game.teamGuessScore[0]} of ${game.teamGuessScore[1]}`)
        game.teamGuessScore[1]++;

        $('.team-player-name').text(this.fullName);

        let nbaDataName = this.lastName + ", " + this.firstName;
        
        if(game.playerHeadshotObj[nbaDataName] !== undefined) {
            let playerHeadshotURL = game.playerHeadshotObj[nbaDataName][7];
            console.log(playerHeadshotURL);
            $('.team-player-image').append( $("<img>").attr('src', playerHeadshotURL) );

        }
        else {
            //Todo - update this to use the silohoutee 
            $('.team-player-name').css( 'background', `url('https://stats.nba.com/media/img/league/nba-headshot-fallback.png')`);
        }
        //Set the current active players to the Player instance we've created
        game.teamGuessActivePlayer = this;

        //Remove previous listener on the Team Icons to avoid double-counting, before adding new one
        $('.team-container').off('click', teamGameLogic);
        $('.team-container').on('click', teamGameLogic);
    }
}

const teamGameLogic = (event) => {
    console.log('Target: ', event.target);
    console.log('Clicked team ID = ',$(event.target).attr('teamid'));
    console.log('Player team ID = ',game.teamGuessActivePlayer.teamID);
    
    let clickedTeamID = $(event.target).attr('teamid');
    let playerTeamID = game.teamGuessActivePlayer.teamID;

    if(parseInt(clickedTeamID) === parseInt(playerTeamID)){
        console.log('Correct');
        gameOverModal('win');
        game.teamGuessScore[0]++;
    }
    else {
        console.log('Wrong!');
        gameOverModal('lose');
    }
    $('.team-container').off('click', teamGameLogic);
    $('.score-board').text(`Score: ${game.teamGuessScore[0]} of ${game.teamGuessScore[1]}`)
    $('.team-player-image').empty();
}

const getPlayerIDFromInput = (event) => {
    console.log('Hit: player ID input function');
    //TODO - Add cache check here
        //check if a player is already in the object
    
    let inputPlayerName = $('#player-input-box').val();
    //TODO - betteer parsing? - let parsedInputName = inputPlayerName.replace
    let searchParam = `?search=${inputPlayerName}`;


    apiCallPlayerName(searchParam);
    //Reset form + prevent refresh:
    event.preventDefault();
    $(event.currentTarget).trigger('reset');
}

const getPlayersFromRandom = (event) => {
    resetGame();

    let ranPlayerName1 = playerNamesMasterList[Math.floor(Math.random() * playerNamesMasterList.length)];
    let ranPlayerName2 = playerNamesMasterList[Math.floor(Math.random() * playerNamesMasterList.length)];
    //Prevent randomly getting the same player
    while (ranPlayerName1 === ranPlayerName2) {
        ranPlayerName2 = playerNamesMasterList[Math.floor(Math.random() * playerNamesMasterList.length)];
    }
    let searchStr = '?search='
    apiCallPlayerName(searchStr + ranPlayerName1);
    apiCallPlayerName(searchStr + ranPlayerName2);
}
const getSinglePlayerRandom = (event) => {
    resetGame();
    //Todo - add reset here?
    
    let ranPlayerName1 = playerNamesMasterList[Math.floor(Math.random() * playerNamesMasterList.length)];
    let searchStr = '?search='
    apiCallPlayerName(searchStr + ranPlayerName1);
}

const getPlayersFromTopX = (event) => {
    resetGame();

    let ranPlayerName1 = playerNamesMasterList[Math.floor(Math.random() * 100)];
    let ranPlayerName2 = playerNamesMasterList[Math.floor(Math.random() * 100)];
    let searchStr = '?search='
    apiCallPlayerName(searchStr + ranPlayerName1);
    apiCallPlayerName(searchStr + ranPlayerName2);
}

//Core Function
    //Does API call with input parameters
const apiCallPlayerName = (searchParam) => {
    console.log('API Call on', searchParam);

    $.ajax({
        url: playersUrl + searchParam
    }).then(
        (apiData) => {
            //If there is no 'data' key in the API data, the noData is true
            //If there is a 'data' key AND it has NBA player info within (length > 0), the noData is false
            let noData = true; 
            if('data' in apiData){
                if (apiData['data'].length > 0){
                    noData = false;
                }
            }
            //If the noData flag from above is true AND the 'id' key is also missing from the API data, this means that either method of player lookup (by name or ID respecitvely) has failed
            if(noData && !apiData['id']) {
                console.log('Bad search entry');
                $('.player-selected-list').append( $('<li>').text('Unable to find player entered, try again') );
            }
            else {
                buildPlayerFromID(apiData);
            }
            
        },
        () => {
            console.log('API Request Failed');
            $('.player-selected-list').append( $('<li>').text('Unable to process request at this time, please wait.') );
        }
    );
};

//Player Comparison AND Team Guessing
//Main function called by the apiCallPlayerName to take data returned and create a Player instance
//Branches to either game from here
    //Player Comparison - getCurrSeasonStats
    //Team Guessing - playTeamGame
const buildPlayerFromID = (data) => {
    //Todo - handle error if more than 1 result returned
    console.log(data);
    let playerID, firstName, lastName, teamID, teamName;

    //Handling data returned from API via player name search 
    if(data['data']) {
        playerID = data["data"][0]["id"];
        firstName = data["data"][0]["first_name"];
        lastName = data["data"][0]["last_name"];
        teamID = data["data"][0]["team"]["id"];
        teamName = data["data"][0]["team"]["full_name"];
    }
    //Handles data returned from the API looking up directly with ID numbers
    else if(data['id']) {
        playerID = data["id"];
        firstName = data["first_name"]
        lastName = data["last_name"]
        teamID = data["team"]["id"]
        teamName = data["team"]["full_name"]
    }

    
    let newPlayer = new Player(playerID, firstName, lastName, teamID, teamName);
    
    if(game.activeGame === 1) {
        console.log("In Matching Game code branch");
        newPlayer.getCurrSeasonStats();
    }
    if(game.activeGame === 2) {
        console.log("In Team Game code branch");
        newPlayer.playTeamGame();
    }

   
}

//Player Comparison Game
//Called once we have two players selected in the game
    //Create the answer buttons for each player with their name
    //Make answer buttons draggable
    //Randomize player order and display stats for each - Calls createPlayerStatsElements
    //Setup droppable functionality - includes where they can be dropped, how they are snapped, and how to evaluate game end conditions
const showPlayerComparison = () => {
    console.log('Comparing: ', game.playersInGame[0],game.playersInGame[1]);

    let player1 = game.playersInGame[0];
    let player2 = game.playersInGame[1];

    //Add player 1 and player 2 buttons
    let $playerOptionsCont = $('<div>').addClass('player-options-container player-name-drop');  
    $('.game-area-container').append($playerOptionsCont);
    let $player1Option = $('<div>').addClass('player1-option draggable-player').text(player1.fullName).attr('playerID', player1['id']);
    let $player2Option = $('<div>').addClass('player2-option draggable-player').text(player2.fullName).attr('playerID', player2['id']);
    $playerOptionsCont.append($player1Option).append($player2Option);
    
    //Make these buttons dragable
    $('.draggable-player').draggable({
        scope: 'playerName',
        revertDuration: 100,
        opacity: 1,
        snap: true,
        start: function(event, ui) {
            $('.draggable-player').draggable("option", "revert", true);
        }
    })
    //Randomize which player is 1 and 2 and reassign new P1/P2 variable to use for display
    //Track if the players were swapped so we can put the right one in the right location at the end
    game.wasSwapped = false;
    if ( Math.random() >= 0.5) {
        [game.playersInGame[0], game.playersInGame[1]] = [game.playersInGame[1],game.playersInGame[0]];
        game.wasSwapped = true;
    }

    //Display Stats Section
    let $playerStatsContainer = $('<div>').addClass('player-stats-container');
    $('.game-area-container').append($playerStatsContainer);
    $player1StatsContainer = $('<div>').addClass('player1-stats-container stat-drop');  //dtd - added class stat-drop
    $player2StatsContainer = $('<div>').addClass('player2-stats-container stat-drop');  //dtd - added class stat-drop
    $($playerStatsContainer).append($player1StatsContainer).append($player2StatsContainer);

    //Call function to add image + stats for each player
    createPlayerStatsElements($player1StatsContainer, 0);
    createPlayerStatsElements($player2StatsContainer, 1);

    //Allow the player names to be dropped in the center of the player stats container
    $('.stat-drop').droppable({  //dtd .stat-drop - was .player-name-drop
        scope: 'playerName',
        drop: function(event, ui) {
            $('.draggable-player').draggable("option", "revert", false)
            $(ui.draggable).position({
                my: "center",
                at: "center",
                of: $(this).children('.player-name-drop')
                //dtd .children('.player-name-drop') - was $(this)
            });
            
            //Get which stats container we are testing
            let optionNum = null;
            let $option = $(ui.draggable)
            console.log($option);
            if ($option.hasClass('player1-option')){
                optionNum = 0;
            }
            else if ($option.hasClass('player2-option')){
                optionNum = 1;
            }
            else {
                optionNum = null;
            }

            //Get which player option was moved and which answer area it was placed in.
            let dragAnswer = $(ui.draggable).attr('playerID');
            let dropAnswer = $(this).children('.player-name-drop').attr('playerID');        //dtd .children('.player-name-drop') was - $(this).attr...
            //If placed in answer zone - add to placedArray
                //else, remove
            if($(this).children('.player-name-drop').hasClass('name-answer')){            //dtd .children('.player-name-drop') - was $(this).hasClass..
                game.matchPlaced[optionNum] = true;
            }
            else {
                game.matchPlaced[optionNum] = false;
            }
            //Check if answer for this element is right - add to answerArray
                //If wrong mark false
            if(dragAnswer === dropAnswer) {
                game.matchAnswer[optionNum] = true
            }
            else {
                game.matchAnswer[optionNum] = false;
            }
            //If both are placed in answer area, evaluate if won or lost
            if(game.matchPlaced.every(e => e=== true)) {
                if (game.matchAnswer.every( e=> e === true)){
                    gameOverModal('win');
                    
                }
                else {
                    gameOverModal('lose');
                }
            }
        }   
    });
    //Info on draggable from jQuery UI docs, https://codepen.io/jyloo/pen/GjbmLm, https://stackoverflow.com/questions/26746823/jquery-ui-drag-and-drop-snap-to-center
    //Using http://touchpunch.furf.com/ for mobile compatibility with jQuery drag/drop 

}

//Player Comparison AND Team Guessing Games
//Main game end evaluator for both games, it has several main functions:
    //Both - Removes the HTML parameters, so if page is refreshed we have a "clean start"
    //Player Comparison specific - swap in player headshot, create link for this comparison, setup copy link button
    //Team guessing Game specific - Create link, setup copy link button
    //Win/Lose - display text for each case
        //If player comparison - move the player answer to the correct player stat field
        //If Team Guessing - in the loss message, say which team the player is really on
    //Both - show the modal
const gameOverModal = (outcome) => {

    //Reset the URL to the base website url - prevents reloading original URL-specified players on refresh
    let url = window.location.href;
    let urlParams = url.substring( 0, url.indexOf('?') ); 
    if(window.history.pushState) {
        window.history.pushState( {id: 'home'}, '', urlParams )
    }
    //Info from https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page

    //Player Comparison Game
    if(game.activeGame === 1){
        //Show real player headshot, hide the mystery silhouette
        $('.headshot-image').css('display', 'none');
        $('.headshot-image-real').css('display', 'block');
    
        //Create link for this specific Player Comparison
        let baseURL = window.location.href
        let p1 = game.playersInGame[0]['id']
        let p2 = game.playersInGame[1]['id']
        let link = `${baseURL}?gamemode=1&p1=${p1}&p2=${p2}`;
        let $linkTag = $('.share-link').text('comparison').attr('href', link);
        
        //Add a copy button so users can copy the link to their clipboard
        let $copyButton = $('.copy-button');
        $('.share-text').append($copyButton);
        $copyButton.on('click', (event) => {
            $copyTag = $('<input>').val( $('.share-link').attr('href') );
            $('body').append($copyTag);
            $copyTag.select();
            document.execCommand("copy");
            console.log('copied');
            $copyTag.remove();
        }) 
        //Copy paste info - https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
    }
    //Team Guessing Game
    if(game.activeGame === 2) {
        //Create link for this specific player Team Guess game
        let baseURL = window.location.href
        let player = game.teamGuessActivePlayer['id'];
        let link = `${baseURL}?gamemode=2&p=${player}`;
        let $linkTag = $('.share-link').text('team guess challenge').attr('href', link);
        
        //Add a copy button so users can copy the link to their clipboard
        //TODO - could we dry this out?
        let $copyButton = $('.copy-button');
        $('.share-text').append($copyButton);
        $copyButton.on('click', (event) => {
            $copyTag = $('<input>').val( $('.share-link').attr('href') );
            $('body').append($copyTag);
            $copyTag.select();
            document.execCommand("copy");
            console.log('copied');
            $copyTag.remove();
        }) 
    }

    //Show Win text in either case
    if(outcome === 'win') {
        $('.modal-text').text("You win!");

    }
    //Show loss text
    else {
        $('.modal-text').text("You lose");
        //If Player Comparison - also swap the player names to their correct location
        if(game.activeGame === 1){
            
            //New from dtd project
            let $player1end, $player2end
            if(game.wasSwapped){
                $player1end = $('.name-drop-2');
                $player2end = $('.name-drop-1');
            }
            else {
                $player1end = $('.name-drop-1');
                $player2end = $('.name-drop-2');
            }
            
            
            $('.player1-option').position({
                my: "center",
                at: "center",
                of: $player1end                 //dtd
            });
            $('.player2-option').position({
                my: "center",
                at: "center",
                of: $player2end                 //dtd
            });
        }
        //If Team Guessing - give the correct team when guessed wrong
        else if(game.activeGame === 2){
            $('.modal-text').text(`You lose, ${game.teamGuessActivePlayer.fullName} is on the ${game.teamGuessActivePlayer.teamName}.`);
        }
    };
    //Show the modal and prevent further dragging of the player names for Player Comparison
    $('.modal').show();
    $('.player1-option').draggable("destroy");
    $('.player2-option').draggable("destroy");
}

//Player Comparison Game 
//Handles formatting of the Player.stats.average object for display
    //Called by createPlayerStatsElements
const formatStats = (playerObj) => {
    playerObj['stats']['formatted'] = { pts: '', fg: '', fg3p: '', ft: '', reb: '', min: '', ast: '', stl: '', blk: ''};
    let average = playerObj['stats']['average'];
    
    //For any missing stats, just use 0
    for(let statKey in average) {
        if (!average[statKey]) {
            average[statKey] = 0;
        }
    }
    //Format each stat as needed (eg: correct % format, right number of decimals, etc)
    playerObj['stats']['formatted'].pts = (average['pts'] ).toFixed(2);
    playerObj['stats']['formatted'].fg = ( (average['fgm']/average['fga']) * 100 ).toFixed(0);
    if(average['fga'] === 0){
        playerObj['stats']['formatted'].fg = 0;
    }
    playerObj['stats']['formatted'].fg3p = ( (average['fg3m']/average['fg3a']) * 100 ).toFixed(0);
    if(average['fg3a'] === 0){
        playerObj['stats']['formatted'].fg3p = 0;
    }
    playerObj['stats']['formatted'].ft = ( (average['ftm']/average['fta']) * 100 ).toFixed(0);
    if(average['fta'] === 0){
        playerObj['stats']['formatted'].ft = 0;
    }
    playerObj['stats']['formatted'].reb = ( parseFloat(average['oreb']) + parseFloat(average['dreb']) ).toFixed(1);
    playerObj['stats']['formatted'].min = ( parseFloat(average['min']) ).toFixed(1);
    playerObj['stats']['formatted'].ast = ( parseFloat(average['ast']) ).toFixed(1);
    playerObj['stats']['formatted'].stl = ( parseFloat(average['stl']) ).toFixed(1);
    playerObj['stats']['formatted'].blk = ( parseFloat(average['blk']) ).toFixed(1);
}

//Player Comparison Game 
//This created the HTML elements to display the stats for a single player
    //Called twice by showPlayercomparison - once for each player compared
const createPlayerStatsElements = (playerElement, playerNum) => {
    
    //Get variable to access player stats
    let avgStatsObj = game.playersInGame[playerNum]['stats']['average'];
    let playerObj = game.playersInGame[playerNum];

    $headshot= $('<img>').addClass('headshot-image').attr('src','img/unknown-player-cropped.png');
    $headshotHidden= $('<img>').addClass('headshot-image-real').attr('src', playerObj['imageURL']).css('display', 'none');
    if(playerObj['imageURL'] === ''){
        $headshotHidden.attr('src', 'img/unknown-player-cropped.png');
    }
    playerElement.append($headshot);
    playerElement.append($headshotHidden);
    
    playerElement.append($('<div>').addClass(`player-name-drop name-answer name-drop-${playerNum+1}`).attr('playerID', game.playersInGame[playerNum]['id']));

    formatStats(playerObj);
    let statDisp = game.playersInGame[playerNum]['stats']['formatted']

    //Create Stat Sub-sections (pts / reb+min / ast+stl+blk)
    //Section 1 - Pts, FG%, 3P%, FT%
    let $statSect1 = $('<div>').addClass('stat-1 stat-box');
    let $ul1 = $('<ul>');
    $statSect1.append($ul1);
    let $liPts = $('<li>').append($('<span>').addClass('main-stat').text(`Pts: ${statDisp['pts']}`));
    let $liFg = $('<li>').text(`Fg: ${statDisp['fg']}%  (${(avgStatsObj.fgm).toFixed(1)}/${(avgStatsObj.fga).toFixed(1)})`);
    let $li3p = $('<li>').text(`3P: ${statDisp['fg3p']}%  (${(avgStatsObj.fg3m).toFixed(1)}/${(avgStatsObj.fg3a).toFixed(1)})`);
    let $liFt = $('<li>').text(`Ft: ${statDisp['ft']}%  (${(avgStatsObj.ftm).toFixed(1)}/${(avgStatsObj.fta).toFixed(1)})`);
    $ul1.append($liPts).append($liFg).append($li3p).append($liFt);

    //Section 2 - Rebounds + Minutes
    //TODO #3 - add Oreb and Dreb with class like "desktop-only" to hide in mobile view
    let $statSect2 = $('<div>').addClass('stat-2 stat-box');
    let $ul2 = $('<ul>');
    $statSect2.append($ul2);
    let $liReb = $('<li>').append($('<span>').addClass('main-stat').text(`Reb: ${statDisp['reb']}`));
    let $liMin = $('<li>').append($('<span>').addClass('main-stat').text(`Min: ${statDisp['min']}`));
    $ul2.append($liReb).append($liMin);

    //Section 3 - Ast, Stl, Blk
    let $statSect3 = $('<div>').addClass('stat-3 stat-box');
    let $ul3 = $('<ul>');
    $statSect3.append($ul3);
    let $liAst = $('<li>').append($('<span>').addClass('main-stat').text(`Ast: ${statDisp['ast']}`));
    let $liStl = $('<li>').append($('<span>').addClass('main-stat').text(`Stl: ${statDisp['stl']}`));
    let $liBlk = $('<li>').append($('<span>').addClass('main-stat').text(`Blk: ${statDisp['blk']}`));
    $ul3.append($liAst).append($liStl).append($liBlk);

    playerElement.append($statSect1).append($statSect2).append($statSect3)
}

//Team Guess/Player Compare
//Resets all game elements and removes various input and game area tags added
//This is a catch all for removing elements added by the game that need to be removed between rounds/guesses
const resetGame = () => {
    
    $('.modal').hide();
    $('.copy-button').off('click');
    
    $('.player-selected-list').empty();
    $('.team-player-name').empty();
    $('.team-player-image').empty();

    game.playersInGame = [];
    game.matchAnswer = [false, false];
    game.matchPlaced = [false, false];
    game.teamGuessActivePlayer = null;

    $('.player-options-container').remove();
    $('.player-stats-container').remove();

    //Remove elements added by the autocomplete
    $('.ui-helper-hidden-accessible').empty();

    //Remove background placeholder (no headshot found) in Team Game
    $('.team-player-name').css('background', '');

}

// Team Guessing Game - resets the scoreboard text to 0 of 0 and the game.teamGuessScore property
const resetScoreBoard = () => {
    game.teamGuessScore = [0, 0];
    $('.score-board').text(`Score: ${game.teamGuessScore[0]} of ${game.teamGuessScore[1]}`);
}

//Player Comparison Game - Creates and appends the page elements 
//Will go into player selection logic by one of three functions based on the button selected:
    // Text Input field - getPlayerIDFromInput
    // Top 100 button - getPlayersFromTopX
    // Random button - getPlayersFromRandom
//Also has jQuery Autocomplete code call and reset button 
const setupMatchGame = () => {
    //Set the code to use the Matching Game 
    game.activeGame = 1;
    //Clear any existing info and do a reset
    $('.input-container').empty();
    $('.game-area-container').empty();
    resetGame();

    //Add input container elements
    $inputContainer = $('.input-container');
    //player-form
    $form = $('<form>').addClass('player-form');
    $inputContainer.append($form);
    $form.append( $('<input>').attr( {
        'type' : 'text',
        'id' : "player-input-box",
        'placeholder' : "Player Name"
    } ));
     $form.append( $('<input>').attr( {
        'type' : 'submit',
        'value' : "Add",
    } ));
    //player-select-bottom
        //Player select display
    $bottomSection = $('<div>').addClass('player-select-bottom');
    $inputContainer.append($bottomSection);
    $playerSelectedCont = ( $('<div>').addClass('player-selected-container') );
    $bottomSection.append($playerSelectedCont);
    $playerSelectedCont.append( $('<ol>').addClass('player-selected-list') );
        //Button options
    $matchOptionButtons = $('<div>').addClass('match-option-buttons');
    $bottomSection.append($matchOptionButtons);
    $matchOptionButtons.append( $('<button> Top 100</button>').addClass('top-x-button') );
    $matchOptionButtons.append( $('<button> Random</button>').addClass('random-button') );
    $matchOptionButtons.append( $('<button> Reset</button>').addClass('reset-button') );

    //Add Event Listeners
    $('.player-form').on('submit', getPlayerIDFromInput);
    $('.reset-button').on('click', resetGame);
    $('.random-button').on('click', getPlayersFromRandom);
    $('.top-x-button').on('click', getPlayersFromTopX);
    $('#player-input-box').autocomplete({
        source: playerNamesMasterList
    });
}

//Team Guessing Game - Creates and appends the page elements 
//Will go into player selection logic by calling getSinglePlayerRandom - from the "Random Player" button
const setupTeamGame = () => {
    //Set code to use the Team Game code
    game.activeGame = 2;
    game.teamGuessScore = [0, 0];
    
    //Clear any existing info and do a reset
    $('.input-container').empty();
    $('.game-area-container').empty();
    resetGame();

    //Add input container elements
    $teamInput = $('<div>').addClass('team-input');
    $('.input-container').append($teamInput);
    $teamInput.append ($('<div>').addClass('team-random-player').text('Random Player') );
    $teamInput.append ($('<div>').addClass('score-board').text('Score: 0 of 0') );

    $('.input-container').append( $('<div>').addClass('team-player-container') );
    $('.team-player-container').append( $('<div>').addClass('team-player-name') );
    $('.team-player-container').append( $('<div>').addClass('team-player-image') );

    //Add conference select elements in game container
    $conferenceSelect = $('<div>').addClass('conference-select');
    $('.game-area-container').append($conferenceSelect);
    $conferenceSelect.append( $('<div>').addClass('eastern-conf').text('East') );
    $conferenceSelect.append( $('<div>').addClass('western-conf').text('West') );

    //Add team logo elements in game container
    $teamContainer = $('<div>').addClass('team-container');
    $('.game-area-container').append($teamContainer);

    for (let i = 0; i < Object.keys(allTeams).length; i++) {
        $newTeamDiv = $('<div>').addClass('team-icon-' + allTeams[i].id)
        $newTeamDiv.attr('teamID',allTeams[i].id)
        $newTeamDiv.css( {
            'background': `url('${allTeams[i].url}')`,
            'background-size': 'contain',
            'background-repeat' : 'no-repeat',
            'background-position-x' : 'center'
        });
        $newTeamDiv.addClass('east-team');
        $teamContainer.append($newTeamDiv);
        if (i > 14){
            $newTeamDiv.css('display', 'none');
            $newTeamDiv.addClass('west-team').removeClass('east-team');
        }
    }
    //Event handler to switch between East/West
    $('.eastern-conf').on('click', () => {
        $('.west-team').hide();
        $('.east-team').show();
    })
    $('.western-conf').on('click', () => {
        $('.east-team').hide();
        $('.west-team').show();
    })
    //Event listener to reset game from the win/loss modal
    $('.reset-button').on('click', resetGame);
    //$('.modal').on('click', resetGame);

    //Add event listener to launch game on "Random Player" button
    $('.team-random-player').on('click', getSinglePlayerRandom);
    $('.score-board').on('click', resetScoreBoard);
}

const setupAboutInfo= () => {
    //TODO
}

//Player Comparison AND Team Guessing
//Takes input from URL params via checkURLParameters
    //Calls into the apiCallPlayerName to start each game if parameters are specified
const playGameFromURL = () => {
    let urlParams = checkURLParameters();

    if(urlParams){
        if(urlParams['gamemode'] === '1') {
            if(urlParams['p1'] && urlParams['p2']){
                
                setupMatchGame();

                let p1 = `/${urlParams['p1']}`;
                let p2 = `/${urlParams['p2']}`;
                apiCallPlayerName(p1);
                apiCallPlayerName(p2);
            }
            else {
                console.log('Selected Player Comp game but bad player params');
            }
        }
        else if(urlParams['gamemode'] === '2') {
            if(urlParams['p']){
                setupTeamGame();

                let player = `/${urlParams['p']}`;
                apiCallPlayerName(player);
            }
        }
        else {
            console.log('Incorrect Parameters - no gamemode specified');
        }
    }
    else {
        console.log('No valid parameters entered');
    }
}

//On load code
$( () => {
    //First build array to coorelate NBA.com player thumbnail links to player names
    game.playerHeadshotObj = processNBAOfficialData(stats_ptsd);
    
    //Checks if the URL has parameters to auto-start a specific comparison/player team guess game
        //Player Comparison     - ?gamemode=1&p1=<playerID>&p2=<playerID>
        //Team Guess            - ?gamemode=2&p=<playerID>
    playGameFromURL();

    //Setup Main Buttons to choose game mode
    $('.player-comparison').on('click', setupMatchGame);
    $('.player-team').on('click', setupTeamGame);
    $('.about-info').on('click', setupAboutInfo)
    
    //Reset the game from clicking anywhere on the modal
    //$('.modal').on('click', resetGame);
})
