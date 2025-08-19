const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const db = require("./config/db"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Socket.IO
/*io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    //console.log("User disconnected:", socket.id);
  //});
//});*/
// Socket.IO
/*io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When user comes online
  socket.on("userOnline", (username) => {
    console.log(`${username} is online`);
    // Mark undelivered messages as delivered
    db.query(
      "UPDATE messages SET status='delivered' WHERE receiver=? AND status='sent'",
      [username],
      (err) => {
        if (err) console.error("DB error:", err);
      }
    );
  });

  // Sending a new message
  socket.on("sendMessage", ({ sender, receiver, message }) => {
    db.query(
      "INSERT INTO messages (sender, receiver, message, status) VALUES (?, ?, ?, 'sent')",
      [sender, receiver, message],
      (err, result) => {
        if (err) {
          console.error("DB error:", err);
          return;
        }
        const msgData = {
          id: result.insertId,
          sender,
          receiver,
          message,
          status: "sent",
        };
        io.emit("receiveMessage", msgData);
      }
    );
  });

  // Mark as seen
  socket.on("markSeen", ({ messageId, username }) => {
    db.query(
      "UPDATE messages SET status='seen' WHERE id=? AND receiver=?",
      [messageId, username],
      (err) => {
        if (err) console.error("DB error:", err);
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});*/
// Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When user comes online
  socket.on("userOnline", (username) => {
    console.log(`${username} is online`);
    // Mark undelivered messages as delivered
    db.query(
      "UPDATE messages SET status='delivered' WHERE receiver=? AND status='sent'",
      [username],
      (err) => {
        if (err) console.error("DB error:", err);
      }
    );
  });

  // Sending a new message
  socket.on("sendMessage", ({ sender, receiver, message }) => {
    db.query(
      "INSERT INTO messages (sender, receiver, message, status) VALUES (?, ?, ?, 'sent')",
      [sender, receiver, message],
      (err, result) => {
        if (err) {
          console.error("DB error:", err);
          return;
        }
        const msgData = {
          id: result.insertId,
          sender,
          receiver,
          message,
          status: "sent",
        };
        io.emit("receiveMessage", msgData);
      }
    );
  });

  // Mark as seen
  socket.on("markSeen", ({ messageId, username }) => {
    db.query(
      "UPDATE messages SET status='seen' WHERE id=? AND receiver=?",
      [messageId, username],
      (err) => {
        if (err) console.error("DB error:", err);
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

