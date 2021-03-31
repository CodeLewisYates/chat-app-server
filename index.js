const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const {addUser, removeUser, getUser, getUsersInRoom} = require("./users")

const PORT = process.env.PORT || 5000;
const corsOptions = {
  cors: true,
  origins: ["https://chat-app-ly.netlify.app"]
}
const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server, corsOptions);

io.on("connection", (socket) => {
  // socket argument here is the clients instance of a socket.
  socket.on('join', ({name, room}, callback) => {
    const {error, user} = addUser({id: socket.id, name, room});

    if (error) return callback(error);

    socket.emit('message', { user: 'server', text: `${user.name}, Welcome to the room ${user.room}` });
    socket.broadcast.to(user.room).emit('message', {user: 'server', text: `${user.name} has joined!`});

    socket.join(user.room);

    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    callback();
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', {user: user.name, text: message});
    

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', {user: 'server', text: `${user.name} has left.`});
      console.log(getUsersInRoom(user.room))
      io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
    }
  });
});



app.use(router);
app.use(cors());

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
