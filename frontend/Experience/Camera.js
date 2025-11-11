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
        this.fppHeight = 8.5; // Eye height in FPP mode (relative to player collider) - increased for better view
        this.fppMouseSensitivity = 0.002; // Mouse sensitivity for FPP look
        this.fppRotationX = 0; // Vertical rotation (pitch)
        this.fppRotationY = 0; // Horizontal rotation (yaw)
        this.isPointerLocked = false; // Not used anymore - keeping for compatibility
        this.lastMouseX = 0; // Last mouse X position for calculating delta
        this.lastMouseY = 0; // Last mouse Y position for calculating delta
        this.isMouseDown = false; // Track if mouse button is pressed (for drag-to-rotate)
        
        // Transition settings
        this.transitionDuration = 0.5; // seconds
        this.transitionProgress = 0;
        
        // Initialize FPP controls flag (will be setup when FPP mode is first used)
        this.fppControlsSetup = false;
        
        // Track if user has manually adjusted camera (to prevent auto-reset)
        this.userAdjustedCamera = false;
        this.lastUserInteractionTime = 0;
        this.userInteractionTimeout = 2000; // 2 seconds - if no interaction, allow auto-follow

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

        // Note: User interaction tracking removed for TPP - using original simple behavior

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
        // Allow toggling even during transition (but log a warning)
        if (this.isTransitioning) {
            console.warn('[Camera] Toggle requested during transition, allowing anyway');
            // Don't return - allow the toggle to proceed
        }
        
        const newMode = this.cameraMode === 'fpp' ? 'tpp' : 'fpp';
        console.log(`[Camera] Toggling from ${this.cameraMode.toUpperCase()} to ${newMode.toUpperCase()}`);
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
        
        if (this.cameraMode === mode) {
            console.log(`[Camera] Already in ${mode.toUpperCase()} mode, skipping`);
            return; // Already in this mode
        }
        
        console.log(`[Camera] Setting camera mode from ${this.cameraMode.toUpperCase()} to ${mode.toUpperCase()}`);
        this.cameraMode = mode;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // Update controls based on mode
        if (mode === 'fpp') {
            // FPP: Disable orbit controls, use first person controls
            this.controls.enabled = false;
            this.controls.enableZoom = false;
            // Sync current rotation to FPP rotation
            // IMPORTANT: Convert from quaternion to Euler angles correctly
            // The camera's rotation might be stored as quaternion, so we need to extract Euler angles
            const euler = new THREE.Euler().setFromQuaternion(this.perspectiveCamera.quaternion, 'YXZ');
            this.fppRotationY = euler.y; // Yaw (horizontal rotation)
            this.fppRotationX = euler.x; // Pitch (vertical rotation)
            console.log('[Camera] Synced FPP rotation from camera:', { 
                fppRotationX: this.fppRotationX, 
                fppRotationY: this.fppRotationY,
                cameraRotation: {
                    x: this.perspectiveCamera.rotation.x,
                    y: this.perspectiveCamera.rotation.y,
                    z: this.perspectiveCamera.rotation.z
                }
            });
            
            // Setup FPP controls if not already setup (lazy initialization)
            if (!this.fppControlsSetup) {
                setTimeout(() => {
                    this.setupFPPControls();
                }, 100);
            }
        } else {
            // TPP mode: Enable OrbitControls and adjust camera spawn position
            if (this.controls) {
                this.controls.enabled = true;
                this.controls.enableZoom = true;
                this.controls.enableRotate = true;
                this.controls.enablePan = true;
                
                // If switching from FPP to TPP, raise the camera target height
                // This gives a better initial view when switching to TPP
                if (this.experience && this.experience.world && this.experience.world.player) {
                    const player = this.experience.world.player;
                    if (player.player && player.player.collider) {
                        // Get player's current position
                        const playerPos = player.player.collider.end.clone();
                        // Add height offset for better TPP spawn position
                        const tppSpawnHeightOffset = 5; // Increase this value to raise camera spawn higher
                        playerPos.y += tppSpawnHeightOffset;
                        
                        // Set camera target to raised position
                        this.controls.target.copy(playerPos);
                        console.log(`[Camera] TPP spawn position raised by ${tppSpawnHeightOffset} units. Target:`, this.controls.target);
                    }
                }
            }
            // Exit pointer lock
            if (this.isPointerLocked) {
                document.exitPointerLock();
            }
            console.log('[Camera] TPP mode enabled - OrbitControls re-enabled');
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

        if (!this.experience || !this.experience.time) return;
        
        const deltaTime = this.experience.time.delta / 1000;
        
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
            
            // IMPORTANT: Ensure OrbitControls is completely disabled and not updating
            // This must be done BEFORE setting position to prevent override
            if (this.controls) {
                this.controls.enabled = false;
                // Also disable all OrbitControls features
                this.controls.enableZoom = false;
                this.controls.enableRotate = false;
                this.controls.enablePan = false;
            }
            
            // Smooth transition if switching modes
            if (this.isTransitioning) {
                const startPos = this.perspectiveCamera.position.clone();
                this.perspectiveCamera.position.lerp(targetPosition, this.transitionProgress);
            } else {
                // Direct position in FPP - use set() to ensure all components are set
                this.perspectiveCamera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
            }
            
            // CRITICAL: Force update matrix immediately to ensure position is applied
            // This must be done AFTER setting position
            this.perspectiveCamera.updateMatrixWorld(true); // true = force update
            
            // IMPORTANT: Store the target position so we can verify it's not being overridden
            this.lastFPPTargetPosition = targetPosition.clone();
            
            // Debug: Log to verify position is set correctly (uncomment to debug)
            console.log('[Camera FPP] SET - fppHeight:', this.fppHeight, 'targetPosition.y:', targetPosition.y.toFixed(2), 'camera.y AFTER SET:', this.perspectiveCamera.position.y.toFixed(2));
            
            // Apply FPP rotation (mouse look)
            // IMPORTANT: Always apply rotation based on fppRotationX and fppRotationY
            // These values are updated when mouse button is pressed and dragged (drag-to-rotate)
            // 
            // CRITICAL: Don't reset rotation - always use the stored fppRotationX/Y values
            // This ensures camera maintains its direction
            // 
            // IMPORTANT: Ensure fppRotationX and fppRotationY are valid numbers
            if (typeof this.fppRotationX === 'number' && typeof this.fppRotationY === 'number' && 
                !isNaN(this.fppRotationX) && !isNaN(this.fppRotationY)) {
                const euler = new THREE.Euler(this.fppRotationX, this.fppRotationY, 0, 'YXZ');
                this.perspectiveCamera.quaternion.setFromEuler(euler);
            } else {
                // If rotation values are invalid, log warning but don't crash
                console.warn('[Camera FPP] Invalid rotation values:', { 
                    fppRotationX: this.fppRotationX, 
                    fppRotationY: this.fppRotationY 
                });
            }
            
            // NO POINTER LOCK - cursor always visible
            // Mouse movement updates fppRotationX/Y when mouse button is pressed (drag-to-rotate)
            // This allows user to always see cursor and click buttons
        } else {
            // TPP mode - no pointer lock needed
            // Third Person Perspective: Original behavior - let OrbitControls handle everything
            // Don't interfere with camera target - it's already set in Player.js updateColliderMovement()
            // This restores the original camera behavior before FPP/TPP feature
            // OrbitControls will naturally follow the target set by Player.js
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
        
        // Mouse move handler for FPP look (NO POINTER LOCK - cursor always visible)
        this.onMouseMove = (event) => {
            // IMPORTANT: Only process mouse movement if in FPP mode
            if (this.cameraMode !== 'fpp') return;
            
            // Only rotate camera when mouse button is pressed (drag to rotate)
            // This allows user to click buttons without rotating camera
            if (!this.isMouseDown) return;
            
            // Calculate mouse movement delta
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            // Update rotation based on mouse movement
            this.fppRotationY -= deltaX * this.fppMouseSensitivity;
            this.fppRotationX -= deltaY * this.fppMouseSensitivity;
            
            // Clamp vertical rotation to prevent flipping
            this.fppRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.fppRotationX));
            
            // Update last mouse position
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        };
        
        // Mouse down handler - start tracking mouse position
        this.onMouseDown = (event) => {
            if (this.cameraMode !== 'fpp') return;
            
            // Only track if clicking on canvas (not on UI elements)
            if (event.target === this.canvas) {
                this.isMouseDown = true;
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
            }
        };
        
        // Mouse up handler - stop tracking mouse position
        this.onMouseUp = () => {
            if (this.cameraMode !== 'fpp') return;
            this.isMouseDown = false;
        };
        
        // NO POINTER LOCK - cursor always visible for clicking buttons
        // Add event listeners for drag-to-rotate
        try {
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mousedown', this.onMouseDown);
            document.addEventListener('mouseup', this.onMouseUp);
            this.fppControlsSetup = true;
            console.log('[Camera] FPP controls setup successfully (drag-to-rotate, no pointer lock)');
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
    
    /**
     * Get DialogManager instance from current scene
     * @returns {DialogManager|null} DialogManager instance or null if not found
     */
    getDialogManager() {
        // Try multiple ways to access DialogManager
        if (this.experience?.world?.currentScene?.dialogManager) {
            return this.experience.world.currentScene.dialogManager;
        }
        if (this.experience?.dialogManager) {
            return this.experience.dialogManager;
        }
        // Try to find DialogManager in any scene
        if (this.experience?.world?.currentScene) {
            const scene = this.experience.world.currentScene;
            // Check if scene has dialogManager property
            if (scene.dialogManager) {
                return scene.dialogManager;
            }
        }
        return null;
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
        
        // IMPORTANT: Update order matters!
        // In FPP mode, we must NOT call controls.update() at all
        // The camera position is set in updateCameraPosition() which is called AFTER this update()
        // So we need to ensure OrbitControls doesn't interfere
        
        if (this.cameraMode === 'tpp' && this.controls.enabled === true) {
            // TPP: Update OrbitControls normally
            this.controls.update();
        } else if (this.cameraMode === 'fpp') {
            // FPP: Completely disable OrbitControls and DO NOT call update()
            // This is critical - controls.update() would override our camera position
            if (this.controls.enabled) {
                this.controls.enabled = false;
            }
            // DO NOT call this.controls.update() in FPP mode!
            // The camera position is managed directly in updateCameraPosition()
            
            // NO POINTER LOCK - cursor always visible for clicking buttons
            
            // Debug: Check if camera position was overridden (uncomment to debug)
            if (this.lastFPPTargetPosition) {
                const currentY = this.perspectiveCamera.position.y;
                const targetY = this.lastFPPTargetPosition.y;
                if (Math.abs(currentY - targetY) > 0.1) {
                    console.warn('[Camera FPP] Position was overridden! Target:', targetY.toFixed(2), 'Current:', currentY.toFixed(2), 'Difference:', (currentY - targetY).toFixed(2));
                    // Force restore position if it was overridden
                    this.perspectiveCamera.position.y = targetY;
                    this.perspectiveCamera.updateMatrixWorld(true);
                }
            }
        }
    }
}
