import * as THREE from "three";
import Experience from "./Experience.js";

export default class Renderer {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.camera = this.experience.camera;

        this.setRenderer();
    }

    setRenderer() {
        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                logarithmicDepthBuffer: true, // Get rid of z-fighting
                powerPreference: "high-performance", // Use dedicated GPU if available
            });
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.CineonToneMapping;
            this.renderer.toneMappingExposure = 1.5;
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(this.sizes.pixelRatio);
            
            // Handle WebGL context loss events (only add listeners once)
            if (!this.contextLossHandled) {
                this.canvas.addEventListener('webglcontextlost', (event) => {
                    console.warn('[Renderer] WebGL context lost. Attempting to restore...');
                    event.preventDefault(); // Prevent default behavior
                });
                
                this.canvas.addEventListener('webglcontextrestored', () => {
                    console.log('[Renderer] WebGL context restored. Reinitializing renderer...');
                    // Reinitialize renderer settings after context is restored
                    if (this.renderer) {
                        this.renderer.setSize(this.sizes.width, this.sizes.height);
                        this.renderer.setPixelRatio(this.sizes.pixelRatio);
                    }
                });
                this.contextLossHandled = true;
            }
        } catch (error) {
            console.error('[Renderer] Error creating WebGL renderer:', error);
            // Show user-friendly error message
            alert('WebGL tidak dapat diinisialisasi. Silakan refresh halaman atau cek pengaturan browser Anda.');
            throw error;
        }
    }

    onResize() {
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(this.sizes.pixelRatio);
    }

    update() {
        this.renderer.render(this.scene, this.camera.perspectiveCamera);
    }
}
