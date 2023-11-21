let timerID = 0;
let pickWordID = 0;
let hints = [];

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("mousedown", () => click.play());
});
var x = socket.id;




function appendMessage(
  { name = "", message, id },
  {
    userBlocked = false,
    correctGuess = false,
    closeGuess = false,
    lastWord = false,
    profanity = false,
  } = {}
) 
{
 // blockedSockets.push(x);

  const p = document.createElement("p");
  const chat = document.createTextNode(`${message}`);
  const messages = document.querySelector(".messages");

  //var x = socket.id;
 // blockedSockets.push(x);
//  alert(blockedSockets.length);
 // console.log(blockedSockets.length);

  if (name !== "") {
    const span = document.createElement("span");
    span.textContent = `${name}: `;
    span.classList.add("fw-bold");
    p.append(span);
  }
  p.classList.add("p-2", "mb-0");
  if (closeGuess)
   p.classList.add("close");
  else 
  if (lastWord)
   p.classList.add("alert-warning");
  else
   if (profanity) 
   {
    p.classList.add("profanity");
  }
  else 
  if (correctGuess) 
  {
    p.classList.add("correct");
  }

  p.append(chat);

  const newButton = document.createElement("button");
  newButton.textContent = "Block!";

  const newButton2 = document.createElement("button");
  newButton2.textContent = "Kick!";

  // document.body.appendChild(newButton);

  // p.append(newButton);
  // p.append(newButton2);
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;
  if(cnt===0)
  {

  }
  if (message === "You guessed it right!") 
       correct.play();
  // newButton.addEventListener("click", () => {
  //   isBlocked = true;
  //   alert("USER IS BLOCKED");
  //   // // console.log( socket.id + " is blocked");
  // });
 // alert(socket.id);
}



socket.on('choosing', ({ name }) => {
  const p = document.createElement('p');
  p.textContent = `${name} is choosing a word`;
  p.classList.add('lead', 'fw-bold', 'mb-0');
  document.querySelector('#wordDiv').innerHTML = '';
  document.querySelector('#wordDiv').append(p);
  document.querySelector('#clock').textContent = 0;
  clearInterval(timerID);
});


socket.on("message", appendMessage);
socket.on("closeGuess", (data) => appendMessage(data, { closeGuess: true }));
socket.on("profanity", (data) => appendMessage(data, { profanity: true }));
socket.on("correctGuess", (data) =>
  appendMessage(data, { correctGuess: true })
);
socket.on('lastWord', ( word ) => appendMessage({ message: `The word was ${word}` }, { lastWord: true }));

socket.on('hideWord', ({ word} ) => {

  const p = document.createElement('p');
  p.textContent = word;

  // console.log("HIDDEN WORD IS");
  // console.log(word);

  p.classList.add('lead', 'fw-bold', 'mb-0');
  p.style.letterSpacing = '0.5em';
  document.querySelector('#wordDiv').innerHTML = '';
  document.querySelector('#wordDiv').append(p);
//  console.log( "+ +" );
});

function chooseWord(word) 
{
    clearTimeout(pickWordID);
    socket.emit('chooseWord', { word });
    const p = document.createElement('p');
    p.textContent = word;
    p.classList.add('lead', 'fw-bold', 'mb-0');
    document.querySelector('#wordDiv').innerHTML = '';
    document.querySelector('#wordDiv').append(p);
}



socket.on('chooseWord', async ([word1, word2, word3]) => 
{
  const p = document.createElement('p');
  const btn1 = document.createElement('button');
  const btn2 = document.createElement('button');
  const btn3 = document.createElement('button');
  const text = document.createTextNode('Choose a word');
  btn1.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2'); 
  btn2.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2');
  btn3.classList.add('btn', 'btn-outline-success', 'rounded-pill', 'mx-2');
  p.classList.add('lead', 'fw-bold');
  btn1.textContent = word1;
  btn2.textContent = word2;
  btn3.textContent = word3;
  btn1.addEventListener('click', () => chooseWord(word1));
  btn2.addEventListener('click', () => chooseWord(word2));
  btn3.addEventListener('click', () => chooseWord(word3));
  p.append(text);
  document.querySelector('#wordDiv').innerHTML = '';
  document.querySelector('#wordDiv').append(p, btn1, btn2, btn3);
  document.querySelector('#tools').classList.remove('d-none');
  document.querySelector('#clock').textContent = 0;
  clearInterval(timerID);
  pickWordID = setTimeout(() => chooseWord(word2), 15000);
});

function startTimer(ms) 
{
  console.log("TIME IS " + ms);
  let secs = ms / 1000;
  const id = setInterval((function updateClock() {
    if (secs === 0) clearInterval(id);
    document.getElementById("clock").innerHTML =secs;
    console.log(secs);
    secs--;
    return updateClock;
}()), 1000);
  timerID = id;
}



socket.on('startTimer', ( time ) => startTimer(time));

document.querySelector("#sendMessage").addEventListener("submit", function (e) 
{
  e.preventDefault();
  const message = this.firstElementChild.value;
  this.firstElementChild.value = "";
  socket.emit("message",  {message} );
});


function createScoreCard(players)
 {
// console.log("Player Array is");
   // alert("WE inside");
  players.forEach((player) => 
  {
    //console.log(player);
   // alert(player);
      const div = document.createElement('div');
      const avatar = document.createElement('div');
      const details = document.createElement('div');
      const img = document.createElement('img');
      const p1 = document.createElement('p');
      const p2 = document.createElement('p');
      const name = document.createTextNode(player.name);
      const score = document.createTextNode('Score: 0');
      const foradmin = document.createTextNode('(admin)');
      const spa= document.createElement('div');
      const newButton = document.createElement("button");
      newButton.textContent = "Block!";

       newButton.addEventListener("click", () => 
       {
          socket.emit('chatBlock',player.socketId);
      });
      const newButton2 = document.createElement("button");
      newButton2.textContent = "Kick!";

       newButton2.addEventListener("click", () => 
       {
        //  socket.emit('chatBlock',player.id);
          socket.emit('KickPlayer', player.socketId );
      });

      
      // img.src = player.avatar;
      img.classList.add('img-fluid', 'rounded-circle');
      div.classList.add('row', 'justify-content-end', 'py-1', 'align-items-center');
      avatar.classList.add('col-5', 'col-xl-4');
      details.classList.add('col-7', 'col-xl-6', 'text-center', 'my-auto');
      p1.classList.add('mb-0');
      p2.classList.add('mb-0');
      div.id = player.socketId ;
      div.append(details, avatar);
      if(player.isAdmin === false)  
     div.append(newButton);
      // div.append(spa);
      if(player.isAdmin === false)  
      div.append(newButton2);
      avatar.append(img);
      details.append(p1, p2);
      p1.append(name);
      
      if(player.isAdmin === true) 
         p1.append(foradmin);

      p2.append(score);
      document.querySelector('.players').append(div);

    });
}
function createScoreCard2(players)
 {
// console.log("Player Array is");
   // alert("WE inside");
  players.forEach((player) => 
  {
    //console.log(player);
   // alert(player);
      const div = document.createElement('div');
      const avatar = document.createElement('div');
      const details = document.createElement('div');
      const img = document.createElement('img');
      const p1 = document.createElement('p');
      const p2 = document.createElement('p');
      const name = document.createTextNode(player.name);
      const score = document.createTextNode('Score: 0');
      const spa= document.createElement('div');
      // const newButton = document.createElement("button");
      // newButton.textContent = "Block!";

      //  newButton.addEventListener("click", () => 
      //  {
      //     socket.emit('chatBlock',player.id);
      // });
      // const newButton2 = document.createElement("button");
      // newButton2.textContent = "Kick!";

      //  newButton2.addEventListener("click", () => 
      //  {
      //   //  socket.emit('chatBlock',player.id);
      //     socket.emit('KickPlayer', player.id );
      // });

      
      // img.src = player.avatar;
      img.classList.add('img-fluid', 'rounded-circle');
      div.classList.add('row', 'justify-content-end', 'py-1', 'align-items-center');
      avatar.classList.add('col-5', 'col-xl-4');
      details.classList.add('col-7', 'col-xl-6', 'text-center', 'my-auto');
      p1.classList.add('mb-0');
      p2.classList.add('mb-0');
      div.id = player.socketId ;
      div.append(details, avatar);
    //  div.append(newButton);
      // div.append(spa);
      // div.append(newButton2);
      avatar.append(img);
      details.append(p1, p2);
      p1.append(name);
      p2.append(score);
      document.querySelector('.players').append(div);

  });
}


socket.on('getPlayers', (players) =>
{ 
 createScoreCard(players);
}
 );
socket.on('getplayersA' , (players) =>{
  createScoreCard(players);
});
socket.on('getPlayersO', (players)=>{
  createScoreCard2(players);
});

 socket.on('updateScore', ({
  playerID,
  score
  // ,
  // drawerID,
  // drawerScore,
}) => {
  document.querySelector(`#${playerID}> div p:last-child`).textContent 
  = `Score: ${score}`;
  // document.querySelector(`#skribblr-${drawerID}>div p:last-child`).textContent = `Score: ${drawerScore}`;
});


socket.on('endGame', async ( stats ) => 
{
  // alert("You have been kicked by the admin .");
  document.querySelector('#gameZone').remove();

  stats.forEach((player) => 
  {
   //alert(player.name);
   const row = document.createElement('div');
   const nameDiv = document.createElement('div');
   const scoreDiv = document.createElement('div');
   const name = document.createElement('p');
   const score = document.createElement('p');
   name.textContent = player.name;
   score.textContent = player.score;

   row.classList.add('row', 'mx-0', 'align-items-center');
   nameDiv.classList.add('col-7', 'text-center');
   scoreDiv.classList.add('col-3', 'text-center');
   name.classList.add('display-6', 'fw-normal', 'mb-0');
   score.classList.add('display-6', 'fw-normal', 'mb-0');
   nameDiv.append(name);
   scoreDiv.append(score);
   row.append(nameDiv, scoreDiv);
   document.querySelector('#statsDiv').append(row, document.createElement('hr'));
  });
  
  document.querySelector('#gameEnded').classList.remove('d-none');

});


