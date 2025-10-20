const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const db = require("./config/db");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Serve frontend pages for any route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/:file", (req, res) => {
  const filePath = path.join(__dirname, "../frontend", req.params.file);
  res.sendFile(filePath);
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("userOnline", (username) => {
    console.log(`${username} is online`);
    db.query(
      "UPDATE messages SET status='delivered' WHERE receiver=? AND status='sent'",
      [username],
      (err) => { if (err) console.error("DB error:", err); }
    );
  });

  socket.on("sendMessage", ({ sender, receiver, message }) => {
    db.query(
      "INSERT INTO messages (sender, receiver, message, status) VALUES (?, ?, ?, 'sent')",
      [sender, receiver, message],
      (err, result) => {
        if (err) { console.error("DB error:", err); return; }
        const msgData = {
          id: result.insertId,
          sender,
          receiver,
          message,
          status: "sent",
          created_at: new Date().toISOString(),
        };
        io.emit("receiveMessage", msgData);
      }
    );
  });

  socket.on("markSeen", ({ messageId, username }) => {
    db.query(
      "UPDATE messages SET status='seen' WHERE id=? AND receiver=?",
      [messageId, username],
      (err) => { if (err) console.error("DB error:", err); }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server on all network interfaces
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
