  // ✅ add this
const mysql = require("mysql2");

const db = mysql.createConnection(process.env.DATABASE_URL || {
  host: "localhost",
  user: "root",   // change if needed
  password: "Meena@2925",   // your MySQL password
  database: "chat_app"
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

module.exports = db;
