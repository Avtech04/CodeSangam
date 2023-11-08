const socket=io('');
const createPrivateRoom=document.getElementById('privateRoom');
const userName=document.getElementById('randomPlay');
const copyBtn = document.querySelector('#copy');
user=JSON.parse(user);

function putPlayer(player) {
    const div = document.createElement('div');
    const img = document.createElement('img');
    const p = document.createElement('p');
    const text = document.createTextNode(player.name);
    div.id = `skribblr-${player.userId}`;
    p.appendChild(text);
    p.classList.add('text-center');
    
    img.src = 'https://avatars.dicebear.com/api/avataaars/.svg';
    img.alt = player.name;
    img.classList.add('img-fluid', 'rounded-circle');
    div.classList.add('col-4', 'col-sm-3', 'col-md-4', 'col-lg-3');
    
        div.appendChild(img);
        div.appendChild(p);
        document.querySelector('#playersDiv').appendChild(div);
    
}
console.log(roomId);
if (roomId) {
    // player
    document.querySelector('#rounds').setAttribute('disabled', true);
    document.querySelector('#time').setAttribute('disabled', true);
    document.querySelector('#startGame').setAttribute('disabled', true);
    document.querySelector('#playGame').addEventListener('click', async () => {
        document.querySelector('#landing').remove();
        document.querySelector('#private-room').classList.remove('d-none');
        if (roomId) {
            document.querySelector('#gameLink').value = `${window.location.protocol}//${window.location.host}/game/?id=${roomId}`;
            //putPlayer();
        }
        socket.emit('joinRoom', { roomId, user });
    });
} else{
    createPrivateRoom.addEventListener('click',()=>{
    document.querySelector('#landing').remove();
    document.querySelector('#private-room').classList.remove('d-none');
    socket.emit('create-private-room',user);
    socket.on('newPrivateRoom', (data) => {
        document.querySelector('#gameLink').value = `${window.location.protocol}//${window.location.host}/game/?id=${data.gameID}`;
        putPlayer(data.user);
    });
});
}
copyBtn.addEventListener('click', (e) => {
        let textToCopy = document.getElementById('gameLink').value;
        console.log(textToCopy);
        if(navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy);
        } else {
            console.log('Browser Not compatible')
        }
});

socket.on("joinRoom",(data)=>{
    console.log("yes");
    putPlayer(data);
})
socket.on('otherPlayers', (data) => data.players.forEach((player) => putPlayer(player)));