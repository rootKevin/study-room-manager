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
let currentIndex = 0;

function broadcast() {
  io.emit("update", {
    students,
    currentIndex
  });
}

io.on("connection", (socket) => {
  socket.emit("update", { students, currentIndex });

  socket.on("addStudents", (list) => {
    students = list;
    currentIndex = 0;
    broadcast();
  });

  socket.on("next", () => {
    if (students.length === 0) return;
    currentIndex = (currentIndex + 1) % students.length;
    broadcast();
  });

  socket.on("prev", () => {
    if (students.length === 0) return;
    currentIndex = (currentIndex - 1 + students.length) % students.length;
    broadcast();
  });

  socket.on("random", () => {
    if (students.length === 0) return;
    currentIndex = Math.floor(Math.random() * students.length);
    broadcast();
  });

  socket.on("deleteStudent", (index) => {
    students.splice(index, 1);

    if (currentIndex >= students.length) {
      currentIndex = students.length - 1;
    }

    if (currentIndex < 0) {
      currentIndex = 0;
    }

    broadcast();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on port ${PORT}`);
});