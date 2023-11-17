class Canvas {
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }

    broadcastDrawing(data) {
        const { socket } = this;
        console.log(data);
        socket.broadcast.to(socket.roomId).emit('drawing', data);
    }

    clearCanvas() {
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('clearCanvas');
    }
    stopDrawing(){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('stopdrawing');
    }
    undoDo(){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('undodo');
    }
    redoDo(){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('redoDo');
    }
    rectDo(){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('rectDo');
    }
}

module.exports = Canvas;