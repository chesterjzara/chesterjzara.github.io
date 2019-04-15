const wordExample = {
    syns: [  
    [  
       "adjudicator",
       "arbiter",
       "arbitrator",
       "judge",
       "referee"
    ]
]
};

const apiThesaurus = (searchParam) => {
    
    $.ajax({
       //however you look up the api here
    }).then(
        (data) => {
            buildThesaursuGame(data);
        },
        () => {
            console.log('bad request');
        }
    );
    //buildThesaursuGame(wordExample);
};

const buildThesaursuGame = (data) =>{

    //Combine array of synoms returned with fake answers
    //Generate your elements for your word options

    //evalaute conditions to see if the right words were clicked
    evaluateChoices()
}

const evaluateChoices = () => {

}


$( () => {

    //Start game - button or input
        //this looks to the apiThesaurus

})

//On load
    //apiThesaurus
        //buildthesaurusGame
            //evaluateChoice
        //Another method here