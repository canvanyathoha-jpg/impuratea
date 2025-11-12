import * as THREE from "three";
import Experience from "./Experience.js";

export default class Renderer {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.camera = this.experience.camera;
        
        // Get performance manager if available
        this.performanceManager = this.experience.performanceManager;

        this.setRenderer();
        
        // Listen for quality changes
        if (this.performanceManager) {
            this.performanceManager.on('qualityChanged', (quality, settings) => {
                this.applyQualitySettings(settings);
            });
        }
    }

    setRenderer() {
        try {
            // Get quality settings from PerformanceManager or use defaults
            const qualitySettings = this.performanceManager 
                ? this.performanceManager.getQualitySettings()
                : { antialias: false, pixelRatio: 1.0 };
            const allowShadows = this.performanceManager
                ? this.performanceManager.shouldEnableDynamicShadows()
                : false;
            
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: qualitySettings.antialias || false, // OPTIMIZATION: Disable antialias for better performance
                logarithmicDepthBuffer: true, // Get rid of z-fighting
                powerPreference: "high-performance", // Use dedicated GPU if available
            });
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.CineonToneMapping;
            this.renderer.toneMappingExposure = 1.5;
            
            // OPTIMIZATION: Disable shadows by default for better performance
            this.renderer.shadowMap.enabled = !!allowShadows;
            
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            
            // Use quality-based pixel ratio
            const pixelRatio = qualitySettings.pixelRatio || this.sizes.pixelRatio;
            this.renderer.setPixelRatio(pixelRatio);

            // Expose renderer instance for scenes that require direct access
            this.instance = this.renderer;
            
            console.log('[Renderer] Initialized with settings:', {
                antialias: qualitySettings.antialias,
                pixelRatio: pixelRatio,
                shadows: false
            });
            
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

    /**
     * Apply quality settings from PerformanceManager
     * @param {Object} settings - Quality settings object
     */
    applyQualitySettings(settings) {
        if (!this.renderer) return;
        
        // Update pixel ratio
        const pixelRatio = settings.pixelRatio || this.sizes.pixelRatio;
        this.renderer.setPixelRatio(pixelRatio);
        
        // Update shadow settings
        const allowShadows = this.performanceManager
            ? this.performanceManager.shouldEnableDynamicShadows()
            : settings.shadows;
        this.renderer.shadowMap.enabled = !!allowShadows;
        if (settings.shadowMapSize) {
            // Note: Shadow map size is set per light, not globally
            // This is handled in Environment.js
        }
        
        console.log('[Renderer] Quality settings applied:', {
            pixelRatio: pixelRatio,
            shadows: settings.shadows,
            antialias: settings.antialias
        });
    }

    onResize() {
        if (!this.renderer) return;
        
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        
        // Use quality-based pixel ratio
        const qualitySettings = this.performanceManager 
            ? this.performanceManager.getQualitySettings()
            : null;
        const pixelRatio = qualitySettings?.pixelRatio || this.sizes.pixelRatio;
        this.renderer.setPixelRatio(pixelRatio);
    }

    update() {
        if (this.performanceManager) {
            const world = this.experience.world;
            const composer = world?.currentScene?.composer;
            if (composer && typeof composer.render === 'function' && this.performanceManager.shouldUsePostProcessing()) {
                // Composer rendering handled inside the scene update loop
                return;
            }
        }
        this.renderer.render(this.scene, this.camera.perspectiveCamera);
    }
}
