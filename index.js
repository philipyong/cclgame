const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const ccl = require("./cclgame.js");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  console.log("CONNECTED:", socket.username);
  next();
});

io.on("connection", (socket) => {
  ccl.initGame(io, socket);

  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.username);
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
