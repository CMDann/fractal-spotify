const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./spotify_credentials.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT,
    client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/spotify/credentials', (req, res) => {
  const { client_id, client_secret, access_token, refresh_token, expires_at } = req.body;
  
  const stmt = db.prepare(`INSERT OR REPLACE INTO credentials 
    (id, client_id, client_secret, access_token, refresh_token, expires_at) 
    VALUES (1, ?, ?, ?, ?, ?)`);
  
  stmt.run(client_id, client_secret, access_token, refresh_token, expires_at, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
  
  stmt.finalize();
});

app.get('/api/spotify/credentials', (req, res) => {
  db.get('SELECT * FROM credentials WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json({
        client_id: row.client_id,
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at
      });
    } else {
      res.json({ error: 'No credentials found' });
    }
  });
});

app.post('/api/spotify/refresh', async (req, res) => {
  try {
    const { refresh_token, client_id, client_secret } = req.body;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      const expires_at = Date.now() + (data.expires_in * 1000);
      
      const stmt = db.prepare(`UPDATE credentials SET access_token = ?, expires_at = ? WHERE id = 1`);
      stmt.run(data.access_token, expires_at);
      stmt.finalize();
      
      res.json({
        access_token: data.access_token,
        expires_at: expires_at
      });
    } else {
      res.status(400).json({ error: 'Failed to refresh token' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Fractal Art Visualizer running at http://localhost:${port}`);
});