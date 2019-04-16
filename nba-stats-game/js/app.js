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
    playerHeadshotObj: []
}

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
            // retStats.total["ast"] += gameObj["ast"];

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

        for(let key in retStats.total) {
            retStats.average[key] = parseFloat((retStats.total[key] / totalGames).toFixed(2));
        }
        
        retStats.gamesPlayed = totalGames;

        //For debugging
        return retStats;
    }

    playTeamGame() {
        
        console.log('Entered playTeamGame');
        console.log(this);

        $('.team-player-name').text(this.fullName);

        let nbaDataName = this.lastName + ", " + this.firstName;
        
        if(game.playerHeadshotObj[nbaDataName] !== undefined) {
            let playerHeadshotURL = game.playerHeadshotObj[nbaDataName][7];
            console.log(playerHeadshotURL);
            $('.team-player-image').append( $("<img>").attr('src', playerHeadshotURL) );

            // $('.team-player-name').css({
            //     'background': `url('${playerHeadshotURL}')`,
            //     'background-size' : '50%',
            //     'background-repeat' : 'no-repeat',
            //     'background-position-x' : '90%',
            //     'background-position-y': '-20%'
            // });
        }
        else {
            $('.team-player-name').css( 'background', `url('https://stats.nba.com/media/img/league/nba-headshot-fallback.png')`);
        }
        

        

        game.teamGuessActivePlayer = this;
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
        game.teamGuessScore[1]++;
    }
    else {
        console.log('Wrong!');
        gameOverModal('lose');
        game.teamGuessScore[1]++;
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

const apiCallPlayerName = (searchParam) => {
    console.log('API Call on', searchParam);

    $.ajax({
        url: playersUrl + searchParam
    }).then(
        (data) => {
            buildPlayerFromID(data);
        },
        () => {
            console.log('bad request');
        }
    );
   
    
};

const buildPlayerFromID = (data) => {

    //Todo - handle error if more than 1 result returned
    console.log(data);

    let playerID = data["data"][0]["id"]
    let firstName = data["data"][0]["first_name"]
    let lastName = data["data"][0]["last_name"]
    let teamID = data["data"][0]["team"]["id"]
    let teamName = data["data"][0]["team"]["full_name"]
    
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
    if ( Math.random() >= 0.5) {
        [game.playersInGame[0], game.playersInGame[1]] = [game.playersInGame[1],game.playersInGame[0]];
    }
    let hiddenP1 = game.playersInGame[0];
    let hiddenP2 = game.playersInGame[1];

    //Display Stats Section
    let $playerStatsContainer = $('<div>').addClass('player-stats-container');
    $('.game-area-container').append($playerStatsContainer);
    $player1StatsContainer = $('<div>').addClass('player1-stats-container');
    $player2StatsContainer = $('<div>').addClass('player2-stats-container');
    $($playerStatsContainer).append($player1StatsContainer).append($player2StatsContainer);

    //Call function to add image + stats for each player
    createPlayerStatsElements($player1StatsContainer, 0);
    createPlayerStatsElements($player2StatsContainer, 1);

    //Allow the player names to be dropped in the center of the player stats container
    $('.player-name-drop').droppable({
        scope: 'playerName',
        drop: function(event, ui) {
            $('.draggable-player').draggable("option", "revert", false)
            $(ui.draggable).position({
                my: "center",
                at: "center",
                of: $(this)
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
            let dropAnswer = $(this).attr('playerID');
            //If placed in answer zone - add to placedArray
                //else, remove
            if($(this).hasClass('name-answer')){
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
  
    //Save any buttons we'll need later to game obj
}

const gameOverModal = (outcome) => {

    if(outcome === 'win') {
        $('.modal-text').text("You win!");
    }
    else {
        $('.modal-text').text("You lose");
        if(game.activeGame === 2){
            $('.modal-text').text(`You lose, ${game.teamGuessActivePlayer.fullName} is on the ${game.teamGuessActivePlayer.teamName}.`)
        }
    }
    $('.modal').show();
    $('.player1-option').draggable("destroy");
    $('.player2-option').draggable("destroy");
}

const createPlayerStatsElements = (playerElement, playerNum) => {
    
    //Get variable to access player stats
    let avgStatsObj = game.playersInGame[playerNum]['stats']['average'];

    $headshot= $('<img>').addClass('headshot-image').attr('src','img/unknown-player.png');
    playerElement.append($headshot);
    
    //TODO #1 - for testing - remove Name from final, this should just be the draggable location
    //playerElement.append($('<div>').text(game.playersInGame[playerNum].fullName).addClass('player-name-drop name-answer').attr('playerID', game.playersInGame[playerNum]['id']));
    playerElement.append($('<div>').addClass('player-name-drop name-answer').attr('playerID', game.playersInGame[playerNum]['id']));

    //Create Stat Sub-sections (pts / reb+min / ast+stl+blk)
    //Section 1 - Pts, FG%, 3P%, FT%
    let $statSect1 = $('<div>').addClass('stat-1');
    let $ul1 = $('<ul>');
    $statSect1.append($ul1);
    let $liPts = $('<li>').append($('<span>').addClass('main-stat').text(`Pts: ${avgStatsObj['pts']}`));
    let $liFg = $('<li>').text(`Fg: ${(avgStatsObj.fgm/avgStatsObj.fga).toFixed(2)}%  (${(avgStatsObj.fgm).toFixed(1)}/${(avgStatsObj.fga).toFixed(1)})`);
    let $li3p = $('<li>').text(`3P: ${(avgStatsObj.fg3m/avgStatsObj.fg3a).toFixed(2)}%  (${(avgStatsObj.fg3m).toFixed(1)}/${(avgStatsObj.fg3a).toFixed(1)})`);
    let $liFt = $('<li>').text(`Ft: ${(avgStatsObj.ftm/avgStatsObj.fta).toFixed(2)}%  (${(avgStatsObj.ftm).toFixed(1)}/${(avgStatsObj.fta).toFixed(1)})`);
    $ul1.append($liPts).append($liFg).append($li3p).append($liFt);

    //Section 2 - Rebounds + Minutes
    //TODO #3 - add Oreb and Dreb with class like "desktop-only" to hide in mobile view
    let $statSect2 = $('<div>').addClass('stat-2');
    let $ul2 = $('<ul>');
    $statSect2.append($ul2);
    let $liReb = $('<li>').append($('<span>').addClass('main-stat').text(`Reb: ${parseFloat(avgStatsObj.oreb) + parseFloat(avgStatsObj.dreb)}`));
    let $liMin = $('<li>').append($('<span>').addClass('main-stat').text(`Min: ${parseFloat(avgStatsObj.min).toFixed(1)}`));
    $ul2.append($liReb).append($liMin);

    //Section 3 - Ast, Stl, Blk
    let $statSect3 = $('<div>').addClass('stat-3');
    let $ul3 = $('<ul>');
    $statSect3.append($ul3);
    let $liAst = $('<li>').append($('<span>').addClass('main-stat').text(`Ast: ${avgStatsObj.ast}`));
    let $liStl = $('<li>').append($('<span>').addClass('main-stat').text(`Stl: ${avgStatsObj.stl}`));
    let $liBlk = $('<li>').append($('<span>').addClass('main-stat').text(`Blk: ${avgStatsObj.blk}`));
    $ul3.append($liAst).append($liStl).append($liBlk);

    playerElement.append($statSect1).append($statSect2).append($statSect3)

}

const resetGame = () => {
    $('.modal').hide();
    $('.player-selected-list').empty();
    $('.team-player-name').empty();
    $('.team-player-image').empty();

    game.playersInGame = [];
    game.matchAnswer = [false, false];
    game.matchPlaced = [false, false];
    game.teamGuessActivePlayer = null;

    $('.player-options-container').remove();
    $('.player-stats-container').remove();

}

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
        'value' : "Choose Player",
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
    //Add event listener to launch game on "Random Player" button
    $('.team-random-player').on('click', getSinglePlayerRandom);
}

const setupAboutInfo= () => {
    
}

$( () => {
    //getPlayerSeasonStats(145, 2018)
    game.playerHeadshotObj = processNBAOfficialData(stats_ptsd);
    
    $('.player-comparison').on('click', setupMatchGame);
    $('.player-team').on('click', setupTeamGame);
    $('.about-info').on('click', setupAboutInfo)

})
