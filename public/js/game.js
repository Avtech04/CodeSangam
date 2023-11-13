
let timerID = 0;
let pickWordID = 0;
let hints = [];


document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("mousedown", () => click.play());
});
var x = socket.id;

function createScoreCard(players) {
  players.forEach((player) => {
    const div = document.createElement("div");
    const avatar = document.createElement("div");
    const details = document.createElement("div");
    const img = document.createElement("img");
    const p1 = document.createElement("p");
    const p2 = document.createElement("p");
    const name = document.createTextNode(player.name);
    const score = document.createTextNode("Score: 0");
     const id = player.id;
    // const roomID=  player.gameID ;
    // const socket2= player.socket ;
    img.src = player.avatar;
    img.classList.add("img-fluid", "rounded-circle");
    div.classList.add(
      "row",
      "justify-content-end",
      "py-1",
      "align-items-center"
    );
    avatar.classList.add("col-5", "col-xl-4");
    details.classList.add("col-7", "col-xl-6", "text-center", "my-auto");
    p1.classList.add("mb-0");
    p2.classList.add("mb-0");
    div.id = `skribblr-${player.id}`;
    div.append(details, avatar);
    div.append(id);
   // div.append(roomID);

    const newButton = document.createElement("button");
    newButton.textContent = "Click me!";
    document.body.appendChild(newButton);
    newButton.addEventListener("click", () => {
      //socket.to(socket.roomID).emit('disconnection', socket.player);
      
      // socket.emit("kick", socket2 );
      
  //    socket.to(roomID).emit('disconnection', player );

       //socket2.leave(roomID) ;
       socket.emit('kick',id);
       alert('DONE') ;

      // io.of('/').in('chat').clients((error, socketIds) => {
      //   if (error) throw error;
      
      //   socketIds.forEach(socketId => io.sockets.sockets[socketId].leave('chat'));
      
      // });
      // io.on("connection", socket => {
      //   socket.on("disconnecting", () => {
      //     console.log(socket.rooms); // the Set contains at least the socket ID
      //   });
      
      //   socket.on("disconnect", () => {
      //     // socket.rooms.size === 0
      //   });
      // });
    });

    avatar.append(img);
    details.append(p1, p2);
    p1.append(name);
    p2.append(score);
    document.querySelector(".players").append(div);
  });
}

var isBlocked = false;
var cnt = 3;
function appendMessage(
  { name = "", message, id },
  {
    userBlocked = false,
    correctGuess = false,
    closeGuess = false,
    lastWord = false,
    profanity = false,
  } = {}
) {
  if (isBlocked) {
     alert(socket.id + " have been blocked");
    return;
  }

  const p = document.createElement("p");
  const chat = document.createTextNode(`${message}`);
  const messages = document.querySelector(".messages");

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
    cnt--;
    if (cnt === 0) {
      // isBlocked = true;
      // alert( socket.id + " IS BLOCKED");
      // // console.log(err);
    }
  }
  else 
  if (correctGuess) 
  {
  //  document.getElementById(`skribblr-${id}`).classList.add("correct");
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
  if (message === "You guessed it right!") correct.play();
  // newButton.addEventListener("click", () => {
  //   isBlocked = true;
  //   alert("USER IS BLOCKED");
  //   // // console.log( socket.id + " is blocked");
  // });
 // alert(socket.id);
}

socket.on("getPlayers", (players) => createScoreCard(players));








socket.on("startTimer", ({ time }) => startTimer(time));
socket.on("message", appendMessage);
socket.on("userBlocked", (data) => appendMessage(data, { userBlocked: true }));
socket.on("closeGuess", (data) => appendMessage(data, { closeGuess: true }));
socket.on("profanity", (data) => appendMessage(data, { profanity: true }));
socket.on("correctGuess", (data) =>
  appendMessage(data, { correctGuess: true })
);





// eslint-disable-next-line func-names
document.querySelector("#sendMessage").addEventListener("submit", function (e) {
  e.preventDefault();
  const message = this.firstElementChild.value;
  this.firstElementChild.value = "";
  socket.emit("message",  {message} );
});
