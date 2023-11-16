
function get3Words(roomID) {
    var arr= new Array();
    arr.push("arpit");
    arr.push("ayush"); 
    arr.push("ankit");
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
    wait
};
