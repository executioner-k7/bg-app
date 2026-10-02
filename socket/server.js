import { Server } from "socket.io";

const PORT = 3001;

const io = new Server(PORT, {
  cors: {
    origin: "*",
  },
  maxHttpBufferSize: 5e6,
});

const themes = new Set(["light", "dark", "system"]);

let latestCode = "// Start writing your code...";
let latestTheme = "system";
let latestLanguage = "javascript";
let sharerId = null;
const watchers = new Set();

function sendScreenStatus() {
  io.emit("screen:status", { sharerId });
}

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.emit("code:update", latestCode);
  socket.emit("theme:update", latestTheme);
  socket.emit("language:update", latestLanguage);
  socket.emit("screen:status", { sharerId });

  socket.on("code:change", (code) => {
    if (typeof code !== "string") return;
    latestCode = code;
    socket.broadcast.emit("code:update", latestCode);
  });

  socket.on("theme:change", (theme) => {
    if (!themes.has(theme)) return;
    latestTheme = theme;
    socket.broadcast.emit("theme:update", latestTheme);
  });

  socket.on("language:change", (language) => {
    if (typeof language !== "string") return;
    latestLanguage = language;
    socket.broadcast.emit("language:update", latestLanguage);
  });

  socket.on("screen:start", () => {
    if (sharerId && sharerId !== socket.id) return;
    sharerId = socket.id;
    sendScreenStatus();
  });

  socket.on("screen:stop", () => {
    if (sharerId !== socket.id) return;
    sharerId = null;
    watchers.clear();
    sendScreenStatus();
  });

  socket.on("screen:watch", () => {
    if (!sharerId || sharerId === socket.id) return;
    watchers.add(socket.id);
    console.log("viewer watching:", socket.id);
  });

  socket.on("screen:frame", (frame) => {
    if (socket.id !== sharerId || watchers.size === 0) return;
    for (const viewerId of watchers) {
      io.to(viewerId).emit("screen:frame", frame);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("client disconnected:", socket.id, reason);
    watchers.delete(socket.id);
    if (sharerId === socket.id) {
      sharerId = null;
      watchers.clear();
      sendScreenStatus();
    }
  });
});

console.log(`socket server listening on ${PORT}`);
