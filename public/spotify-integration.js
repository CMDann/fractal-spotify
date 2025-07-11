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
        this.isPlaying = false;
        this.currentProgress = 0;
        this.currentDuration = 0;
        
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
            this.updateMediaControls();
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
                
                // Update playback state
                this.isPlaying = data.is_playing;
                this.currentProgress = data.progress_ms || 0;
                this.currentDuration = data.item?.duration_ms || 0;
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
        if (!this.audioFeatures) {
            // Use basic audio features to drive visualization
            this.applyBasicVisualization();
            return;
        }
        
        if (this.analysisData && this.currentProgress > 0) {
            // Use detailed analysis when available
            this.applyDetailedVisualization();
        } else {
            // Fallback to audio features only
            this.applyBasicVisualization();
        }
    }
    
    applyBasicVisualization() {
        if (!this.audioFeatures || !window.fractalEngine) return;
        
        // Create visualization data from audio features
        const audioData = {
            energy: this.audioFeatures.energy || 0.5,
            valence: this.audioFeatures.valence || 0.5,
            tempo: this.audioFeatures.tempo || 120,
            danceability: this.audioFeatures.danceability || 0.5,
            acousticness: this.audioFeatures.acousticness || 0.5,
            instrumentalness: this.audioFeatures.instrumentalness || 0.5,
            loudness: Math.max(0, Math.min(1, (this.audioFeatures.loudness + 60) / 60)) || 0.5,
            bass: this.audioFeatures.energy * 0.8,
            mid: this.audioFeatures.valence,
            treble: this.audioFeatures.danceability
        };
        
        window.fractalEngine.applyMusicData(audioData);
    }
    
    applyDetailedVisualization() {
        if (!this.analysisData || !this.audioFeatures || !window.fractalEngine) return;
        
        const relativeTime = this.currentProgress / 1000; // Convert to seconds
        const segments = this.analysisData.segments || [];
        
        // Find current segment
        const currentSegment = segments.find(seg => 
            relativeTime >= seg.start && relativeTime < seg.start + seg.duration
        );
        
        if (currentSegment) {
            const intensity = Math.max(
                currentSegment.loudness_max || 0,
                currentSegment.loudness_start || 0
            );
            
            const normalizedIntensity = Math.max(0, Math.min(1, (intensity + 60) / 60));
            
            // Use pitches for frequency analysis
            const pitches = currentSegment.pitches || new Array(12).fill(0.5);
            const bassData = pitches.slice(0, 4);
            const midData = pitches.slice(4, 8);
            const trebleData = pitches.slice(8, 12);
            
            // Use timbres for spectral characteristics
            const timbres = currentSegment.timbre || new Array(12).fill(0);
            const normalizedTimbres = timbres.map(t => Math.max(0, Math.min(1, (t + 100) / 200)));
            
            const audioData = {
                energy: this.audioFeatures.energy,
                valence: this.audioFeatures.valence,
                tempo: this.audioFeatures.tempo,
                danceability: this.audioFeatures.danceability,
                intensity: normalizedIntensity,
                loudness: normalizedIntensity,
                bass: bassData.reduce((a, b) => a + b) / bassData.length,
                mid: midData.reduce((a, b) => a + b) / midData.length,
                treble: trebleData.reduce((a, b) => a + b) / trebleData.length,
                brightness: normalizedTimbres[1] || 0.5,
                roughness: normalizedTimbres[2] || 0.5,
                spectralCentroid: normalizedTimbres[0] || 0.5
            };
            
            window.fractalEngine.applyMusicData(audioData);
        } else {
            this.applyBasicVisualization();
        }
    }
    
    updateTrackDisplay() {
        if (this.currentTrack) {
            this.showCurrentTrack();
            this.showMediaControls();
        } else {
            this.hideCurrentTrack();
            this.hideMediaControls();
        }
    }
    
    showCurrentTrack() {
        if (!this.currentTrack) {
            // Show placeholder when no track
            document.getElementById('trackArtwork').innerHTML = '🎵';
            document.getElementById('trackName').textContent = 'No track playing';
            document.getElementById('artistName').textContent = 'Connect Spotify to see current track';
            document.getElementById('albumName').textContent = '';
            return;
        }
        
        // Update artwork
        const trackArtwork = document.getElementById('trackArtwork');
        if (this.currentTrack.album?.images?.length > 0) {
            trackArtwork.innerHTML = `<img src="${this.currentTrack.album.images[0].url}" alt="Album Cover">`;
        } else {
            trackArtwork.innerHTML = '🎵';
        }
        
        // Update track details
        document.getElementById('trackName').textContent = this.currentTrack.name;
        document.getElementById('artistName').textContent = this.currentTrack.artists.map(a => a.name).join(', ');
        document.getElementById('albumName').textContent = this.currentTrack.album?.name || '';
    }
    
    showMediaControls() {
        // Controls are always visible now
    }
    
    hideCurrentTrack() {
        // Show placeholder instead of hiding
        document.getElementById('trackArtwork').innerHTML = '🎵';
        document.getElementById('trackName').textContent = 'No track playing';
        document.getElementById('artistName').textContent = 'Connect Spotify to see current track';
        document.getElementById('albumName').textContent = '';
    }
    
    hideMediaControls() {
        // Controls are always visible now
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
    
    updateMediaControls() {
        // Update play/pause button
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
        }
        
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar && this.currentDuration > 0) {
            const progress = (this.currentProgress / this.currentDuration) * 100;
            progressBar.value = progress;
        }
        
        // Update time display
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentProgress / 1000);
        }
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.currentDuration / 1000);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    async seek(position) {
        if (!this.credentials.accessToken || !this.currentDuration) return;
        
        const seekPosition = Math.floor(position * this.currentDuration);
        
        try {
            await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${seekPosition}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }
    
    async setVolume(volume) {
        if (!this.credentials.accessToken) return;
        
        const volumePercent = Math.floor(volume * 100);
        
        try {
            await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error setting volume:', error);
        }
    }
    
    disconnect() {
        this.isConnected = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.hideCurrentTrack();
        document.getElementById('connectSpotify').textContent = 'Connect Spotify';
        document.getElementById('connectSpotify').disabled = false;
    }
}