import * as THREE from "three";
import Experience from "./Experience.js";
import { OrbitControls } from "../Experience/Utils/CustomOrbitControls.js";

export default class Camera {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.params = {
            fov: 75,
            aspect: this.sizes.aspect,
            near: 0.001,
            far: 1000,
        };
        this.controls = null;

        // Camera mode: 'fpp' (First Person) or 'tpp' (Third Person)
        this.cameraMode = 'tpp'; // Default to third person
        this.isTransitioning = false;
        
        // TPP settings
        this.tppDistance = 8; // Distance from player in TPP mode
        this.tppHeight = 3; // Height offset in TPP mode
        this.tppSmoothness = 0.1; // Smooth follow speed
        
        // FPP settings
        this.fppHeight = 1.6; // Eye height in FPP mode (relative to player collider)
        this.fppMouseSensitivity = 0.002; // Mouse sensitivity for FPP look
        this.fppRotationX = 0; // Vertical rotation (pitch)
        this.fppRotationY = 0; // Horizontal rotation (yaw)
        this.isPointerLocked = false;
        
        // Transition settings
        this.transitionDuration = 0.5; // seconds
        this.transitionProgress = 0;
        
        // Initialize FPP controls flag (will be setup when FPP mode is first used)
        this.fppControlsSetup = false;

        this.setPerspectiveCamera();
        this.setOrbitControls();
        
        // Don't setup FPP controls immediately - setup when FPP mode is first activated
        // This prevents errors during initialization
    }

    setPerspectiveCamera() {
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            this.params.fov,
            this.params.aspect,
            this.params.near,
            this.params.far
        );

        this.perspectiveCamera.position.set(17.8838, 1.2 + 10, -3.72508);
        this.perspectiveCamera.rotation.y = Math.PI / 2;

        this.scene.add(this.perspectiveCamera);
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
        this.controls.enabled = true; // Ensure controls are enabled
        this.controls.enableDamping = true;
        this.controls.enableZoom = true; // Enable zoom with mouse wheel
        this.controls.enableRotate = true; // Enable rotation with left click
        this.controls.enablePan = true; // Enable pan with right click or middle mouse
        // this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 50; // Increased from 6 to 50 for more zoom out range

        this.controls.dampingFactor = 0.1;

        // Enable collision detection for camera
        this.controls.enableCollisionDetection = true;
        this.controls.collisionDistance = 0.5; // Minimum distance from collider

        console.log('[Camera] OrbitControls initialized:', {
            enabled: this.controls.enabled,
            enableZoom: this.controls.enableZoom,
            enableRotate: this.controls.enableRotate,
            enablePan: this.controls.enablePan,
            enableCollisionDetection: this.controls.enableCollisionDetection,
            collisionDistance: this.controls.collisionDistance
        });
    }

    /**
     * Toggle between FPP (First Person) and TPP (Third Person) camera modes
     */
    toggleCameraMode() {
        if (this.isTransitioning) return; // Prevent rapid toggling
        
        const newMode = this.cameraMode === 'fpp' ? 'tpp' : 'fpp';
        this.setCameraMode(newMode);
        
        // Play sound if available
        if (this.experience && this.experience.soundManager) {
            this.experience.soundManager.play('click', 0.5);
        }
        
        console.log(`[Camera] Switched to ${newMode.toUpperCase()} mode`);
    }

    /**
     * Set camera mode (FPP or TPP)
     * @param {string} mode - 'fpp' or 'tpp'
     */
    setCameraMode(mode) {
        if (mode !== 'fpp' && mode !== 'tpp') {
            console.warn('[Camera] Invalid camera mode:', mode);
            return;
        }
        
        if (this.cameraMode === mode) return; // Already in this mode
        
        this.cameraMode = mode;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // Update controls based on mode
        if (mode === 'fpp') {
            // FPP: Disable orbit controls, use first person controls
            this.controls.enabled = false;
            this.controls.enableZoom = false;
            // Sync current rotation to FPP rotation
            this.fppRotationY = this.perspectiveCamera.rotation.y;
            this.fppRotationX = this.perspectiveCamera.rotation.x;
            
            // Setup FPP controls if not already setup (lazy initialization)
            if (!this.fppControlsSetup) {
                setTimeout(() => {
                    this.setupFPPControls();
                }, 100);
            }
        } else {
            // TPP: Enable orbit controls for third person view
            this.controls.enabled = true;
            this.controls.enableZoom = true;
            // Exit pointer lock
            if (this.isPointerLocked) {
                document.exitPointerLock();
            }
        }
    }

    /**
     * Update camera position based on current mode
     * Called from Player.js update method
     * @param {THREE.Vector3} playerPosition - Player's collider end position
     * @param {THREE.Vector3} playerDirection - Player's forward direction
     */
    updateCameraPosition(playerPosition, playerDirection) {
        if (!playerPosition || !this.perspectiveCamera) return;
        
        // Safety check: ensure experience and time exist
        if (!this.experience || !this.experience.time) return;
        
        const deltaTime = this.experience.time.delta / 1000;
        
        // Handle transition between modes
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.isTransitioning = false;
            }
        }
        
        if (this.cameraMode === 'fpp') {
            // First Person Perspective: Camera at player's eye level
            const targetPosition = playerPosition.clone();
            targetPosition.y += this.fppHeight;
            
            // Smooth transition if switching modes
            if (this.isTransitioning) {
                const startPos = this.perspectiveCamera.position.clone();
                this.perspectiveCamera.position.lerp(targetPosition, this.transitionProgress);
            } else {
                // Direct position in FPP
                this.perspectiveCamera.position.copy(targetPosition);
            }
            
            // Apply FPP rotation (mouse look)
            // Use Euler angles for FPP rotation
            const euler = new THREE.Euler(this.fppRotationX, this.fppRotationY, 0, 'YXZ');
            this.perspectiveCamera.quaternion.setFromEuler(euler);
            
            // Request pointer lock when entering FPP mode
            if (!this.isPointerLocked && !this.isTransitioning && this.canvas) {
                try {
                    this.canvas.requestPointerLock();
                } catch (error) {
                    console.warn('[Camera] Could not request pointer lock:', error);
                }
            }
        } else {
            // Exit pointer lock when switching to TPP
            if (this.isPointerLocked) {
                document.exitPointerLock();
            }
            // Third Person Perspective: Camera behind player
            // This is handled by OrbitControls, but we adjust target
            const targetPosition = playerPosition.clone();
            targetPosition.y += this.tppHeight;
            
            // Update controls target smoothly
            if (this.controls) {
                this.controls.target.lerp(targetPosition, this.tppSmoothness);
            }
        }
    }

    /**
     * Setup first person perspective mouse controls
     */
    setupFPPControls() {
        // Prevent multiple setups
        if (this.fppControlsSetup) {
            console.warn('[Camera] FPP controls already setup');
            return;
        }
        
        // Check if canvas exists
        if (!this.canvas) {
            console.error('[Camera] Canvas not available for FPP controls setup');
            return;
        }
        
        // Mouse move handler for FPP look
        this.onMouseMove = (event) => {
            if (this.cameraMode !== 'fpp' || !this.isPointerLocked) return;
            
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            
            // Update rotation
            this.fppRotationY -= movementX * this.fppMouseSensitivity;
            this.fppRotationX -= movementY * this.fppMouseSensitivity;
            
            // Clamp vertical rotation to prevent flipping
            this.fppRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.fppRotationX));
        };
        
        // Pointer lock change handler
        this.onPointerLockChange = () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        };
        
        // Click canvas to lock pointer in FPP mode
        this.onCanvasClick = () => {
            if (this.cameraMode === 'fpp' && !this.isPointerLocked && this.canvas) {
                this.canvas.requestPointerLock();
            }
        };
        
        // Add event listeners
        try {
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('pointerlockchange', this.onPointerLockChange);
            if (this.canvas) {
                this.canvas.addEventListener('click', this.onCanvasClick);
            }
            this.fppControlsSetup = true;
            console.log('[Camera] FPP controls setup successfully');
        } catch (error) {
            console.error('[Camera] Error setting up FPP controls:', error);
        }
    }

    /**
     * Get current camera mode
     * @returns {string} 'fpp' or 'tpp'
     */
    getCameraMode() {
        return this.cameraMode;
    }

    enableOrbitControls() {
        this.controls.enabled = true;
    }

    disableOrbitControls() {
        this.controls.enabled = false;
    }

    onResize() {
        this.perspectiveCamera.aspect = this.sizes.aspect;
        this.perspectiveCamera.updateProjectionMatrix();
    }

    update() {
        if (!this.controls) return;
        
        // Only update OrbitControls in TPP mode
        if (this.cameraMode === 'tpp' && this.controls.enabled === true) {
            this.controls.update();
        }
    }
}
