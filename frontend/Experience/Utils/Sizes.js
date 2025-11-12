import { EventEmitter } from "events";

export default class Sizes extends EventEmitter {
    constructor() {
        super();
        this.handleSizes();
        
        // Listen for window resize
        window.addEventListener("resize", () => {
            this.handleSizes();
            this.emit("resize");
        });
        
        // Listen for visual viewport resize (better for mobile, handles keyboard, etc.)
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", () => {
                this.handleSizes();
                this.emit("resize");
            });
            window.visualViewport.addEventListener("scroll", () => {
                this.handleSizes();
                this.emit("resize");
            });
        }
    }

    handleSizes() {
        // Use visual viewport if available (better for mobile)
        const viewport = window.visualViewport || window;
        this.width = viewport.width || window.innerWidth;
        this.height = viewport.height || window.innerHeight;
        
        // Fallback to innerWidth/innerHeight if viewport not available
        if (!this.width || !this.height) {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }
        
        this.aspect = this.width / this.height;
        
        // OPTIMIZATION: Lower pixel ratio for better performance on laptops
        // Use device pixel ratio but cap at 1.5 for better performance
        // Can be overridden by PerformanceManager
        this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        
        // Further reduce for very high resolutions (4K+)
        if (this.width > 2560 || this.height > 1440) {
            this.pixelRatio = Math.min(this.pixelRatio, 1.0);
        }
        
        // For mobile devices, use lower pixel ratio for better performance
        if (this.width <= 768 || this.height <= 768) {
            // Detect mobile device more accurately
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (this.width <= 768 && this.height <= 1024);
            
            if (isMobile) {
                // More aggressive pixel ratio reduction for mobile
                this.pixelRatio = Math.min(this.pixelRatio, 0.75);
            } else {
                this.pixelRatio = Math.min(this.pixelRatio, 1.0);
            }
        }
    }
}
