const socket = io('');
const createPrivateRoom = document.getElementById('privateRoom');
const userName = document.getElementById('randomPlay');
const copyBtn = document.querySelector('#copy');







user = JSON.parse(user);

//updating the setting of private room
function updateSettings(e) 
{
    e.preventDefault();
    socket.emit('settingsUpdate',
     {
        rounds: document.querySelector('#rounds').value,
        time: document.querySelector('#time').value,
    });
}


//function to insert player in a private room 
function insertPlayer(player) {

    //creating element
    const div = document.createElement('div');
    const img = document.createElement('img');
    const p = document.createElement('p');
    const text = document.createTextNode(player.name);
    div.id = `${player.socketId}`;
    p.appendChild(text);
    p.classList.add('text-center');

    img.src = 'https://robohash.org/stefan-one';
    img.alt = player.name;

    img.classList.add('img-fluid', 'rounded-circle');
    div.classList.add('col-4', 'col-sm-3', 'col-md-4', 'col-lg-3');

    div.appendChild(img);
    div.appendChild(p);

    document.querySelector('#playersDiv').appendChild(div);
}


//function to insert player in public rooms
function putPlayerPublic(player)
{
    const div = document.createElement('div');
    const img = document.createElement('img');
    const p = document.createElement('p');
    const text = document.createTextNode(player.name);
    div.id = `${player.socketId}`;
    p.appendChild(text);
    p.classList.add('text-center');

    img.src = 'https://robohash.org/stefan-one';
    img.alt = player.name;
    img.classList.add('img-fluid', 'rounded-circle');
    div.classList.add('col-4', 'col-sm-3', 'col-md-4', 'col-lg-3');

    div.appendChild(img);
    div.appendChild(p);
    document.querySelector('#playersPublic').appendChild(div);
}

//console.log(roomId);

//if statement to check whether user is guest or logged in 
if (user._id) 
{
    //if statement to check whether the user is creating a private room or joining a private room
    if (roomId) 
    {
        // disabling settings of private room for user other than admin
        document.querySelector('#rounds').setAttribute('disabled', true);
        document.querySelector('#time').setAttribute('disabled', true);
        document.querySelector('#startGame').setAttribute('disabled', true);

        //events occuring after clicking on join Room button
        document.querySelector('#joinRoom').addEventListener('click', async () => {
            document.querySelector('#landing').remove();
            document.querySelector('#private-room').classList.remove('d-none');
            if (roomId)
             {
                document.querySelector('#gameLink').value = `${window.location.protocol}//${window.location.host}/game/?id=${roomId}`;
                //insertPlayer();
            }
            socket.emit('joinRoom', { roomId, user });
        });
        
    } 
    else 
    {
        //events for users who want to create a private room
        document.querySelector('#rounds').addEventListener('input', updateSettings);
        document.querySelector('#time').addEventListener('input', updateSettings);
        createPrivateRoom.addEventListener('click', () => 
        {
            document.querySelector('#landing').remove();
            document.querySelector('#private-room').classList.remove('d-none');
            socket.emit('create-private-room', user);
        });
    }

    //for registered user to join a public room 
    document.querySelector('#randomPlay').addEventListener('click',()=>{
        
        document.querySelector('#landing').remove();
        document.querySelector('#waiting').classList.remove('d-none');
        socket.emit('joinPublic',user);
    })

} 
else
 {
    //for guest user to land them on waiting page
    //console.log('yes');
    document.querySelector('#waiting').classList.remove('d-none');
    socket.emit('joinPublic',user);
}


document.querySelector('#startGame').addEventListener('click', 
async () => 
{
    canvas();
    socket.emit('startGame');
});

//to remove user icon from lobby if user left the room
function removeID(socketIDD)
{
  var ele  = document.getElementById(socketIDD);
  var parentContainer = ele.parentNode;
  parentContainer.removeChild(ele);
  //   alert(" REMOVED FROM LOBBBY  ");
}


//function to display game area to user
function canvas() {

    //console.log('got change');
    document.querySelector('#private-room').remove();
    document.querySelector('#waiting').remove();
    document.querySelector('#gameZone').classList.remove('d-none');
}

//events occuring after clicking the copy buttonof the link
copyBtn.addEventListener('click', (e) => {
    let textToCopy = document.getElementById('gameLink').value;
    //console.log(textToCopy);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy);
    } else {
        //console.log('Browser Not compatible')
    }
});


//Sockets recieved from the backend

socket.on('startGame', canvas);

socket.on('newPrivateRoom', (data) => {
    document.querySelector('#gameLink').value = `${window.location.protocol}//${window.location.host}/game/?id=${data.gameID}`;
    insertPlayer(data.user);
});

socket.on("joinRoom", (data) => {
    //console.log("yes");
    insertPlayer(data);
});

socket.on('removeID',(socketIDD) => 
 {
    removeID(socketIDD);
 });

socket.on('joinPublicRoom',(data)=>
{
    putPlayerPublic(data) ;
})

//to display other players in a lobby of private room
socket.on('otherPlayers', (data) =>
 data.players.forEach((player) => 
 insertPlayer(player)
 ));

 //to display other players in public room in a lobby
socket.on('otherPublicPlayers',(data)=> 
{data.players.forEach((player) => putPlayerPublic(player))}
);

