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
        this.animationSpeed = 3;
        this.isAnimating = true;
        
        this.colors = {
            primary: [255, 0, 0],
            secondary: [0, 0, 255],
            background: [0, 0, 0]
        };
        
        this.juliaC = { real: -0.7, imag: 0.27015 };
        
        this.renderScale = 0.5;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.needsRedraw = true;
        this.lastRenderTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        this.resize();
        this.render();
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth - 20;
        this.height = container.clientHeight - 20;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        const scaledWidth = Math.floor(this.width * this.renderScale);
        const scaledHeight = Math.floor(this.height * this.renderScale);
        
        this.offscreenCanvas.width = scaledWidth;
        this.offscreenCanvas.height = scaledHeight;
        this.imageData = this.offscreenCtx.createImageData(scaledWidth, scaledHeight);
        
        this.needsRedraw = true;
    }
    
    mandelbrot(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    julia(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = (x - width / 2) / (width / 4) / this.zoom;
        let zy = (y - height / 2) / (height / 4) / this.zoom;
        
        let cx = this.juliaC.real + Math.sin(this.time * 0.01) * 0.3;
        let cy = this.juliaC.imag + Math.cos(this.time * 0.01) * 0.3;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    burningShip(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            let tmp = zx * zx - zy * zy + cx;
            zy = Math.abs(2 * zx * zy) + cy;
            zx = Math.abs(tmp);
        }
        return maxIter;
    }
    
    sierpinski(x, y, width, height) {
        const scale = 300 * this.zoom;
        const centerX = width / 2;
        const centerY = height / 2;
        
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
    
    tricorn(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            let tmp = zx * zx - zy * zy + cx;
            zy = -2 * zx * zy + cy; // Note the negative sign
            zx = tmp;
        }
        return maxIter;
    }
    
    multibrot(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        const power = 3 + Math.sin(this.time * 0.05) * 2; // Power varies from 1 to 5
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            // z^power + c
            const r = Math.sqrt(zx * zx + zy * zy);
            const theta = Math.atan2(zy, zx);
            
            const newR = Math.pow(r, power);
            const newTheta = theta * power;
            
            const newZx = newR * Math.cos(newTheta) + cx;
            const newZy = newR * Math.sin(newTheta) + cy;
            
            zx = newZx;
            zy = newZy;
        }
        return maxIter;
    }
    
    phoenix(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let px = 0, py = 0; // Previous values
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        const c = 0.5667 + Math.sin(this.time * 0.08) * 0.1;
        const p = -0.5 + Math.cos(this.time * 0.06) * 0.2;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            const newZx = zx * zx - zy * zy + c + p * px;
            const newZy = 2 * zx * zy + p * py;
            
            px = zx;
            py = zy;
            zx = newZx;
            zy = newZy;
        }
        return maxIter;
    }
    
    newton(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let zy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            // Newton's method for z^3 - 1 = 0
            const zx3 = zx * zx * zx - 3 * zx * zy * zy;
            const zy3 = 3 * zx * zx * zy - zy * zy * zy;
            
            const dzx = 3 * (zx * zx - zy * zy);
            const dzy = 6 * zx * zy;
            
            const denom = dzx * dzx + dzy * dzy;
            if (denom === 0) return i;
            
            const newZx = zx - (zx3 - 1) * dzx / denom;
            const newZy = zy - zy3 * dzx / denom;
            
            if (Math.abs(newZx - zx) + Math.abs(newZy - zy) < 0.001) {
                return i;
            }
            
            zx = newZx;
            zy = newZy;
        }
        return maxIter;
    }
    
    biomorphs(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (Math.abs(zx) > 10 || Math.abs(zy) > 10) {
                return i;
            }
            
            let tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    lyapunov(x, y, width, height) {
        const maxIter = this.maxIterations;
        let sum = 0;
        let r = 2.5 + (x - width / 2) / width + this.offsetX;
        let s = 2.5 + (y - height / 2) / height + this.offsetY;
        
        let val = 0.5;
        const sequence = "AB"; // Lyapunov sequence
        
        for (let i = 0; i < maxIter; i++) {
            const rate = (sequence[i % sequence.length] === 'A') ? r : s;
            val = rate * val * (1 - val);
            
            if (val <= 0 || val >= 1) return 0;
            
            sum += Math.log(Math.abs(rate * (1 - 2 * val)));
        }
        
        const lyap = sum / maxIter;
        return Math.floor((lyap + 2) * 50); // Normalize for visualization
    }
    
    magnet(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            // Magnet fractal: ((z^2 + c - 1) / (2z + c - 2))^2
            const z2x = zx * zx - zy * zy;
            const z2y = 2 * zx * zy;
            
            const numx = z2x + cx - 1;
            const numy = z2y + cy;
            
            const denx = 2 * zx + cx - 2;
            const deny = 2 * zy + cy;
            
            const denom = denx * denx + deny * deny;
            if (denom === 0) return i;
            
            const fracx = (numx * denx + numy * deny) / denom;
            const fracy = (numy * denx - numx * deny) / denom;
            
            zx = fracx * fracx - fracy * fracy;
            zy = 2 * fracx * fracy;
            
            if (zx * zx + zy * zy > 4) {
                return i;
            }
        }
        return maxIter;
    }
    
    celtic(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            let tmp = Math.abs(zx * zx - zy * zy) + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    heart(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (width / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            // Heart-shaped modification
            let tmp = zx * zx - zy * zy + cx;
            zy = Math.abs(2 * zx * zy) + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    spider(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        let sx = cx, sy = cy; // Spider point
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            let tmp = zx * zx - zy * zy + sx;
            zy = 2 * zx * zy + sy;
            zx = tmp;
            
            // Update spider point
            sx = (sx + cx) / 2;
            sy = (sy + cy) / 2;
        }
        return maxIter;
    }
    
    fishEye(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            // Fish eye transformation
            const r = Math.sqrt(zx * zx + zy * zy);
            const theta = Math.atan2(zy, zx);
            
            const newR = Math.sin(r);
            const newZx = newR * Math.cos(theta);
            const newZy = newR * Math.sin(theta);
            
            let tmp = newZx * newZx - newZy * newZy + cx;
            zy = 2 * newZx * newZy + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    duck(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = 0, zy = 0;
        let cx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let cy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            if (zx * zx + zy * zy > 4) {
                return i;
            }
            
            // Duck fractal with time-varying parameter
            const param = Math.sin(this.time * 0.04) * 0.5;
            let tmp = zx * zx - zy * zy * (1 + param) + cx;
            zy = 2 * zx * zy * (1 - param) + cy;
            zx = tmp;
        }
        return maxIter;
    }
    
    cosmic(x, y, width, height) {
        const maxIter = this.maxIterations;
        let zx = (x - width / 2) / (width / 4) / this.zoom + this.offsetX;
        let zy = (y - height / 2) / (height / 4) / this.zoom + this.offsetY;
        
        for (let i = 0; i < maxIter; i++) {
            // Cosmic web pattern with sine waves
            const newZx = Math.sin(zx) * Math.cosh(zy) + Math.sin(this.time * 0.01);
            const newZy = Math.cos(zx) * Math.sinh(zy) + Math.cos(this.time * 0.01);
            
            if (newZx * newZx + newZy * newZy > 100) {
                return i;
            }
            
            zx = newZx;
            zy = newZy;
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
        if (!this.needsRedraw) return;
        
        const data = this.imageData.data;
        const scaledWidth = this.offscreenCanvas.width;
        const scaledHeight = this.offscreenCanvas.height;
        
        for (let y = 0; y < scaledHeight; y++) {
            for (let x = 0; x < scaledWidth; x++) {
                let iterations;
                
                switch (this.fractalType) {
                    case 'mandelbrot':
                        iterations = this.mandelbrot(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'julia':
                        iterations = this.julia(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'burning-ship':
                        iterations = this.burningShip(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'sierpinski':
                        iterations = this.sierpinski(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'tricorn':
                        iterations = this.tricorn(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'multibrot':
                        iterations = this.multibrot(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'phoenix':
                        iterations = this.phoenix(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'newton':
                        iterations = this.newton(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'biomorphs':
                        iterations = this.biomorphs(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'lyapunov':
                        iterations = this.lyapunov(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'magnet':
                        iterations = this.magnet(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'celtic':
                        iterations = this.celtic(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'heart':
                        iterations = this.heart(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'spider':
                        iterations = this.spider(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'fish-eye':
                        iterations = this.fishEye(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'duck':
                        iterations = this.duck(x, y, scaledWidth, scaledHeight);
                        break;
                    case 'cosmic':
                        iterations = this.cosmic(x, y, scaledWidth, scaledHeight);
                        break;
                    default:
                        iterations = this.mandelbrot(x, y, scaledWidth, scaledHeight);
                }
                
                const color = this.getColor(iterations);
                const index = (y * scaledWidth + x) * 4;
                
                data[index] = color[0];
                data[index + 1] = color[1];
                data[index + 2] = color[2];
                data[index + 3] = 255;
            }
        }
        
        this.offscreenCtx.putImageData(this.imageData, 0, 0);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
        this.needsRedraw = false;
    }
    
    animate() {
        const now = performance.now();
        if (now - this.lastRenderTime < this.frameTime) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        if (this.isAnimating) {
            this.time += this.animationSpeed;
            this.needsRedraw = true;
        }
        
        this.render();
        this.lastRenderTime = now;
        requestAnimationFrame(() => this.animate());
    }
    
    setFractalType(type) {
        this.fractalType = type;
        this.needsRedraw = true;
    }
    
    setColors(primary, secondary, background) {
        this.colors.primary = primary;
        this.colors.secondary = secondary;
        this.colors.background = background;
        this.needsRedraw = true;
    }
    
    setZoom(zoom) {
        this.zoom = zoom;
        this.needsRedraw = true;
    }
    
    setIterations(iterations) {
        this.maxIterations = iterations;
        this.needsRedraw = true;
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
        this.needsRedraw = true;
    }
    
    applyMusicData(audioData) {
        if (!audioData) return;
        
        // Spotify audio features integration
        if (typeof audioData.energy !== 'undefined') {
            // Animation speed based on energy and tempo
            const tempoFactor = (audioData.tempo || 120) / 120; // Normalize around 120 BPM
            this.animationSpeed = 0.3 + (audioData.energy * 2) + (tempoFactor * 0.5);
            
            // Color mapping based on audio characteristics
            const bassIntensity = audioData.bass || 0.5;
            const midIntensity = audioData.mid || 0.5;
            const trebleIntensity = audioData.treble || 0.5;
            
            // Use valence for color warmth (happy = warm colors, sad = cool colors)
            const valence = audioData.valence || 0.5;
            
            // Red channel: influenced by treble and valence
            this.colors.primary[0] = Math.floor(255 * (trebleIntensity * 0.7 + valence * 0.3));
            
            // Green channel: influenced by mid frequencies and energy
            this.colors.primary[1] = Math.floor(255 * (midIntensity * 0.8 + audioData.energy * 0.2));
            
            // Blue channel: influenced by bass and inverse valence (sadness)
            this.colors.primary[2] = Math.floor(255 * (bassIntensity * 0.7 + (1 - valence) * 0.3));
            
            // Secondary color based on complementary characteristics
            this.colors.secondary[0] = Math.floor(255 * (1 - trebleIntensity) * 0.8);
            this.colors.secondary[1] = Math.floor(255 * (audioData.acousticness || 0.5));
            this.colors.secondary[2] = Math.floor(255 * bassIntensity);
            
            // Julia set parameters influenced by musical characteristics
            this.juliaC.real = -0.7 + (valence - 0.5) * 0.8;
            this.juliaC.imag = 0.27015 + (audioData.danceability - 0.5) * 0.6;
            
            // Zoom influenced by loudness/intensity
            if (audioData.loudness || audioData.intensity) {
                const intensityFactor = audioData.loudness || audioData.intensity || 0.5;
                this.zoom = 1 + intensityFactor * 0.5;
            }
            
            // Iteration count influenced by instrumentalness and acousticness
            if (audioData.instrumentalness !== undefined) {
                const complexity = (audioData.instrumentalness + (1 - audioData.acousticness || 0)) / 2;
                this.maxIterations = Math.floor(80 + complexity * 120); // 80-200 range
            }
            
            this.needsRedraw = true;
        } else {
            // Fallback for raw audio data (array format)
            const bass = audioData.slice(0, 60).reduce((a, b) => a + b) / 60;
            const mid = audioData.slice(60, 120).reduce((a, b) => a + b) / 60;
            const treble = audioData.slice(120, 180).reduce((a, b) => a + b) / 60;
            
            this.animationSpeed = 0.5 + (bass / 255) * 2;
            
            const colorIntensity = treble / 255;
            this.colors.primary[0] = Math.floor(255 * colorIntensity);
            this.colors.secondary[2] = Math.floor(255 * (1 - colorIntensity));
            
            this.needsRedraw = true;
        }
    }
}