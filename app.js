const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('index');
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Assign random color
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);

  // Handle location sharing
  socket.on("send-location", (coords) => {
    io.emit("receive-location", { id: socket.id, color: userColor, ...coords });
  });

  // Handle chat
  socket.on("chat-message", (data) => {
    io.emit("chat-message", data);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

