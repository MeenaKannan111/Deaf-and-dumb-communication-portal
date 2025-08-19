const express = require("express");
const db = require("../config/db");
const router = express.Router();

// Get all users
router.get("/users", (req, res) => {
  db.query("SELECT username FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(results);
  });
});

// Get messages for a user
router.get("/messages/:username", (req, res) => {
  const { username } = req.params;
  db.query(
    "SELECT id, sender, receiver, message, status, created_at FROM messages WHERE sender=? OR receiver=? ORDER BY created_at ASC",
    [username, username],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(results);
    }
  );
});

module.exports = router;
