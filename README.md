![Screenshot](ss.png)

# Fractal Art Visualizer

A real-time fractal art generator with Spotify integration, built with HTML5 Canvas and JavaScript.

## Features

- **Multiple Fractal Types**: Mandelbrot, Julia Set, Burning Ship, Sierpinski Triangle
- **Real-time Color Control**: Adjust primary, secondary, and background colors
- **Spotify Integration**: Music-reactive visualizations using Spotify Web API
- **Recording Capabilities**: 
  - Screenshot capture (PNG)
  - GIF recording
  - Video recording (WebM)
- **Interactive Controls**: 
  - Click to zoom/pan
  - Mouse wheel zoom
  - Animation speed control
  - Iteration count adjustment

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fractal-art-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Spotify Integration

To enable Spotify integration:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app and get your access token
3. Paste the token into the "Spotify Access Token" field
4. Click "Connect Spotify"

Note: You'll need to set up proper OAuth flow for production use.

## Usage

### Controls

- **Fractal Type**: Select from available fractal algorithms
- **Colors**: Use color pickers to customize the visualization
- **Animation Speed**: Control how fast the fractal evolves
- **Zoom**: Adjust the zoom level (or use mouse wheel)
- **Iterations**: Higher values = more detail (but slower rendering)

### Interaction

- **Click**: Center the fractal on the clicked point
- **Mouse Wheel**: Zoom in/out
- **Play/Pause**: Toggle animation
- **Reset**: Return to default view

### Recording

- **Take Photo**: Capture current frame as PNG
- **Record GIF**: Record 5-second animation as GIF
- **Record Video**: Record video in WebM format

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses HTML5 Canvas for rendering
- Web Audio API for music analysis
- MediaRecorder API for video capture
- GIF.js library for GIF generation

## License

MIT License - see LICENSE file for details