// Import required modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Configure EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Route
app.get("/", (req, res) => {
  res.render("index"); // loads views/index.ejs
});

// ✅ Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Username
  socket.on("set-username", (username) => {
    socket.data.username = username;
    console.log(`User ${socket.id} set username: ${username}`);
  });

  // Location
  socket.on("send-location", (coords) => {
    io.emit("receive-location", {
      id: socket.id,
      username: socket.data.username || "Anonymous",
      ...coords,
    });
  });

  // Chat
  socket.on("chat-message", (msg) => {
    io.emit("chat-message", {
      username: socket.data.username || "Anonymous",
      message: msg,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
