import { EventEmitter } from "events";

export default class Sizes extends EventEmitter {
    constructor() {
        super();
        this.handleSizes();
        window.addEventListener("resize", () => {
            this.handleSizes();
            this.emit("resize");
        });
    }

    handleSizes() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;
        
        // OPTIMIZATION: Lower pixel ratio for better performance on laptops
        // Use device pixel ratio but cap at 1.5 for better performance
        // Can be overridden by PerformanceManager
        this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        
        // Further reduce for very high resolutions (4K+)
        if (this.width > 2560 || this.height > 1440) {
            this.pixelRatio = Math.min(this.pixelRatio, 1.0);
        }
    }
}
