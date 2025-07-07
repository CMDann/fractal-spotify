class FractalApp {
    constructor() {
        this.canvas = document.getElementById('fractalCanvas');
        this.fractalEngine = null;
        this.spotifyIntegration = null;
        this.recordingManager = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.initializeComponents();
        this.setupEventListeners();
        this.startAnimation();
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    setupCanvas() {
        const container = document.querySelector('.canvas-container');
        this.canvas.width = container.clientWidth - 20;
        this.canvas.height = container.clientHeight - 20;
    }
    
    initializeComponents() {
        this.fractalEngine = new FractalEngine(this.canvas);
        this.spotifyIntegration = new SpotifyIntegration();
        this.recordingManager = new RecordingManager(this.canvas);
        
        window.fractalEngine = this.fractalEngine;
        window.spotifyIntegration = this.spotifyIntegration;
    }
    
    setupEventListeners() {
        document.getElementById('fractalType').addEventListener('change', (e) => {
            this.fractalEngine.setFractalType(e.target.value);
        });
        
        document.getElementById('primaryColor').addEventListener('input', (e) => {
            this.updateColors();
        });
        
        document.getElementById('secondaryColor').addEventListener('input', (e) => {
            this.updateColors();
        });
        
        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            this.updateColors();
        });
        
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.fractalEngine.setAnimationSpeed(parseFloat(e.target.value));
            document.getElementById('speedValue').textContent = e.target.value;
        });
        
        document.getElementById('zoomLevel').addEventListener('input', (e) => {
            this.fractalEngine.setZoom(parseFloat(e.target.value));
            document.getElementById('zoomValue').textContent = e.target.value;
        });
        
        document.getElementById('iterations').addEventListener('input', (e) => {
            this.fractalEngine.setIterations(parseInt(e.target.value));
            document.getElementById('iterationsValue').textContent = e.target.value;
        });
        
        document.getElementById('saveCredentials').addEventListener('click', () => {
            this.spotifyIntegration.saveCredentials();
        });
        
        document.getElementById('connectSpotify').addEventListener('click', () => {
            this.spotifyIntegration.connect();
        });
        
        // Media control event listeners
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.spotifyIntegration.togglePlayback();
        });
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.spotifyIntegration.previousTrack();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.spotifyIntegration.nextTrack();
        });
        
        document.getElementById('progressBar').addEventListener('input', (e) => {
            const position = e.target.value / 100;
            this.spotifyIntegration.seek(position);
        });
        
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.spotifyIntegration.setVolume(volume);
        });
        
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.getElementById('takePhoto').addEventListener('click', () => {
            this.recordingManager.takePhoto();
        });
        
        document.getElementById('recordGif').addEventListener('click', () => {
            this.toggleGifRecording();
        });
        
        document.getElementById('recordVideo').addEventListener('click', () => {
            this.toggleVideoRecording();
        });
        
        document.getElementById('playPause').addEventListener('click', () => {
            this.fractalEngine.toggleAnimation();
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.fractalEngine.reset();
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            this.handleCanvasWheel(e);
        });
    }
    
    updateColors() {
        const primary = this.hexToRgb(document.getElementById('primaryColor').value);
        const secondary = this.hexToRgb(document.getElementById('secondaryColor').value);
        const background = this.hexToRgb(document.getElementById('backgroundColor').value);
        
        this.fractalEngine.setColors(primary, secondary, background);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }
    
    
    toggleGifRecording() {
        const button = document.getElementById('recordGif');
        if (this.recordingManager.isCurrentlyRecording()) {
            this.recordingManager.stopGifRecording();
            button.textContent = 'Record GIF';
        } else {
            if (this.recordingManager.startGifRecording()) {
                button.textContent = 'Stop GIF';
            }
        }
    }
    
    toggleVideoRecording() {
        const button = document.getElementById('recordVideo');
        if (this.recordingManager.isCurrentlyRecording()) {
            this.recordingManager.stopVideoRecording();
            button.textContent = 'Record Video';
        } else {
            if (this.recordingManager.startVideoRecording()) {
                button.textContent = 'Stop Video';
            }
        }
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = (x - this.canvas.width / 2) / (this.canvas.width / 4) / this.fractalEngine.zoom;
        const centerY = (y - this.canvas.height / 2) / (this.canvas.height / 4) / this.fractalEngine.zoom;
        
        this.fractalEngine.offsetX = centerX;
        this.fractalEngine.offsetY = centerY;
        this.fractalEngine.render();
    }
    
    handleCanvasWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = this.fractalEngine.zoom * zoomFactor;
        
        this.fractalEngine.setZoom(Math.max(0.1, Math.min(10, newZoom)));
        document.getElementById('zoomLevel').value = this.fractalEngine.zoom;
        document.getElementById('zoomValue').textContent = this.fractalEngine.zoom.toFixed(1);
    }
    
    handleResize() {
        this.setupCanvas();
        this.fractalEngine.resize();
    }
    
    startAnimation() {
        this.fractalEngine.animate();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new FractalApp();
});