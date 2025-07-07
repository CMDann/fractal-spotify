class SpotifyIntegration {
    constructor() {
        this.accessToken = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.currentTrack = null;
        this.isConnected = false;
        this.player = null;
        this.deviceId = null;
        
        this.initializeWebPlaybackSDK();
    }
    
    initializeWebPlaybackSDK() {
        if (!window.Spotify) {
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.head.appendChild(script);
            
            window.onSpotifyWebPlaybackSDKReady = () => {
                this.setupWebPlaybackSDK();
            };
        } else {
            this.setupWebPlaybackSDK();
        }
    }
    
    setupWebPlaybackSDK() {
        if (!this.accessToken) return;
        
        this.player = new Spotify.Player({
            name: 'Fractal Art Visualizer',
            getOAuthToken: cb => { cb(this.accessToken); },
            volume: 0.5
        });
        
        this.player.addListener('ready', ({ device_id }) => {
            this.deviceId = device_id;
            console.log('Spotify player ready with device ID:', device_id);
        });
        
        this.player.addListener('not_ready', ({ device_id }) => {
            console.log('Spotify player not ready with device ID:', device_id);
        });
        
        this.player.addListener('player_state_changed', (state) => {
            if (state) {
                this.currentTrack = state.track_window.current_track;
                this.updateTrackDisplay();
            }
        });
        
        this.player.connect();
    }
    
    setAccessToken(token) {
        this.accessToken = token;
        this.isConnected = true;
        
        if (window.Spotify) {
            this.setupWebPlaybackSDK();
        }
        
        this.getCurrentTrack();
        this.startAudioAnalysis();
    }
    
    async getCurrentTrack() {
        if (!this.accessToken) return;
        
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentTrack = data.item;
                this.updateTrackDisplay();
            }
        } catch (error) {
            console.error('Error fetching current track:', error);
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
        } else {
            trackInfo.innerHTML = 'No track playing';
        }
    }
    
    async startAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            this.analyzeAudio();
        } catch (error) {
            console.error('Error starting audio analysis:', error);
            this.simulateAudioData();
        }
    }
    
    analyzeAudio() {
        if (!this.analyser || !this.dataArray) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        if (window.fractalEngine) {
            window.fractalEngine.applyMusicData(this.dataArray);
        }
        
        requestAnimationFrame(() => this.analyzeAudio());
    }
    
    simulateAudioData() {
        const simulatedData = new Uint8Array(128);
        const simulate = () => {
            for (let i = 0; i < simulatedData.length; i++) {
                simulatedData[i] = Math.random() * 255;
            }
            
            if (window.fractalEngine) {
                window.fractalEngine.applyMusicData(simulatedData);
            }
            
            setTimeout(simulate, 100);
        };
        simulate();
    }
    
    async getAudioFeatures() {
        if (!this.accessToken || !this.currentTrack) return null;
        
        try {
            const response = await fetch(`https://api.spotify.com/v1/audio-features/${this.currentTrack.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching audio features:', error);
        }
        
        return null;
    }
    
    async playTrack(trackUri) {
        if (!this.accessToken || !this.deviceId) return;
        
        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [trackUri]
                })
            });
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }
    
    async pauseTrack() {
        if (!this.accessToken) return;
        
        try {
            await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error pausing track:', error);
        }
    }
    
    async resumeTrack() {
        if (!this.accessToken) return;
        
        try {
            await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
        } catch (error) {
            console.error('Error resuming track:', error);
        }
    }
    
    disconnect() {
        this.isConnected = false;
        this.accessToken = null;
        this.currentTrack = null;
        
        if (this.player) {
            this.player.disconnect();
            this.player = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        document.getElementById('trackInfo').innerHTML = 'Disconnected from Spotify';
    }
}