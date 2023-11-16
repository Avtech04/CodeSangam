// const axios = require('axios');

// async function getRandomWord() {
//   try {
//     const response = await axios.get('https://random-word-api.herokuapp.com/word');
//     const randomWord = response.data[0]; 
//     // console.log(randomWord);
//     return randomWord;
//   } catch (error) {
//     console.error('Error fetching random word:', error.message);
//     return null;
//   }
// }

const request = require('request');

function getRandom(){

request.get({
  url: 'https://api.api-ninjas.com/v1/randomword',
  headers: {
    'X-Api-Key': 'ldezXuHipA98eRj47Il5jg==sOCGKPG92ALX6Jsc'
  },
}, function(error, response, body) {
  if(error) return console.error('Request failed:', error);
  else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
  else {
    console.log(body);
    return body.word;
    }
});

}
function get3Words(roomID) {
    var arr= new Array();
    var word=  getRandom();
    console.log(word);
    arr.push(word);
    arr.push(word); 
    arr.push(word);
    console.log("3 words are");
    console.log(arr);
    return arr;
}
function wait(roomID, drawer, ms) {
    return new Promise((resolve, reject) => {
        round.on('everybodyGuessed', ({ roomID: callerRoomID }) => {
            if (callerRoomID === roomID) resolve();
        });
        drawer.on('disconnect', (err) => reject(err));
        setTimeout(() => resolve(true), ms);
    });
}



module.exports = {
    get3Words,
    wait,
    getRandom
};
