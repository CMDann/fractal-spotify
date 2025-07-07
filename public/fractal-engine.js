class FractalEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.imageData = this.ctx.createImageData(this.width, this.height);
        
        this.fractalType = 'mandelbrot';
        this.maxIterations = 100;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.time = 0;
        this.animationSpeed = 1;
        this.isAnimating = true;
        
        this.colors = {
            primary: [255, 0, 0],
            secondary: [0, 0, 255],
            background: [0, 0, 0]
        };
        
        this.juliaC = { real: -0.7, imag: 0.27015 };
        
        this.resize();
        this.render();
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth - 20;
        this.height = container.clientHeight - 20;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.imageData = this.ctx.createImageData(this.width, this.height);
    }
    
    mandelbrot(x, y) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - this.width / 2) / (this.width / 4) / this.zoom + this.offsetX;
        let cy = (y - this.height / 2) / (this.height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            
            if (zx * zx + zy * zy > 4) {
                return i;
            }
        }
        return maxIter;
    }
    
    julia(x, y) {
        const maxIter = this.maxIterations;
        let zx = (x - this.width / 2) / (this.width / 4) / this.zoom;
        let zy = (y - this.height / 2) / (this.height / 4) / this.zoom;
        
        let cx = this.juliaC.real + Math.sin(this.time * 0.01) * 0.3;
        let cy = this.juliaC.imag + Math.cos(this.time * 0.01) * 0.3;
        
        for (let i = 0; i < maxIter; i++) {
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            
            if (zx * zx + zy * zy > 4) {
                return i;
            }
        }
        return maxIter;
    }
    
    burningShip(x, y) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - this.width / 2) / (this.width / 4) / this.zoom + this.offsetX;
        let cy = (y - this.height / 2) / (this.height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            let tmp = zx * zx - zy * zy + cx;
            zy = Math.abs(2 * zx * zy) + cy;
            zx = Math.abs(tmp);
            
            if (zx * zx + zy * zy > 4) {
                return i;
            }
        }
        return maxIter;
    }
    
    sierpinski(x, y) {
        const scale = 300 * this.zoom;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        let px = (x - centerX) / scale + this.offsetX;
        let py = (y - centerY) / scale + this.offsetY;
        
        let iterations = 0;
        const maxIter = this.maxIterations;
        
        while (iterations < maxIter) {
            if (px < 0.5) {
                px = 2 * px;
                py = 2 * py;
            } else if (py < 0.5) {
                px = 2 * px - 1;
                py = 2 * py;
            } else {
                px = 2 * px - 1;
                py = 2 * py - 1;
            }
            
            if (px < 0 || px > 1 || py < 0 || py > 1) {
                return iterations;
            }
            
            iterations++;
        }
        
        return maxIter;
    }
    
    getColor(iterations) {
        if (iterations === this.maxIterations) {
            return this.colors.background;
        }
        
        const t = iterations / this.maxIterations;
        const phase = this.time * 0.01 + t * Math.PI * 2;
        
        const r = Math.floor(
            this.colors.primary[0] * (1 - t) + 
            this.colors.secondary[0] * t + 
            Math.sin(phase) * 50
        );
        const g = Math.floor(
            this.colors.primary[1] * (1 - t) + 
            this.colors.secondary[1] * t + 
            Math.sin(phase + Math.PI / 3) * 50
        );
        const b = Math.floor(
            this.colors.primary[2] * (1 - t) + 
            this.colors.secondary[2] * t + 
            Math.sin(phase + 2 * Math.PI / 3) * 50
        );
        
        return [
            Math.max(0, Math.min(255, r)),
            Math.max(0, Math.min(255, g)),
            Math.max(0, Math.min(255, b))
        ];
    }
    
    render() {
        const data = this.imageData.data;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let iterations;
                
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x, y);
                        break;
                    case 'julia':
                        iterations = this.julia(x, y);
                        break;
                    case 'burning-ship':
                        iterations = this.burningShip(x, y);
                        break;
                    case 'sierpinski':
                        iterations = this.sierpinski(x, y);
                        break;
                    default:
                        iterations = this.mandelbrot(x, y);
                }
                
                const color = this.getColor(iterations);
                const index = (y * this.width + x) * 4;
                
                data[index] = color[0];
                data[index + 1] = color[1];
                data[index + 2] = color[2];
                data[index + 3] = 255;
            }
        }
        
        this.ctx.putImageData(this.imageData, 0, 0);
    }
    
    animate() {
        if (this.isAnimating) {
            this.time += this.animationSpeed;
            this.render();
        }
        requestAnimationFrame(() => this.animate());
    }
    
    setFractalType(type) {
        this.fractalType = type;
        this.render();
    }
    
    setColors(primary, secondary, background) {
        this.colors.primary = primary;
        this.colors.secondary = secondary;
        this.colors.background = background;
        this.render();
    }
    
    setZoom(zoom) {
        this.zoom = zoom;
        this.render();
    }
    
    setIterations(iterations) {
        this.maxIterations = iterations;
        this.render();
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
    }
    
    reset() {
        this.time = 0;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.render();
    }
    
    applyMusicData(audioData) {
        if (!audioData) return;
        
        const bass = audioData.slice(0, 60).reduce((a, b) => a + b) / 60;
        const mid = audioData.slice(60, 120).reduce((a, b) => a + b) / 60;
        const treble = audioData.slice(120, 180).reduce((a, b) => a + b) / 60;
        
        this.animationSpeed = 0.5 + (bass / 255) * 2;
        this.zoom = 1 + (mid / 255) * 2;
        
        const colorIntensity = treble / 255;
        this.colors.primary[0] = Math.floor(255 * colorIntensity);
        this.colors.secondary[2] = Math.floor(255 * (1 - colorIntensity));
        
        this.render();
    }
}