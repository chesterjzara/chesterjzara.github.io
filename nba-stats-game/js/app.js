

let searchString = 'player_ids[]=237&seasons[]=2018';

const gamesUrl = 'https://www.balldontlie.io/api/v1/games';
const statsUrl = 'https://www.balldontlie.io/api/v1/stats';
const playersUrl = 'https://www.balldontlie.io/api/v1/players';
const currSeason = 2018;

const game = {
    playerCache : [],
    playersInGame : []
}

const minutesToSeconds = (string) => {
    //Prevent errors if player plays no minutes
    if(string === null){
        return 0;
    }
    let colonIndex = string.indexOf(":");
    if(!colonIndex){
        return 0;
    }
    let min = parseInt(string.substring(0,colonIndex));
    let sec = parseInt(string.substring(colonIndex+1));

    return ( (min*60) + sec)
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

                console.log(this);
                console.log(this.stats);
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
            total : { ast: 0, blk: 0, pts: 0, dreb: 0, oreb: 2, stl: 0, pf: 0, fg3a: 0, fg3m: 0, fga: 0, fgm: 0, fta: 0, ftm: 0, sec: 0},
            average : {}
        };


        let gamesArr = statsData["data"];
        let totalGames = gamesArr.length;

        for(let gameObj of gamesArr) {
            // retStats.total["ast"] += gameObj["ast"];
            
            for(let key in retStats.total) {
                if(key === "sec"){
                    retStats.total[key] += minutesToSeconds(gameObj["min"]);
                }
                else {
                    retStats.total[key] += gameObj[key];
                }
            }
        }

        for(let key in retStats.total) {
            retStats.average[key] = (retStats.total[key] / totalGames);
        }
        
        //For debugging
        console.log(retStats);
        return retStats;
    }
}




const genericAPIGet = (url, searchString) => {
    console.log('Hit: api call');
    $.ajax({
        url: url + searchString
    }).then(
        (data) => {
            console.log(data);
            // console.log(JSON.stringify(data));
            return data;
        },
        () => {
            console.log('Player ID: bad request');
        }
    );

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

    //Add to Object to track

    console.log(newPlayer);

    game.playerCache.push(newPlayer);
    game.playersInGame.push(newPlayer);

    console.log('Players:', game.playersInGame);
}


$( () => {
    //getPlayerSeasonStats(145, 2018)

    $('.player-form').on('submit', getPlayerIDFromInput);

   
})
