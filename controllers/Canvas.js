class Canvas {
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }

    async broadcastDrawing(data) {
        const { socket } = this;
         await socket.broadcast.to(socket.roomId).emit('drawing', data);
    }

    drawRectangle(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('drawRect', data);
    }

    stopRectangle(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('stopRect', data);
    }

    drawCircle(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('drawCircle', data);
    }

    stopCircle(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('stopCircle', data);
    }

    drawLine(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('drawLine', data);
    }

    stopLine(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('stopLine', data);
    }
    bucketFill(data){
        const { socket } = this;
        console.log(data);
        socket.broadcast.to(socket.roomId).emit('bucketFill',data);
    }
    eraser(data){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('eraser',data);
    }

    stopEraser(){
        const { socket } = this;
        socket.broadcast.to(socket.roomId).emit('stopEraser');
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
}

module.exports = Canvas;