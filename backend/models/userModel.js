// backend/models/userModel.js
// Data-access layer for users (MySQL + mysql2/promise)

const bcrypt = require('bcrypt');
const pool = require('../config/db'); // <- uses the MySQL pool from backend/config/db.js

/**
 * Find a user by username.
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Create a new user with hashed password.
 * @param {string} username
 * @param {string} plainPassword
 * @returns {Promise<{id:number, username:string}>}
 */
async function createUser(username, plainPassword) {
  const hash = await bcrypt.hash(plainPassword, 10);

  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash]
    );
    return { id: result.insertId, username };
  } catch (err) {
    // Duplicate username (MySQL code ER_DUP_ENTRY)
    if (err && err.code === 'ER_DUP_ENTRY') {
      const e = new Error('USERNAME_TAKEN');
      e.status = 409;
      throw e;
    }
    err.status = 500;
    throw err;
  }
}

/**
 * Verify username + password.
 * @param {string} username
 * @param {string} plainPassword
 * @returns {Promise<{id:number, username:string}|null>}
 */
async function verifyCredentials(username, plainPassword) {
  const user = await findByUsername(username);
  if (!user) return null;

  const ok = await bcrypt.compare(plainPassword, user.password);
  if (!ok) return null;

  return { id: user.id, username: user.username };
}

module.exports = {
  findByUsername,
  createUser,
  verifyCredentials,
};
