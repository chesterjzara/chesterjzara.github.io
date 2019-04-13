let searchString = 'player_ids[]=237&seasons[]=2018';

const gamesUrl = 'https://www.balldontlie.io/api/v1/games';
const statsUrl = 'https://www.balldontlie.io/api/v1/stats';
const playersUrl = 'https://www.balldontlie.io/api/v1/players';
const currSeason = 2018;

const game = {
    playerCache : [],
    playersInGame : []
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

class Player {
    constructor (id, firstName, lastName, teamID, teamName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = firstName + ' ' + lastName;
        this.teamID = teamID;
        this.teamName = teamName;

        this.stats = {}
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
            retStats.average[key] = (retStats.total[key] / totalGames).toFixed(2);
        }
        
        retStats.gamesPlayed = totalGames;

        //For debugging
        return retStats;
    }
}



const getPlayerIDFromInput = (event) => {
    console.log('Hit: player ID input function');
    //TODO - Add cache check here
        //check if a player is already in the object
    
    let inputPlayerName = $('#player-input-box').val();
    //TODO - betteer parsing? - let parsedInputName = inputPlayerName.replace
    let searchParam = `?search=${inputPlayerName}`;
    
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
    //Reset form + prevent refresh:
    event.preventDefault();
    $(event.currentTarget).trigger('reset');
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
    newPlayer.getCurrSeasonStats();

   
}

const showPlayerComparison = () => {
    console.log('Comparing: ', game.playersInGame[0],game.playersInGame[1]);

    let player1 = game.playersInGame[0];
    let player2 = game.playersInGame[1];


    //Add player 1 and player 2 buttons
    let $playerOptionsCont = $('<div>').addClass('player-options-container player-name-drop');  
    $('.game-area-container').append($playerOptionsCont);
    let $player1Option = $('<div>').addClass('player1-option draggable-player').text(player1.fullName);
    $player2Option = $('<div>').addClass('player2-option draggable-player').text(player2.fullName);
    $playerOptionsCont.append($player1Option).append($player2Option);
    
    //Make these buttons dragable
    $('.draggable-player').draggable({
        scope: 'playerName',
        revertDuration: 1000,
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
        }
    });
    //Info on draggable from jQuery UI docs, https://codepen.io/jyloo/pen/GjbmLm, https://stackoverflow.com/questions/26746823/jquery-ui-drag-and-drop-snap-to-center

    
  
    //Save any buttons we'll need later to game obj
}

const createPlayerStatsElements = (playerElement, playerNum) => {
    
    //Get variable to access player stats
    let avgStatsObj = game.playersInGame[playerNum]['stats']['average'];

    $headshot= $('<img>').addClass('headshot-image').attr('src','img/unknown-player.png');
    playerElement.append($headshot);
    
    //TODO #1 - for testing - remove Name from final, this should just be the draggable location
    playerElement.append($('<div>').text(game.playersInGame[playerNum].fullName).addClass('player-name-drop name-answer'));
    
    //Create Stat Sub-sections (pts / reb+min / ast+stl+blk)
    //Section 1 - Pts, FG%, 3P%, FT%
    let $statSect1 = $('<div>').addClass('stat-1');
    let $ul1 = $('<ul>');
    $statSect1.append($ul1);
    let $liPts = $('<li>').append($('<span>').addClass('main-stat').text(`Pts: ${avgStatsObj['pts']}`));
    let $liFg = $('<li>').text(`Fg: ${(avgStatsObj.fgm/avgStatsObj.fga).toFixed(2)}%  (${avgStatsObj.fgm}/${avgStatsObj.fga})`);
    let $li3p = $('<li>').text(`3P: ${(avgStatsObj.fg3m/avgStatsObj.fg3a).toFixed(2)}%  (${avgStatsObj.fg3m}/${avgStatsObj.fg3a})`);
    let $liFt = $('<li>').text(`Ft: ${(avgStatsObj.ftm/avgStatsObj.fta).toFixed(2)}%  (${avgStatsObj.ftm}/${avgStatsObj.fta})`);
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


$( () => {
    //getPlayerSeasonStats(145, 2018)

    //Get buttons we'll need
    game.$playerOptionsCont = $('.player-options-container');

    $('.player-form').on('submit', getPlayerIDFromInput);

   
})
