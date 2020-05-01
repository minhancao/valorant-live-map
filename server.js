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

let onlineCount = 0;

let users = [];

// This is what the socket.io syntax is like, we will work this later
io.sockets.on("connection", (socket) => {
  console.log("New client connected");
  let addedToList = false;
  let color;
  let room;
  let currentUsersInRoom;

  socket.on("join", (join) => {
    if (addedToList) return;
    onlineCount++;
    join.id = onlineCount;
    addedToList = true;
    color = "black";
    room = join.room;
    join.color = color;
    users.push(join);
    socket.join(join.room);
    socket.userId = join.id;
    socket.emit("joined", join);
    currentUsersInRoom = users.filter((user) => {
      if (user.room === room) {
        return user;
      }
    });

    io.in(room).emit("users", currentUsersInRoom);
  });

  socket.on("drawing", (data) => {
    socket.in(data.room).emit("drawing", data);
  });

  socket.on("color-change", (data) => {
    currentUsersInRoom = users.filter((user) => {
      if (user.room === data.room) {
        if (user.id === data.id) {
          color = data.color;
          user.color = data.color;
        }
        return user;
      }
    });
    io.in(data.room).emit("users", currentUsersInRoom);
  });

  socket.on("leaveroom", (data) => {
    addedToList = false;
    users = users.filter((user) => {
      if (user.id !== socket.userId) {
        return user;
      }
    });
    let currentUsersInThisRoom = users.filter((user) => {
      if (user.room === data.room) {
        if (user.id !== socket.userId) {
          return user;
        }
      }
    });
    currentUsersInRoom = [];
    io.in(data.room).emit("users", currentUsersInThisRoom);
  });

  socket.on("clear", (clear) => {
    io.in(clear).emit("clear", clear);
  });

  socket.on("disconnect", () => {
    addedToList = false;

    users = users.filter((user) => {
      if (user.id !== socket.userId) {
        return user;
      }
    });

    currentUsersInRoom = users.filter((user) => {
      if (user.room === room) {
        return user;
      }
    });

    io.in(room).emit("users", currentUsersInRoom);
  });

  socket.on("change backgroundColor", (room, backgroundColor) => {
    console.log(
      "Room" + room + " Background color Changed to: ",
      backgroundColor
    );
    io.in(room).emit("change backgroundColor", room, backgroundColor);
  });

  socket.on(
    "change fillWithBackgroundColor",
    (room, fillWithBackgroundColor) => {
      console.log(
        "Room" + room + " Fill With Background color Changed to: ",
        fillWithBackgroundColor
      );
      io.in(room).emit(
        "change fillWithBackgroundColor",
        room,
        fillWithBackgroundColor
      );
    }
  );

  socket.on("drawing", (data) => {
    socket.in(data.room).emit("drawing", data);
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("clear", (room) => {
    io.in(room).emit("clear");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
