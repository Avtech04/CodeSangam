const request = require('request-promise');

// function to get random words using api

async function getRandom() {
  let options = { json: true };
  var words;
  const url = 'https://random-word-api.vercel.app/api?words=3' ;
  await request(url, options, (error, res, body) => {
    if (error) {
      return console.log(error)
    };

    if (!error && res.statusCode == 200) {
      words=body;
      console.log(words);
    };
  });
  return words
}


// function to push the random word in the array

async function get3Words(roomID) {
  var arr = await getRandom();
  console.log(arr);
  return arr;
  // var arr= new Array() ;
  // arr.push("arpit");
  // arr.push("ayush");
  // arr.push("ankit");
  // return arr;
}



// function to know about timer if all remaining guessed

function wait(startTime, drawer, ms) {
  
  return new Promise((resolve, reject) => 
  {
    round.on('everybodyGuessed', ({ roomID: callerRoomID }) => 
    {
      resolve();
    });
    setTimeout(() => resolve(true), ms);
  });
}


// function to return score for all remaining players

function returnScore (start, roundtime)
{
   
    // return 100;


    const now = Date.now() / 1000;
    // console.log("Currenttime:",now);
    const elapsedTime = Number(now - start);
    // console.log("elapsedTime:",elapsedTime);
    
    const roundTime=roundtime/1000;
    // console.log("Roundtime:", roundTime);
    return Number( Math.floor(((roundTime - elapsedTime) / roundTime) * 100));
}


// function to return score for drawer

function returnScoreDrawer (total,guessed)
{
  // console.log(guessed);
    return Number( Math.floor((guessed / total) * 100));
}



// exporting the modules

module.exports = {
    get3Words,
    wait,
    getRandom,
    returnScore,
    returnScoreDrawer
};
