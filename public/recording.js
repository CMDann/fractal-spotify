class RecordingManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.gifRecorder = null;
        this.gifFrames = [];
        this.gifWorker = null;
        
        this.loadGifJs();
    }
    
    loadGifJs() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.min.js';
        script.onload = () => {
            console.log('GIF.js loaded');
        };
        document.head.appendChild(script);
    }
    
    takePhoto() {
        try {
            const link = document.createElement('a');
            link.download = `fractal-art-${Date.now()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
            
            this.updateStatus('Photo saved!');
        } catch (error) {
            console.error('Error taking photo:', error);
            this.updateStatus('Error saving photo');
        }
    }
    
    async startVideoRecording() {
        try {
            this.stream = this.canvas.captureStream(30);
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm'
            });
            
            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.saveVideoRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateStatus('Recording video...', true);
            
            return true;
        } catch (error) {
            console.error('Error starting video recording:', error);
            this.updateStatus('Error starting video recording');
            return false;
        }
    }
    
    stopVideoRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateStatus('Processing video...');
        }
    }
    
    saveVideoRecording() {
        try {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fractal-animation-${Date.now()}.webm`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.updateStatus('Video saved!');
        } catch (error) {
            console.error('Error saving video:', error);
            this.updateStatus('Error saving video');
        }
    }
    
    async startGifRecording() {
        if (!window.GIF) {
            this.updateStatus('GIF library not loaded');
            return false;
        }
        
        try {
            this.gifRecorder = new GIF({
                workers: 2,
                quality: 10,
                width: this.canvas.width,
                height: this.canvas.height
            });
            
            this.gifRecorder.on('finished', (blob) => {
                this.saveGifRecording(blob);
            });
            
            this.gifRecorder.on('progress', (progress) => {
                this.updateStatus(`Processing GIF: ${Math.round(progress * 100)}%`);
            });
            
            this.isRecording = true;
            this.gifFrames = [];
            this.updateStatus('Recording GIF...', true);
            
            this.captureGifFrame();
            return true;
        } catch (error) {
            console.error('Error starting GIF recording:', error);
            this.updateStatus('Error starting GIF recording');
            return false;
        }
    }
    
    captureGifFrame() {
        if (!this.isRecording || !this.gifRecorder) return;
        
        try {
            const imageData = this.canvas.getContext('2d').getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.gifRecorder.addFrame(imageData, { delay: 100 });
            this.gifFrames.push(Date.now());
            
            if (this.gifFrames.length < 50) {
                setTimeout(() => this.captureGifFrame(), 100);
            } else {
                this.stopGifRecording();
            }
        } catch (error) {
            console.error('Error capturing GIF frame:', error);
            this.stopGifRecording();
        }
    }
    
    stopGifRecording() {
        if (this.gifRecorder && this.isRecording) {
            this.isRecording = false;
            this.updateStatus('Processing GIF...');
            this.gifRecorder.render();
        }
    }
    
    saveGifRecording(blob) {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fractal-animation-${Date.now()}.gif`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.updateStatus('GIF saved!');
        } catch (error) {
            console.error('Error saving GIF:', error);
            this.updateStatus('Error saving GIF');
        }
    }
    
    updateStatus(message, isRecording = false) {
        const statusElement = document.getElementById('recordingStatus');
        statusElement.textContent = message;
        statusElement.className = isRecording ? 'recording' : '';
        
        if (!isRecording) {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = '';
            }, 3000);
        }
    }
    
    isCurrentlyRecording() {
        return this.isRecording;
    }
    
    stopAllRecording() {
        if (this.isRecording) {
            this.stopVideoRecording();
            this.stopGifRecording();
        }
    }
}