/**
 * PerformanceManager.js
 * Manages game performance and quality settings
 * Automatically adjusts quality based on FPS to maintain smooth gameplay
 */

import { EventEmitter } from "events";

export default class PerformanceManager extends EventEmitter {
    constructor() {
        super();
        
        // Performance monitoring
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
        this.maxHistorySize = 60; // Track last 60 frames
        
        // Quality levels: 'low', 'medium', 'high'
        this.currentQuality = 'medium'; // Start with medium
        this.targetFPS = 30; // Target FPS for laptops (lower than 60)
        this.minFPS = 20; // Minimum acceptable FPS
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 768 && window.innerHeight <= 1024);
        
        // Quality settings
        this.qualitySettings = {
            low: {
                pixelRatio: isMobile ? 0.5 : 0.75, // Even lower for mobile
                antialias: false, // Disable antialias
                shadows: false, // Disable shadows
                shadowMapSize: 512, // Smaller shadow map if enabled
                textureQuality: isMobile ? 0.4 : 0.5, // Lower texture quality for mobile
                maxLights: 2, // Limit number of lights
                enableFrustumCulling: true, // Enable frustum culling
            },
            medium: {
                pixelRatio: isMobile ? 0.75 : 1.0, // Lower for mobile
                antialias: false, // Disable antialias for better performance
                shadows: false, // Disable shadows for better performance
                shadowMapSize: 1024,
                textureQuality: isMobile ? 0.6 : 0.75, // Lower for mobile
                maxLights: 4,
                enableFrustumCulling: true,
            },
            high: {
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                antialias: true,
                shadows: true,
                shadowMapSize: 2048,
                textureQuality: 1.0,
                maxLights: 8,
                enableFrustumCulling: true,
            }
        };
        
        // Start with lower quality on mobile
        if (isMobile) {
            this.currentQuality = 'low';
            console.log('[PerformanceManager] Mobile device detected, starting with LOW quality');
        }
        
        // Start monitoring
        this.startMonitoring();
        
        console.log('[PerformanceManager] Initialized with quality:', this.currentQuality, isMobile ? '(Mobile)' : '(Desktop)');
    }
    
    /**
     * Start FPS monitoring
     */
    startMonitoring() {
        this.monitor();
    }
    
    /**
     * Monitor FPS and adjust quality automatically
     */
    monitor() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime > 0) {
            this.fps = 1000 / deltaTime;
            this.fpsHistory.push(this.fps);
            
            // Keep history size manageable
            if (this.fpsHistory.length > this.maxHistorySize) {
                this.fpsHistory.shift();
            }
            
            // Calculate average FPS
            const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            
            // Auto-adjust quality based on FPS
            if (avgFPS < this.minFPS && this.currentQuality !== 'low') {
                // FPS too low, reduce quality
                this.setQuality('low');
                console.log('[PerformanceManager] ⚠️ FPS too low, reducing quality to LOW');
            } else if (avgFPS < this.targetFPS && this.currentQuality === 'high') {
                // FPS below target, reduce from high to medium
                this.setQuality('medium');
                console.log('[PerformanceManager] ⚠️ FPS below target, reducing quality to MEDIUM');
            } else if (avgFPS > this.targetFPS + 10 && this.currentQuality === 'low') {
                // FPS good, can increase quality
                this.setQuality('medium');
                console.log('[PerformanceManager] ✅ FPS good, increasing quality to MEDIUM');
            }
        }
        
        this.lastTime = currentTime;
        
        // Continue monitoring
        requestAnimationFrame(() => this.monitor());
    }
    
    /**
     * Set quality level
     * @param {string} quality - 'low', 'medium', or 'high'
     */
    setQuality(quality) {
        if (!this.qualitySettings[quality]) {
            console.warn('[PerformanceManager] Invalid quality level:', quality);
            return;
        }
        
        if (this.currentQuality === quality) return; // Already at this quality
        
        this.currentQuality = quality;
        const settings = this.qualitySettings[quality];
        
        console.log(`[PerformanceManager] Setting quality to ${quality.toUpperCase()}:`, settings);
        
        // Emit quality change event
        this.emit('qualityChanged', quality, settings);
    }
    
    /**
     * Get current quality settings
     * @returns {Object} Current quality settings
     */
    getQualitySettings() {
        return this.qualitySettings[this.currentQuality];
    }
    
    /**
     * Get current quality level
     * @returns {string} Current quality level
     */
    getQuality() {
        return this.currentQuality;
    }
    
    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Get average FPS
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 60;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
}

