const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();

// our server instance
const server = http.createServer(app);

// This creates our socket using the instance of the server
const io = socketIO(server);

let onlineCount = 0;

let users = [];

let drawings = {};
let redo = {};

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

    if (!drawings[room]) {
      drawings[room] = [];
      redo[room] = [];
    }

    join.color = color;
    users.push(join);
    socket.join(join.room);
    socket.userId = join.id;
    join.drawings = drawings[room];
    join.redo = redo[room];
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

  socket.on("clear", (room) => {
    drawings[room] = [];
    redo[room] = [];
    io.in(room).emit("clear", room);
  });

  socket.on("pushToDrawings", (room, drawing) => {
    drawings[room].push(drawing);
    redo[room] = [];
    io.in(room).emit("pushToDrawings", room, drawing);
  });

  socket.on("undo", (room) => {
    if (drawings[room].length === 0) {
      return;
    }
    const poppedItem = drawings[room].pop();
    redo[room].push(poppedItem);
    io.in(room).emit("undo", room);
  });

  socket.on("redo", (room) => {
    if (redo[room].length === 0) {
      return;
    }
    const poppedItem = redo[room].pop();
    drawings[room].push(poppedItem);
    io.in(room).emit("redo", room);
  });

  socket.on("loadFromJson", (room, currDrawings) => {
    redo[room] = [];
    drawings[room] = currDrawings;
    io.in(room).emit("loadFromJson", room, currDrawings);
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

  socket.on("mapChange", (room, map, selected) => {
    socket.in(room).emit("mapChange", map, selected);
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("clear", (room) => {
    io.in(room).emit("clear");
  });
});

if (process.env.NODE_ENV === "production") {
  //set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Listening on port ${port}`));
