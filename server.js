const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

// our localhost port
const port = 5000;

const app = express();

// our server instance
const server = http.createServer(app);

// This creates our socket using the instance of the server
const io = socketIO(server);

// This is what the socket.io syntax is like, we will work this later
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("change backgroundColor", (backgroundColor) => {
    console.log("Background color Changed to: ", backgroundColor);
    io.sockets.emit("change backgroundColor", backgroundColor);
  });

  socket.on("change fillWithBackgroundColor", (fillWithBackgroundColor) => {
    console.log(
      "Fill With Background color Changed to: ",
      fillWithBackgroundColor
    );
    io.sockets.emit("change fillWithBackgroundColor", fillWithBackgroundColor);
  });

  socket.on("new drawing", (drawing) => {
    console.log("New drawing changed to: ", drawing);
    io.sockets.emit("new drawing", drawing);
  });

  socket.on("drawing", (data) => {
    console.log("One client is drawing, sending to all...");
    io.sockets.emit("drawing", data);
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
