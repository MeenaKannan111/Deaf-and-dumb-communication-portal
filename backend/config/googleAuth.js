const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      db.query('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, results) => {
        if (err) return done(err);

        if (results.length > 0) {
          // User exists, return user
          return done(null, results[0]);
        } else {
          // Check if user exists with this email
          db.query('SELECT * FROM users WHERE email = ?', [profile.emails[0].value], (err, emailResults) => {
            if (err) return done(err);

            if (emailResults.length > 0) {
              // Link Google account to existing user
              db.query('UPDATE users SET google_id = ? WHERE email = ?', [profile.id, profile.emails[0].value], (err) => {
                if (err) return done(err);
                const user = { ...emailResults[0], google_id: profile.id };
                return done(null, user);
              });
            } else {
              // Create new user
              const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
              db.query('INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)',
                [username, profile.emails[0].value, profile.id], (err, result) => {
                if (err) return done(err);
                const newUser = {
                  id: result.insertId,
                  username: username,
                  email: profile.emails[0].value,
                  google_id: profile.id
                };
                return done(null, newUser);
              });
            }
          });
        }
      });
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return done(err);
    done(null, results[0]);
  });
});

