class SpotifyIntegration {
    constructor() {
        this.credentials = {
            clientId: null,
            clientSecret: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null
        };
        this.currentTrack = null;
        this.audioFeatures = null;
        this.isConnected = false;
        this.analysisData = null;
        this.updateInterval = null;
        
        this.loadCredentials();
        this.setupOAuthHandlers();
        this.checkForAuthCallback();
    }
    
    async loadCredentials() {
        const saved = localStorage.getItem('spotify_credentials');
        if (saved) {
            this.credentials = JSON.parse(saved);
            this.populateFields();
        }
        
        try {
            const response = await fetch('/api/spotify/credentials');
            const data = await response.json();
            if (data.access_token) {
                this.credentials.accessToken = data.access_token;
                this.credentials.refreshToken = data.refresh_token;
                this.credentials.expiresAt = data.expires_at;
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    }
    
    populateFields() {
        if (this.credentials.clientId) {
            document.getElementById('clientId').value = this.credentials.clientId;
        }
        if (this.credentials.accessToken) {
            document.getElementById('accessToken').value = this.credentials.accessToken;
        }
        if (this.credentials.refreshToken) {
            document.getElementById('refreshToken').value = this.credentials.refreshToken;
        }
        
        this.updateUIState();
    }
    
    updateUIState() {
        const hasCredentials = this.credentials.clientId && this.credentials.clientSecret;
        const hasTokens = this.credentials.accessToken && this.credentials.refreshToken;
        
        document.getElementById('authorizeSpotify').style.display = hasCredentials ? 'block' : 'none';
        document.getElementById('connectSpotify').style.display = hasTokens ? 'block' : 'none';
        
        if (hasTokens) {
            document.getElementById('authorizeSpotify').textContent = 'Re-authorize Spotify';
        }
    }
    
    setupOAuthHandlers() {
        document.getElementById('authorizeSpotify').addEventListener('click', () => {
            this.startOAuthFlow();
        });
        
        document.getElementById('toggleManual').addEventListener('click', () => {
            this.toggleManualEntry();
        });
        
        document.getElementById('clientId').addEventListener('input', () => {
            this.credentials.clientId = document.getElementById('clientId').value;
            this.updateUIState();
        });
        
        document.getElementById('clientSecret').addEventListener('input', () => {
            this.credentials.clientSecret = document.getElementById('clientSecret').value;
            this.updateUIState();
        });
    }
    
    toggleManualEntry() {
        const manualTokens = document.getElementById('manualTokens');
        const saveBtn = document.getElementById('saveCredentials');
        const toggleBtn = document.getElementById('toggleManual');
        
        if (manualTokens.style.display === 'none') {
            manualTokens.style.display = 'block';
            saveBtn.style.display = 'block';
            toggleBtn.textContent = 'Hide Manual Entry';
        } else {
            manualTokens.style.display = 'none';
            saveBtn.style.display = 'none';
            toggleBtn.textContent = 'Manual Token Entry';
        }
    }
    
    async startOAuthFlow() {
        const clientId = document.getElementById('clientId').value.trim();
        const clientSecret = document.getElementById('clientSecret').value.trim();
        
        if (!clientId || !clientSecret) {
            alert('Please enter both Client ID and Client Secret');
            return;
        }
        
        this.credentials.clientId = clientId;
        this.credentials.clientSecret = clientSecret;
        localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
        
        try {
            // Use HTTPS if available, otherwise HTTP
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = protocol === 'https:' ? '3443' : '3000';
            const redirectUri = `${protocol}//${hostname}:${port}/callback`;
            
            const response = await fetch('/api/spotify/auth-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: clientId,
                    redirect_uri: redirectUri
                })
            });
            
            const data = await response.json();
            
            if (data.auth_url) {
                localStorage.setItem('spotify_auth_state', data.state);
                window.location.href = data.auth_url;
            } else {
                alert('Error generating authorization URL');
            }
        } catch (error) {
            console.error('Error starting OAuth flow:', error);
            alert('Error starting authorization process');
        }
    }
    
    checkForAuthCallback() {
        // Check if we just returned from authorization
        const wasAuthorizing = localStorage.getItem('spotify_auth_state');
        if (wasAuthorizing && !window.location.search.includes('code')) {
            // We might have just returned from callback page
            setTimeout(() => {
                this.loadCredentials();
            }, 500);
        }
    }
    
    clearUrl() {
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
    }
    
    async exchangeCodeForTokens(code) {
        try {
            // Use HTTPS if available, otherwise HTTP
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = protocol === 'https:' ? '3443' : '3000';
            const redirectUri = `${protocol}//${hostname}:${port}/callback`;
            
            const response = await fetch('/api/spotify/exchange-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    client_id: this.credentials.clientId,
                    client_secret: this.credentials.clientSecret,
                    redirect_uri: redirectUri
                })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                this.credentials.accessToken = data.access_token;
                this.credentials.refreshToken = data.refresh_token;
                this.credentials.expiresAt = data.expires_at;
                
                localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
                localStorage.removeItem('spotify_auth_state');
                
                this.populateFields();
                alert('Spotify authorization successful! You can now connect.');
            } else {
                console.error('Token exchange error:', data);
                alert('Error exchanging authorization code for tokens');
            }
        } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            alert('Error completing authorization');
        }
    }
    
    async saveCredentials() {
        this.credentials.clientId = document.getElementById('clientId').value;
        this.credentials.clientSecret = document.getElementById('clientSecret').value;
        this.credentials.accessToken = document.getElementById('accessToken').value;
        this.credentials.refreshToken = document.getElementById('refreshToken').value;
        this.credentials.expiresAt = Date.now() + (3600 * 1000);
        
        localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
        
        try {
            await fetch('/api/spotify/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.credentials)
            });
            
            this.updateUIState();
            alert('Credentials saved successfully!');
        } catch (error) {
            console.error('Error saving credentials:', error);
            alert('Error saving credentials');
        }
    }
    
    async connect() {
        if (!this.credentials.accessToken) {
            alert('Please provide access token');
            return;
        }
        
        if (this.credentials.expiresAt && Date.now() > this.credentials.expiresAt) {
            await this.refreshToken();
        }
        
        this.isConnected = true;
        this.startPolling();
        
        document.getElementById('connectSpotify').textContent = 'Connected!';
        document.getElementById('connectSpotify').disabled = true;
    }
    
    async refreshToken() {
        if (!this.credentials.refreshToken) return;
        
        try {
            const response = await fetch('/api/spotify/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.credentials.refreshToken,
                    client_id: this.credentials.clientId,
                    client_secret: this.credentials.clientSecret
                })
            });
            
            const data = await response.json();
            if (data.access_token) {
                this.credentials.accessToken = data.access_token;
                this.credentials.expiresAt = data.expires_at;
                localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
        }
    }
    
    startPolling() {
        this.updateInterval = setInterval(() => {
            this.getCurrentTrack();
            this.getAudioAnalysis();
        }, 1000);
    }
    
    async getCurrentTrack() {
        if (!this.credentials.accessToken) return;
        
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
            
            if (response.ok && response.status !== 204) {
                const data = await response.json();
                if (data.item && data.item.id !== this.currentTrack?.id) {
                    this.currentTrack = data.item;
                    this.updateTrackDisplay();
                    this.getAudioFeatures();
                }
            }
        } catch (error) {
            console.error('Error fetching current track:', error);
        }
    }
    
    async getAudioFeatures() {
        if (!this.credentials.accessToken || !this.currentTrack) return;
        
        try {
            const response = await fetch(`https://api.spotify.com/v1/audio-features/${this.currentTrack.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
            
            if (response.ok) {
                this.audioFeatures = await response.json();
            }
        } catch (error) {
            console.error('Error fetching audio features:', error);
        }
    }
    
    async getAudioAnalysis() {
        if (!this.credentials.accessToken || !this.currentTrack) return;
        
        try {
            const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${this.currentTrack.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
            
            if (response.ok) {
                this.analysisData = await response.json();
                this.processAudioData();
            }
        } catch (error) {
            console.error('Error fetching audio analysis:', error);
        }
    }
    
    processAudioData() {
        if (!this.analysisData || !this.audioFeatures) return;
        
        const currentTime = Date.now();
        const trackStartTime = currentTime - (this.currentTrack.progress_ms || 0);
        const relativeTime = (currentTime - trackStartTime) / 1000;
        
        const segments = this.analysisData.segments || [];
        const currentSegment = segments.find(seg => 
            relativeTime >= seg.start && relativeTime < seg.start + seg.duration
        );
        
        if (currentSegment && window.fractalEngine) {
            const intensity = Math.max(
                currentSegment.loudness_max || 0,
                currentSegment.loudness_start || 0
            );
            
            const normalizedIntensity = Math.max(0, Math.min(1, (intensity + 60) / 60));
            
            const bassData = currentSegment.pitches ? currentSegment.pitches.slice(0, 4) : [0.5, 0.5, 0.5, 0.5];
            const midData = currentSegment.pitches ? currentSegment.pitches.slice(4, 8) : [0.5, 0.5, 0.5, 0.5];
            const trebleData = currentSegment.pitches ? currentSegment.pitches.slice(8, 12) : [0.5, 0.5, 0.5, 0.5];
            
            const audioData = {
                energy: this.audioFeatures.energy,
                valence: this.audioFeatures.valence,
                tempo: this.audioFeatures.tempo,
                danceability: this.audioFeatures.danceability,
                intensity: normalizedIntensity,
                bass: bassData.reduce((a, b) => a + b) / bassData.length,
                mid: midData.reduce((a, b) => a + b) / midData.length,
                treble: trebleData.reduce((a, b) => a + b) / trebleData.length
            };
            
            window.fractalEngine.applyMusicData(audioData);
        }
    }
    
    updateTrackDisplay() {
        const trackInfo = document.getElementById('trackInfo');
        if (this.currentTrack) {
            trackInfo.innerHTML = `
                <strong>Now Playing:</strong><br>
                ${this.currentTrack.name}<br>
                <small>by ${this.currentTrack.artists.map(a => a.name).join(', ')}</small>
            `;
            
            this.showAlbumCover();
        } else {
            trackInfo.innerHTML = 'No track playing';
            this.hideAlbumCover();
        }
    }
    
    showAlbumCover() {
        if (!this.currentTrack) return;
        
        const albumCover = document.getElementById('albumCover');
        const albumArt = document.getElementById('albumArt');
        const songTitle = document.getElementById('songTitle');
        const artistName = document.getElementById('artistName');
        const albumName = document.getElementById('albumName');
        
        if (this.currentTrack.album?.images?.length > 0) {
            albumArt.src = this.currentTrack.album.images[0].url;
            albumArt.style.display = 'block';
        } else {
            albumArt.style.display = 'none';
        }
        
        songTitle.textContent = this.currentTrack.name;
        artistName.textContent = this.currentTrack.artists.map(a => a.name).join(', ');
        albumName.textContent = this.currentTrack.album?.name || '';
        
        albumCover.style.display = 'block';
    }
    
    hideAlbumCover() {
        document.getElementById('albumCover').style.display = 'none';
    }
    
    async togglePlayback() {
        if (!this.credentials.accessToken) return;
        
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player', {
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.is_playing) {
                    await this.pauseTrack();
                } else {
                    await this.resumeTrack();
                }
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    }
    
    async previousTrack() {
        if (!this.credentials.accessToken) return;
        
        try {
            await fetch('https://api.spotify.com/v1/me/player/previous', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error going to previous track:', error);
        }
    }
    
    async nextTrack() {
        if (!this.credentials.accessToken) return;
        
        try {
            await fetch('https://api.spotify.com/v1/me/player/next', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error going to next track:', error);
        }
    }
    
    disconnect() {
        this.isConnected = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        document.getElementById('trackInfo').innerHTML = 'Disconnected from Spotify';
        document.getElementById('connectSpotify').textContent = 'Connect Spotify';
        document.getElementById('connectSpotify').disabled = false;
    }
}