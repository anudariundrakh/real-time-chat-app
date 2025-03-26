const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = [];

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  users.push(socket.id);

  socket.on('ready', (data) => {
    console.log('User ready to chat:', data.userId);
    
    const randomUser = users.find(id => id !== data.userId);
    if (randomUser) {
      io.to(randomUser).emit('offer', { from: data.userId });
      
      socket.emit('offer', { from: randomUser });
    }
  });

  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', data);
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', data);
  });

  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('message', (data) => {
    socket.broadcast.emit('message', data); 
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users = users.filter(id => id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
