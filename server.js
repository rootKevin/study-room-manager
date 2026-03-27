const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.redirect("/student.html");
});

let students = [];
let currentIndex = null;
let broadcastMessage = "";

function broadcast() {
  io.emit("update", {
    students,
    currentIndex,
    broadcastMessage
  });
}

io.on("connection", (socket) => {
  socket.emit("update", { students, currentIndex, broadcastMessage });

  socket.on("addStudents", (list) => {
    students = list;
    currentIndex = null;
    broadcast();
  });

  socket.on("next", () => {
    if (students.length === 0) return;

    if (currentIndex === null) {
      currentIndex = 0;
    } else {
      currentIndex = (currentIndex + 1) % students.length;
    }

    broadcast();
  });

  socket.on("prev", () => {
    if (students.length === 0) return;

    if (currentIndex === null) {
      currentIndex = students.length - 1;
    } else {
      currentIndex = (currentIndex - 1 + students.length) % students.length;
    }

    broadcast();
  });

  socket.on("shuffle", () => {
    if (students.length === 0) return;

    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }

    currentIndex = null;
    broadcast();
  });

  socket.on("clearSelection", () => {
    currentIndex = null;
    broadcast();
  });

  socket.on("deleteStudent", (index) => {
    students.splice(index, 1);

    if (students.length === 0) {
      currentIndex = null;
    } else if (currentIndex === index) {
      currentIndex = null;
    } else if (currentIndex !== null && currentIndex > index) {
      currentIndex -= 1;
    } else if (currentIndex !== null && currentIndex >= students.length) {
      currentIndex = students.length - 1;
    }

    broadcast();
  });

  socket.on("clearAllStudents", () => {
    students = [];
    currentIndex = null;
    broadcast();
  });

  socket.on("setBroadcastMessage", (message) => {
    broadcastMessage = (message || "").trim();
    broadcast();
  });

  socket.on("clearBroadcastMessage", () => {
    broadcastMessage = "";
    broadcast();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on port ${PORT}`);
});