const request = require('request-promise');
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

function returnScore (start, total)
{
    // var x= Date.now() / 1000;
    // var used= x- start;
    // var perused= (used / total) * 100;
    // var remaining = 100 -perused;
    // return 1000 * remaining /100 ;
    return 100;
}


module.exports = {
    get3Words,
    wait,
    getRandom,
    returnScore
};
