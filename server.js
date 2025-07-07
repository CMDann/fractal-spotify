const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const httpsPort = 3443;

// Check if HTTPS mode is requested
const useHttps = process.argv.includes('--https');

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

app.post('/api/spotify/auth-url', (req, res) => {
  try {
    const { client_id, redirect_uri } = req.body;
    
    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-private',
      'streaming'
    ].join(' ');
    
    const state = Math.random().toString(36).substring(2, 15);
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('show_dialog', 'true');
    
    res.json({ 
      auth_url: authUrl.toString(),
      state: state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/spotify/exchange-token', async (req, res) => {
  try {
    const { code, client_id, client_secret, redirect_uri } = req.body;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      const expires_at = Date.now() + (data.expires_in * 1000);
      
      const stmt = db.prepare(`INSERT OR REPLACE INTO credentials 
        (id, client_id, client_secret, access_token, refresh_token, expires_at) 
        VALUES (1, ?, ?, ?, ?, ?)`);
      
      stmt.run(client_id, client_secret, data.access_token, data.refresh_token, expires_at);
      stmt.finalize();
      
      res.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expires_at
      });
    } else {
      res.status(400).json({ error: 'Failed to exchange token', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  // Serve the callback page with the parameters
  res.sendFile(path.join(__dirname, 'public', 'callback.html'));
});

if (useHttps) {
  // HTTPS server setup
  const certsDir = path.join(__dirname, 'certs');
  const keyPath = path.join(certsDir, 'localhost.key');
  const certPath = path.join(certsDir, 'localhost.crt');
  
  // Check if certificates exist
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('❌ SSL certificates not found!');
    console.log('Run: npm run generate-certs');
    console.log('Then: npm run start:https');
    process.exit(1);
  }
  
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  https.createServer(httpsOptions, app).listen(httpsPort, () => {
    console.log(`🔒 Fractal Art Visualizer (HTTPS) running at https://localhost:${httpsPort}`);
    console.log('📌 Use this URL in your Spotify app redirect URI: https://localhost:3443/callback');
    console.log('⚠️  Your browser will show a security warning for self-signed certificates');
    console.log('   Click "Advanced" and "Proceed to localhost" to continue');
  });
  
  // Also start HTTP server for redirect
  app.listen(port, () => {
    console.log(`📱 HTTP server also running at http://localhost:${port} (for development)`);
  });
} else {
  // HTTP server only
  app.listen(port, () => {
    console.log(`Fractal Art Visualizer running at http://localhost:${port}`);
    console.log('💡 For Spotify OAuth, run: npm run start:https');
  });
}