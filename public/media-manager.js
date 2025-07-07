class MediaManager {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.audioElement = null;
        this.audioSource = null;
        this.currentSource = 'spotify';
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.5;
        
        this.initializeAudioContext();
        this.setupEventListeners();
    }
    
    initializeAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    setupEventListeners() {
        document.getElementById('audioSource').addEventListener('change', (e) => {
            this.switchAudioSource(e.target.value);
        });
        
        document.getElementById('connectMic').addEventListener('click', () => {
            this.connectMicrophone();
        });
        
        document.getElementById('loadYoutube').addEventListener('click', () => {
            this.loadYouTubeVideo();
        });
        
        document.getElementById('loadLocal').addEventListener('click', () => {
            this.loadLocalFile();
        });
        
        document.getElementById('localFile').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousTrack();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.toggleShuffle();
        });
        
        document.getElementById('repeatBtn').addEventListener('click', () => {
            this.toggleRepeat();
        });
        
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        document.getElementById('progressBar').addEventListener('input', (e) => {
            this.seek(e.target.value / 100);
        });
        
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }
    
    switchAudioSource(source) {
        this.currentSource = source;
        
        document.querySelectorAll('.audio-source-controls').forEach(control => {
            control.style.display = 'none';
        });
        
        const controlId = source + 'Controls';
        const controlElement = document.getElementById(controlId);
        if (controlElement) {
            controlElement.style.display = 'block';
        }
        
        this.stopCurrentAudio();
        this.hideAlbumCover();
    }
    
    async connectMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioSource.connect(this.analyser);
            
            this.startAudioAnalysis();
            this.updateTrackInfo('Microphone Input', 'Live Audio', '');
            
            document.getElementById('connectMic').textContent = 'Connected!';
            document.getElementById('connectMic').disabled = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check permissions.');
        }
    }
    
    async loadYouTubeVideo() {
        const url = document.getElementById('youtubeUrl').value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }
        
        try {
            const videoId = this.extractYouTubeId(url);
            if (!videoId) {
                alert('Invalid YouTube URL');
                return;
            }
            
            this.createYouTubePlayer(videoId);
        } catch (error) {
            console.error('Error loading YouTube video:', error);
            alert('Error loading YouTube video');
        }
    }
    
    extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
    
    createYouTubePlayer(videoId) {
        if (!window.YT) {
            this.loadYouTubeAPI(() => {
                this.initializeYouTubePlayer(videoId);
            });
        } else {
            this.initializeYouTubePlayer(videoId);
        }
    }
    
    loadYouTubeAPI(callback) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onload = callback;
        document.head.appendChild(script);
        
        window.onYouTubeIframeAPIReady = callback;
    }
    
    initializeYouTubePlayer(videoId) {
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        playerDiv.style.display = 'none';
        document.body.appendChild(playerDiv);
        
        this.youtubePlayer = new YT.Player('youtube-player', {
            height: '1',
            width: '1',
            videoId: videoId,
            events: {
                'onReady': (event) => {
                    this.setupYouTubeAudio(event.target);
                },
                'onStateChange': (event) => {
                    this.handleYouTubeStateChange(event);
                }
            }
        });
    }
    
    setupYouTubeAudio(player) {
        this.youtubePlayer = player;
        
        setTimeout(() => {
            try {
                const iframe = player.getIframe();
                this.audioSource = this.audioContext.createMediaElementSource(iframe);
                this.audioSource.connect(this.analyser);
                this.startAudioAnalysis();
                
                const videoData = player.getVideoData();
                this.updateTrackInfo(videoData.title, videoData.author, 'YouTube');
                this.showAlbumCover('', videoData.title, videoData.author, 'YouTube');
            } catch (error) {
                console.error('Error setting up YouTube audio:', error);
            }
        }, 1000);
    }
    
    handleYouTubeStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            document.getElementById('playPauseBtn').textContent = '⏸';
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶';
        }
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadAudioFile(file);
        }
    }
    
    loadLocalFile() {
        document.getElementById('localFile').click();
    }
    
    loadAudioFile(file) {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(file);
        this.audioElement.crossOrigin = 'anonymous';
        
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.updateTimeDisplay();
        });
        
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.updateTimeDisplay();
            this.updateProgressBar();
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            document.getElementById('playPauseBtn').textContent = '▶';
        });
        
        try {
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.audioSource.connect(this.analyser);
            this.audioSource.connect(this.audioContext.destination);
            
            this.startAudioAnalysis();
            this.updateTrackInfo(file.name, 'Local File', '');
            this.showAlbumCover('', file.name, 'Local File', '');
        } catch (error) {
            console.error('Error setting up audio source:', error);
        }
    }
    
    togglePlayPause() {
        if (this.currentSource === 'youtube' && this.youtubePlayer) {
            if (this.isPlaying) {
                this.youtubePlayer.pauseVideo();
            } else {
                this.youtubePlayer.playVideo();
            }
        } else if (this.audioElement) {
            if (this.isPlaying) {
                this.audioElement.pause();
                this.isPlaying = false;
                document.getElementById('playPauseBtn').textContent = '▶';
            } else {
                this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('playPauseBtn').textContent = '⏸';
            }
        } else if (this.currentSource === 'spotify') {
            window.spotifyIntegration?.togglePlayback();
        }
    }
    
    previousTrack() {
        if (this.currentSource === 'spotify') {
            window.spotifyIntegration?.previousTrack();
        }
    }
    
    nextTrack() {
        if (this.currentSource === 'spotify') {
            window.spotifyIntegration?.nextTrack();
        }
    }
    
    toggleShuffle() {
        console.log('Toggle shuffle');
    }
    
    toggleRepeat() {
        console.log('Toggle repeat');
    }
    
    setVolume(volume) {
        this.volume = volume;
        if (this.audioElement) {
            this.audioElement.volume = volume;
        }
        if (this.youtubePlayer) {
            this.youtubePlayer.setVolume(volume * 100);
        }
    }
    
    seek(position) {
        if (this.audioElement) {
            this.audioElement.currentTime = position * this.duration;
        }
        if (this.youtubePlayer) {
            const duration = this.youtubePlayer.getDuration();
            this.youtubePlayer.seekTo(position * duration);
        }
    }
    
    updateTimeDisplay() {
        document.getElementById('currentTime').textContent = this.formatTime(this.currentTime);
        document.getElementById('totalTime').textContent = this.formatTime(this.duration);
    }
    
    updateProgressBar() {
        if (this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            document.getElementById('progressBar').value = progress;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    startAudioAnalysis() {
        const analyze = () => {
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                if (window.fractalEngine) {
                    window.fractalEngine.applyMusicData(this.dataArray);
                }
            }
            requestAnimationFrame(analyze);
        };
        analyze();
    }
    
    updateTrackInfo(title, artist, album) {
        const trackInfo = document.getElementById('trackInfo');
        trackInfo.innerHTML = `
            <strong>Now Playing:</strong><br>
            ${title}<br>
            <small>${artist}${album ? ` - ${album}` : ''}</small>
        `;
    }
    
    showAlbumCover(imageUrl, title, artist, album) {
        const albumCover = document.getElementById('albumCover');
        const albumArt = document.getElementById('albumArt');
        const songTitle = document.getElementById('songTitle');
        const artistName = document.getElementById('artistName');
        const albumName = document.getElementById('albumName');
        
        if (imageUrl) {
            albumArt.src = imageUrl;
            albumArt.style.display = 'block';
        } else {
            albumArt.style.display = 'none';
        }
        
        songTitle.textContent = title;
        artistName.textContent = artist;
        albumName.textContent = album;
        
        albumCover.style.display = 'block';
    }
    
    hideAlbumCover() {
        document.getElementById('albumCover').style.display = 'none';
    }
    
    stopCurrentAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        if (this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
        }
        if (this.audioSource) {
            this.audioSource.disconnect();
            this.audioSource = null;
        }
        this.isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶';
    }
    
    toggleFullscreen() {
        const container = document.querySelector('.container');
        if (container.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            document.getElementById('fullscreenBtn').textContent = '⛶';
        } else {
            container.classList.add('fullscreen');
            document.getElementById('fullscreenBtn').textContent = '⛷';
            
            if (window.fractalEngine) {
                setTimeout(() => {
                    window.fractalEngine.resize();
                }, 100);
            }
        }
    }
}