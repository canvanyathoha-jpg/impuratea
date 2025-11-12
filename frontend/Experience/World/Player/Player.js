import * as THREE from "three";
import Experience from "../../Experience.js";
import { Capsule } from "three/examples/jsm/math/Capsule";

import nipplejs from "nipplejs";
import elements from "../../Utils/functions/elements.js";

import Avatar from "./Avatar.js";

export default class Player {
    constructor(initialSpawnPos = new THREE.Vector3(0, 10, 0)) {
        this.experience = new Experience();
        this.time = this.experience.time;
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;
        this.octree = this.experience.world.octree;
        this.resources = this.experience.resources;
        // Socket removed - game is now offline single-player
        this.socket = null;

        this.spawnPosition = initialSpawnPos; // Store spawn position

        this.domElements = elements({
            joystickArea: ".joystick-area",
            controlOverlay: ".control-overlay",
            switchViewButton: ".switch-camera-view",
        });

        this.initPlayer();
        this.initControls();
        // setPlayerSocket removed - no socket needed for offline single-player
        this.setAvatarFromLocalStorage();
        this.ensureJoystickVisibility(); // Ensure joystick is visible if mobile device
        
        // Delay joystick initialization to ensure DOM is ready
        setTimeout(() => {
            this.setJoyStick();
        }, 100);
        
        this.addEventListeners();
    }

    initPlayer() {
        this.player = {};

        this.player.body = this.camera.perspectiveCamera;
        this.player.animation = "idle";

        this.jumpOnce = false;
        this.player.onFloor = false;
        this.player.gravity = 60;

        this.player.spawn = {
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            velocity: new THREE.Vector3(),
        };

        this.player.raycaster = new THREE.Raycaster();
        this.player.raycaster.far = 5;

        // MODIFIED: Sesuaikan dengan scale avatar 3.96
        this.player.height = 4.75; // 1.2 * 3.96 ≈ 4.75
        // Speed multiplier untuk berjalan normal - sudah disesuaikan agar tidak terlalu berat
        this.player.speedMultiplier = 1.2; // Kecepatan berjalan normal yang nyaman
        // Run multiplier terpisah untuk berlari - akan digunakan saat run action aktif
        this.player.runMultiplier = 1.8; // Kecepatan berlari yang lebih cepat tapi tidak terlalu ekstrem
        this.player.position = new THREE.Vector3();
        this.player.quaternion = new THREE.Euler();
        this.player.directionOffset = 0;
        this.targetRotation = new THREE.Quaternion();

        this.upVector = new THREE.Vector3(0, 1, 0);
        this.player.velocity = new THREE.Vector3();
        this.player.direction = new THREE.Vector3();

        // Use the stored spawn position
        this.player.collider = new Capsule(
            this.spawnPosition.clone(),
            this.spawnPosition
                .clone()
                .add(new THREE.Vector3(0, this.player.height, 0)),
            1.4
        );

        // Other players removed - game is now single-player only
        this.otherPlayers = {};
    }

    setSpawnPoint(position) {
        console.log(`[Player] Setting spawn point to:`, position);
        this.spawnPosition = position.clone();

        // Immediately move the player to the new spawn point
        this.player.velocity.set(0, 0, 0);
        this.player.collider.start.copy(this.spawnPosition);
        this.player.collider.end.copy(this.spawnPosition);
        this.player.collider.end.y += this.player.height;

        console.log(`[Player] Collider start:`, this.player.collider.start);
        console.log(`[Player] Collider end:`, this.player.collider.end);

        // Set initial camera target (original behavior)
        if (this.camera.controls) {
            this.camera.controls.target.copy(this.player.collider.end);
        }

        // Force update camera and avatar position
        if (this.avatar && this.avatar.avatar) {
            this.avatar.avatar.position.copy(this.player.collider.end);
            const groundOffset =
                this.avatar.groundOffset !== undefined
                    ? this.avatar.groundOffset
                    : 6.2;
            this.avatar.avatar.position.y -= groundOffset;
            console.log(`[Player] Avatar position set to:`, this.avatar.avatar.position);
        }
    }

    spawnPlayerOutOfBounds() {
        // Use the stored spawn position
        this.player.velocity.set(0, 0, 0);
        this.player.collider.start.copy(this.spawnPosition);
        this.player.collider.end.copy(this.spawnPosition);
        this.player.collider.end.y += this.player.height;
    }

    initControls() {
        this.actions = {};

        this.coords = {
            previousX: 0,
            previousY: 0,
            currentX: 0,
            currentY: 0,
        };

        this.joystickVector = new THREE.Vector3();
    }

    /**
     * Ensure joystick visibility based on device selection from localStorage
     * This ensures joystick is visible in all scenes if mobile device is selected
     */
    ensureJoystickVisibility() {
        const deviceType = localStorage.getItem('impuratea-device');
        const joystickArea = this.domElements.joystickArea || document.querySelector('.joystick-area');
        
        if (joystickArea) {
            if (deviceType === 'mobile') {
                joystickArea.style.display = 'block';
                joystickArea.style.pointerEvents = 'auto';
                console.log('[Player] Joystick enabled for mobile device');
            } else if (deviceType === 'desktop') {
                joystickArea.style.display = 'none';
                console.log('[Player] Joystick disabled for desktop device');
            } else {
                // Device type not set yet - default to showing joystick (will be set later)
                // Don't hide it, let it be visible by default
                joystickArea.style.display = 'block';
                joystickArea.style.pointerEvents = 'auto';
                console.log('[Player] Device type not set, keeping joystick visible');
            }
        } else {
            console.warn('[Player] Joystick area element not found');
        }
    }

    setJoyStick() {
        // Ensure joystick is visible before creating it
        this.ensureJoystickVisibility();
        
        // Check if joystick area is available
        if (!this.domElements.joystickArea) {
            console.warn('[Player] Joystick area element not found, retrying...');
            // Retry after a short delay in case DOM isn't ready yet
            setTimeout(() => {
                this.setJoyStick();
            }, 200);
            return;
        }
        
        // Check device type from localStorage
        const deviceType = localStorage.getItem('impuratea-device');
        
        // If device type is desktop, don't create joystick
        if (deviceType === 'desktop') {
            console.log('[Player] Desktop device selected, skipping joystick creation');
            return;
        }
        
        // If device type is mobile or not set (fallback), create joystick
        // But only if joystick area is visible
        const joystickArea = this.domElements.joystickArea;
        const computedStyle = window.getComputedStyle(joystickArea);
        const isVisible = joystickArea.style.display !== 'none' && 
                         computedStyle.display !== 'none';
        
        // Force show joystick if mobile is selected or device type not set
        if ((!isVisible && deviceType === 'mobile') || !deviceType) {
            joystickArea.style.display = 'block';
            joystickArea.style.visibility = 'visible';
            joystickArea.style.opacity = '1';
            console.log('[Player] Forcing joystick area to be visible', {
                deviceType,
                wasVisible: isVisible,
                computedDisplay: computedStyle.display
            });
        }
        
        // Ensure joystick area can receive touch events
        joystickArea.style.pointerEvents = 'auto';
        joystickArea.style.touchAction = 'none';
        joystickArea.style.zIndex = '10000';
        
        // Add event listener to test if touch events work
        const testTouch = (e) => {
            console.log('[Player] Touch event detected on joystick area', e.type);
        };
        joystickArea.addEventListener('touchstart', testTouch, { once: true, passive: true });
        joystickArea.addEventListener('touchend', testTouch, { once: true, passive: true });
        
        // Destroy existing joystick if it exists
        if (this.joystick) {
            try {
                this.joystick.destroy();
                console.log('[Player] Existing joystick destroyed');
            } catch (error) {
                console.warn('[Player] Error destroying existing joystick:', error);
            }
        }
        
        // Configure nipplejs options with proper touch handling
        this.options = {
            zone: this.domElements.joystickArea,
            mode: "dynamic",
            color: 'rgba(30, 64, 124, 0.8)',
            size: 140,
            threshold: 0.1,
            fadeTime: 250,
            multitouch: false,
            maxNumberOfNipples: 1,
            dataOnly: false,
            position: { top: '50%', left: '50%' },
            catchDistance: 200,
            // Ensure joystick handles touch events properly
            restOpacity: 0.5,
            restJoystick: true
        };
        
        try {
            // Ensure joystick area is ready and has correct styles
            const joystickArea = this.domElements.joystickArea;
            joystickArea.style.display = 'block';
            joystickArea.style.visibility = 'visible';
            joystickArea.style.opacity = '1';
            joystickArea.style.pointerEvents = 'auto';
            joystickArea.style.touchAction = 'none';
            joystickArea.style.zIndex = '10000';
            joystickArea.style.position = 'fixed';
            
            // Prevent canvas and other elements from capturing touch events on joystick area
            joystickArea.addEventListener('touchstart', (e) => {
                e.stopPropagation(); // Stop event from bubbling to canvas
            }, { passive: false, capture: true });
            
            joystickArea.addEventListener('touchmove', (e) => {
                e.stopPropagation(); // Stop event from bubbling to canvas
            }, { passive: false, capture: true });
            
            joystickArea.addEventListener('touchend', (e) => {
                e.stopPropagation(); // Stop event from bubbling to canvas
            }, { passive: false, capture: true });
            
            // Force reflow to ensure styles are applied
            joystickArea.offsetHeight;
            
            this.joystick = nipplejs.create(this.options);

            this.joystick.on("start", (e, data) => {
                // Joystick started - prepare for movement
                console.log('[Player] Joystick started', e, data);
                joystickArea.classList.add('active');
            });

            this.joystick.on("move", (e, data) => {
                this.actions.movingJoyStick = true;
                this.joystickVector.z = -data.vector.y;
                this.joystickVector.x = data.vector.x;
                
                // Set walking animation when joystick is moved (same as WASD)
                if (!this.actions.run && !this.actions.jump && this.player.onFloor) {
                    this.player.animation = "walking";
                }
                
                console.log('[Player] Joystick moved', {
                    x: this.joystickVector.x,
                    z: this.joystickVector.z,
                    angle: data.angle,
                    distance: data.distance
                });
            });

            this.joystick.on("end", (e, data) => {
                this.actions.movingJoyStick = false;
                joystickArea.classList.remove('active');
                
                // Set animation to idle when joystick is released (same as WASD keyup)
                if (this.player.onFloor && !this.actions.run) {
                    // Only set to idle if no other movement keys are pressed
                    if (!this.actions.forward && !this.actions.backward && 
                        !this.actions.left && !this.actions.right) {
                        this.player.animation = "idle";
                    }
                }
                
                console.log('[Player] Joystick ended');
            });
            
            console.log('[Player] Joystick created successfully', {
                zone: joystickArea,
                options: this.options,
                joystick: this.joystick
            });
        } catch (error) {
            console.error('[Player] Error creating joystick:', error);
            console.error('[Player] Joystick area:', this.domElements.joystickArea);
            console.error('[Player] Options:', this.options);
            // Retry after delay if creation failed
            setTimeout(() => {
                console.log('[Player] Retrying joystick creation...');
                this.setJoyStick();
            }, 500);
        }
    }

    /**
     * Set avatar from localStorage (offline single-player mode)
     * Loads avatar selection from localStorage if available
     * This is called during Player initialization
     */
    setAvatarFromLocalStorage() {
        // Check if avatar is already selected and saved in localStorage
        const savedAvatar = localStorage.getItem("impuratea-avatar");
        const savedUsername = localStorage.getItem("impuratea-username");

        if (savedAvatar && this.resources.items[savedAvatar]) {
            // Avatar already selected, create it immediately
            // Use setTimeout to ensure resources are fully loaded
            setTimeout(() => {
                this.createPlayerAvatar(savedAvatar);
                console.log(`[Player] Avatar loaded from localStorage: ${savedAvatar}`);
            }, 100);
        } else {
            console.log(`[Player] No avatar found in localStorage, waiting for user selection`);
        }
    }

    /**
     * Create player avatar (offline single-player mode)
     * Called by Preloader after avatar selection or from localStorage
     */
    createPlayerAvatar(avatarSkin) {
        console.log(`[Player] createPlayerAvatar called with: ${avatarSkin}`);
        console.log(`[Player] Current avatar exists:`, !!this.avatar);
        console.log(`[Player] Resources available:`, Object.keys(this.resources.items));
        console.log(`[Player] Model for ${avatarSkin} exists:`, !!this.resources.items[avatarSkin]);
        
        if (!this.resources.items[avatarSkin]) {
            console.error(`[Player] ❌ Model ${avatarSkin} not found in resources!`);
            console.error(`[Player] Available models:`, Object.keys(this.resources.items).filter(key => key === 'male' || key === 'female'));
            return;
        }
        
        if (!this.avatar && this.resources.items[avatarSkin]) {
            try {
                const avatarData = this.resources.items[avatarSkin];
                console.log(`[Player] Avatar data:`, {
                    hasScene: !!avatarData.scene,
                    hasAnimations: !!avatarData.animations,
                    animationCount: avatarData.animations?.length || 0
                });
                
                this.player.avatarSkin = avatarSkin;
                this.avatar = new Avatar(
                    avatarData,
                    this.scene,
                    undefined,
                    undefined,
                    avatarSkin // Pass avatarType ("male" or "female")
                );
                console.log(`[Player] ✅ Avatar created successfully: ${avatarSkin}`);
                console.log(`[Player] Avatar object:`, this.avatar);
                console.log(`[Player] Avatar mesh visible:`, this.avatar.avatar.visible);
                console.log(`[Player] Avatar position:`, this.avatar.avatar.position);
            } catch (error) {
                console.error(`[Player] ❌ Error creating avatar:`, error);
                console.error(`[Player] Error stack:`, error.stack);
            }
        } else if (this.avatar) {
            console.warn(`[Player] ⚠️ Avatar already exists, skipping creation`);
        }
    }

    onKeyDown = (e) => {
        // Only respond to WASD keys for movement
        if (e.code === "KeyW") {
            this.actions.forward = true;
        }
        if (e.code === "KeyS") {
            this.actions.backward = true;
        }
        if (e.code === "KeyA") {
            this.actions.left = true;
        }
        if (e.code === "KeyD") {
            this.actions.right = true;
        }
        
        // Set walking animation only for WASD movement
        if ((e.code === "KeyW" || e.code === "KeyS" || e.code === "KeyA" || e.code === "KeyD") && 
            !this.actions.run && !this.actions.jump) {
            this.player.animation = "walking";
        }

        // Keep Shift for running (only with WASD)
        if (e.code === "ShiftLeft") {
            this.actions.run = true;
            this.player.animation = "running";
        }

        // Keep Space for jumping
        if (e.code === "Space" && !this.actions.jump && this.player.onFloor) {
            this.actions.jump = true;
            this.player.animation = "jumping";
            this.jumpOnce = true;
        }
    };

    onKeyUp = (e) => {
        // Only respond to WASD keys for movement
        if (e.code === "KeyW") {
            this.actions.forward = false;
        }
        if (e.code === "KeyS") {
            this.actions.backward = false;
        }
        if (e.code === "KeyA") {
            this.actions.left = false;
        }
        if (e.code === "KeyD") {
            this.actions.right = false;
        }

        // Handle Shift release
        if (e.code === "ShiftLeft") {
            this.actions.run = false;
        }

        // Handle Space release
        if (e.code === "Space") {
            this.actions.jump = false;
        }

        // Set animation based on current actions
        if (this.player.onFloor) {
            if (this.actions.run) {
                this.player.animation = "running";
            } else if (
                this.actions.forward ||
                this.actions.backward ||
                this.actions.left ||
                this.actions.right
            ) {
                this.player.animation = "walking";
            } else {
                this.player.animation = "idle";
            }
        }
    };

    playerCollisions() {
        const result = this.octree.capsuleIntersect(this.player.collider);
        this.player.onFloor = false;

        if (result) {
            this.player.onFloor = result.normal.y > 0;

            this.player.collider.translate(
                result.normal.multiplyScalar(result.depth)
            );
        }
    }

    getForwardVector() {
        const cameraMode = this.camera.getCameraMode();
        
        if (cameraMode === 'fpp') {
            // FPP: Use camera's forward direction directly
            this.camera.perspectiveCamera.getWorldDirection(this.player.direction);
            this.player.direction.y = 0;
            this.player.direction.normalize();
        } else {
            // TPP: Use original behavior
            this.camera.perspectiveCamera.getWorldDirection(this.player.direction);
            this.player.direction.y = 0;
            this.player.direction.normalize();
        }

        return this.player.direction;
    }

    getSideVector() {
        this.camera.perspectiveCamera.getWorldDirection(this.player.direction);
        this.player.direction.y = 0;
        this.player.direction.normalize();
        this.player.direction.cross(this.camera.perspectiveCamera.up);

        return this.player.direction;
    }

    getJoyStickDirectionalVector() {
        let returnVector = new THREE.Vector3();
        returnVector.copy(this.joystickVector);

        returnVector.applyQuaternion(this.camera.perspectiveCamera.quaternion);
        returnVector.y = 0;
        returnVector.multiplyScalar(1.5);

        return returnVector;
    }

    addEventListeners() {
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
    }

    resize() {}

    updateColliderMovement() {
        // Tentukan base speed berdasarkan apakah sedang di lantai atau tidak
        const baseSpeed = (this.player.onFloor ? 1.75 : 0.1) * this.player.gravity;
        
        // Pilih multiplier berdasarkan apakah sedang berlari atau berjalan normal
        // Jika run action aktif, gunakan runMultiplier, jika tidak gunakan speedMultiplier normal
        const currentMultiplier = this.actions.run ? this.player.runMultiplier : this.player.speedMultiplier;
        
        const speed = baseSpeed * currentMultiplier;
        let speedDelta = this.time.delta * speed;

        if (this.actions.movingJoyStick) {
            this.player.velocity.add(this.getJoyStickDirectionalVector());
        }

        // Tidak perlu lagi speedDelta *= 2.5 karena sudah menggunakan runMultiplier terpisah di atas
        // if (this.actions.run) {
        //     speedDelta *= 2.5;
        // }

        if (this.actions.forward) {
            this.player.velocity.add(
                this.getForwardVector().multiplyScalar(speedDelta)
            );
        }
        if (this.actions.backward) {
            this.player.velocity.add(
                this.getForwardVector().multiplyScalar(-speedDelta)
            );
        }
        if (this.actions.left) {
            this.player.velocity.add(
                this.getSideVector().multiplyScalar(-speedDelta)
            );
        }
        if (this.actions.right) {
            this.player.velocity.add(
                this.getSideVector().multiplyScalar(speedDelta)
            );
        }

        if (this.player.onFloor) {
            if (this.actions.jump && this.jumpOnce) {
                this.player.velocity.y = 18;
            }
            this.jumpOnce = false;
        }

        // Reduced damping untuk membuat gerakan lebih responsif dan tidak terlalu terasa berat
        let damping = Math.exp(-12 * this.time.delta) - 1; // Dikurangi dari -15 menjadi -12 untuk gerakan lebih ringan

        if (!this.player.onFloor) {
            if (this.player.animation === "jumping") {
                this.player.velocity.y -=
                    this.player.gravity * 0.7 * this.time.delta;
            } else {
                this.player.velocity.y -= this.player.gravity * this.time.delta;
            }
            damping *= 0.1;
        }

        this.player.velocity.addScaledVector(this.player.velocity, damping);

        const deltaPosition = this.player.velocity
            .clone()
            .multiplyScalar(this.time.delta);

        this.player.collider.translate(deltaPosition);
        this.playerCollisions();

        // Update camera position based on mode (FPP or TPP)
        // Safety check: ensure camera and controls exist
        if (!this.camera || !this.camera.getCameraMode) {
            // Fallback to original behavior if camera not ready
            this.player.body.position.sub(this.camera?.controls?.target || new THREE.Vector3());
            if (this.camera?.controls) {
                this.camera.controls.target.copy(this.player.collider.end);
            }
            this.player.body.position.add(this.player.collider.end);
            return;
        }
        
        const cameraMode = this.camera.getCameraMode();
        
        if (cameraMode === 'tpp' && this.camera.controls) {
            // TPP Mode: Original behavior - simple OrbitControls target following
            // This is the original camera behavior before FPP/TPP feature
            this.player.body.position.sub(this.camera.controls.target);
            this.camera.controls.target.copy(this.player.collider.end);
            this.player.body.position.add(this.player.collider.end);
        } else {
            // FPP Mode: Camera is directly at player position
            // No need to adjust body position relative to controls target
            this.player.body.position.copy(this.player.collider.end);
        }

        this.player.body.updateMatrixWorld();

        if (this.player.body.position.y < -20) {
            this.spawnPlayerOutOfBounds();
        }
    }

    setInteractionObjects(interactionObjects) {
        this.player.interactionObjects = interactionObjects;
    }

    getgetCameraLookAtDirectionalVector() {
        const direction = new THREE.Vector3(0, 0, -1);
        return direction.applyQuaternion(
            this.camera.perspectiveCamera.quaternion
        );
    }

    updateRaycaster() {
        this.player.raycaster.ray.origin.copy(
            this.camera.perspectiveCamera.position
        );

        this.player.raycaster.ray.direction.copy(
            this.getgetCameraLookAtDirectionalVector()
        );

        const intersects = this.player.raycaster.intersectObjects(
            this.player.interactionObjects.children
        );

        if (intersects.length === 0) {
            this.currentIntersectObject = "";
        } else {
            this.currentIntersectObject = intersects[0].object.name;
        }

        if (this.currentIntersectObject !== this.previousIntersectObject) {
            this.previousIntersectObject = this.currentIntersectObject;
        }
    }

    updateAvatarPosition() {
        this.avatar.avatar.position.copy(this.player.collider.end);
        const groundOffset =
            this.avatar.groundOffset !== undefined
                ? this.avatar.groundOffset
                : 6.2;
        this.avatar.avatar.position.y -= groundOffset;

        this.avatar.animation.update(this.time.delta);
    }

    // updateOtherPlayers removed - game is now single-player only
    // No other players to update in offline mode

    updateAvatarRotation() {
        // Handle joystick rotation first (joystick takes priority)
        if (this.actions.movingJoyStick) {
            // Calculate direction from joystick vector
            const joystickAngle = Math.atan2(this.joystickVector.x, this.joystickVector.z);
            // Convert joystick angle to direction offset (matching WASD behavior)
            this.player.directionOffset = joystickAngle;
        } else if (this.actions.forward) {
            this.player.directionOffset = Math.PI;
        } else if (this.actions.backward) {
            this.player.directionOffset = 0;
        } else if (this.actions.left) {
            this.player.directionOffset = -Math.PI / 2;
        } else if (this.actions.right) {
            this.player.directionOffset = Math.PI / 2;
        }

        // Handle diagonal movements (only if not using joystick)
        if (!this.actions.movingJoyStick) {
            if (this.actions.forward && this.actions.left) {
                this.player.directionOffset = Math.PI + Math.PI / 4;
            }
            if (this.actions.backward && this.actions.left) {
                this.player.directionOffset = -Math.PI / 4;
            }

            if (this.actions.forward && this.actions.right) {
                this.player.directionOffset = Math.PI - Math.PI / 4;
            }
            if (this.actions.backward && this.actions.right) {
                this.player.directionOffset = Math.PI / 4;
            }
        }

        if (this.actions.forward && this.actions.left && this.actions.right) {
            this.player.directionOffset = Math.PI;
        }
        if (this.actions.backward && this.actions.left && this.actions.right) {
            this.player.directionOffset = 0;
        }

        if (
            this.actions.right &&
            this.actions.backward &&
            this.actions.forward
        ) {
            this.player.directionOffset = Math.PI / 2;
        }

        if (
            this.actions.left &&
            this.actions.backward &&
            this.actions.forward
        ) {
            this.player.directionOffset = -Math.PI / 2;
        }
    }

    updateAvatarAnimation() {
        // Check if joystick is being used for movement
        const isMoving = this.actions.movingJoyStick || 
                        this.actions.forward || 
                        this.actions.backward || 
                        this.actions.left || 
                        this.actions.right;
        
        if (this.player.animation !== this.avatar.animation) {
            // Handle joystick movement animation
            if (this.actions.movingJoyStick && !this.actions.run && !this.actions.jump && this.player.onFloor) {
                this.player.animation = "walking";
            }
            
            // If joystick is not moving and no keyboard input, set to idle
            if (!this.actions.movingJoyStick && !isMoving && this.player.onFloor && !this.actions.run) {
                this.player.animation = "idle";
            }
            
            if (
                this.actions.left &&
                this.actions.right &&
                !this.actions.forward &&
                !this.actions.backward &&
                !this.actions.movingJoyStick
            ) {
                this.player.animation = "idle";
            }

            if (
                !this.actions.left &&
                !this.actions.right &&
                this.actions.forward &&
                this.actions.backward
            ) {
                this.player.animation = "idle";
            }

            if (
                this.actions.left &&
                this.actions.right &&
                this.actions.forward &&
                this.actions.backward
            ) {
                this.player.animation = "idle";
            }

            if (
                !this.actions.left &&
                !this.actions.right &&
                !this.actions.forward &&
                !this.actions.backward &&
                !this.actions.movingJoyStick &&
                this.actions.run
            ) {
                this.player.animation = "idle";
            }

            if (
                this.actions.run &&
                this.actions.left &&
                this.actions.right &&
                this.actions.forward &&
                !this.actions.backward
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                this.actions.left &&
                this.actions.right &&
                this.actions.backward &&
                !this.actions.forward
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                !this.actions.left &&
                !this.actions.right &&
                this.actions.forward &&
                !this.actions.backward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                !this.actions.left &&
                !this.actions.right &&
                this.actions.backward &&
                !this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                !this.actions.left &&
                !this.actions.right &&
                this.actions.backward &&
                this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "idle";
            }

            if (
                this.actions.run &&
                this.actions.left &&
                this.actions.right &&
                !this.actions.backward &&
                !this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "idle";
            }

            if (
                this.actions.run &&
                !this.actions.left &&
                this.actions.right &&
                !this.actions.backward &&
                this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                this.actions.left &&
                !this.actions.right &&
                this.actions.backward &&
                !this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }
            if (
                this.actions.run &&
                this.actions.left &&
                !this.actions.right &&
                !this.actions.backward &&
                !this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }
            if (
                this.actions.run &&
                !this.actions.left &&
                this.actions.right &&
                !this.actions.backward &&
                !this.actions.forward &&
                this.player.animation !== "jumping"
            ) {
                this.player.animation = "running";
            }

            if (
                this.actions.run &&
                !this.actions.left &&
                !this.actions.right &&
                !this.actions.backward &&
                !this.actions.forward &&
                this.actions.jump
            ) {
                this.player.animation = "jumping";
            }

            if (this.player.animation === "jumping" && !this.jumpOnce) {
                if (this.player.onFloor) {
                    if (this.actions.run) {
                        this.player.animation = "running";
                    } else if (
                        this.actions.movingJoyStick ||
                        this.actions.forward ||
                        this.actions.backward ||
                        this.actions.left ||
                        this.actions.right
                    ) {
                        this.player.animation = "walking";
                    } else {
                        this.player.animation = "idle";
                    }
                }
            }

            // Final check: if joystick is moving and not jumping/running, ensure walking animation
            // This takes priority over other conditions
            if (this.actions.movingJoyStick && 
                this.player.animation !== "jumping" && 
                !this.actions.run && 
                this.player.onFloor) {
                this.player.animation = "walking";
            }

            this.avatar.animation.play(this.player.animation);
        } else {
            // Even if animation state hasn't changed, check if we need to update based on joystick
            // This ensures joystick movement always triggers walking animation
            if (this.actions.movingJoyStick && 
                this.player.animation !== "walking" && 
                !this.actions.run && 
                !this.actions.jump && 
                this.player.onFloor) {
                this.player.animation = "walking";
                this.avatar.animation.play(this.player.animation);
            } else if (!this.actions.movingJoyStick && 
                      !isMoving && 
                      this.player.animation !== "idle" && 
                      !this.actions.run && 
                      !this.actions.jump && 
                      this.player.onFloor) {
                this.player.animation = "idle";
                this.avatar.animation.play(this.player.animation);
            } else {
                // Keep playing current animation
                this.avatar.animation.play(this.player.animation);
            }
        }
    }

    updateCameraPosition() {
        // Safety check: ensure camera and its methods exist
        if (!this.camera || !this.camera.getCameraMode || !this.camera.updateCameraPosition) {
            return;
        }
        
        const cameraMode = this.camera.getCameraMode();
        
        if (cameraMode === 'fpp') {
            // FPP Mode: Camera follows player directly, avatar hidden
            // Get player forward direction from camera rotation
            if (!this.camera.perspectiveCamera) return;
            
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.perspectiveCamera.quaternion);
            forward.y = 0; // Keep horizontal
            forward.normalize();
            
            // Update camera position (handled by Camera.js)
            this.camera.updateCameraPosition(
                this.player.collider.end,
                forward
            );
            
            // Hide avatar in FPP mode
            if (this.avatar && this.avatar.avatar) {
                this.avatar.avatar.visible = false;
            }
        } else {
            // TPP Mode: Original behavior - avatar visible, camera follows with OrbitControls
            // Show avatar in TPP mode
            if (this.avatar && this.avatar.avatar) {
                this.avatar.avatar.visible = true;
            }
            
            // TPP: Don't call updateCameraPosition - let OrbitControls handle it naturally
            // The camera target is already set in updateColliderMovement()
            // This restores the original camera behavior before FPP/TPP feature
            
            // Rotate avatar based on camera angle (original behavior)
            if (
                this.avatar &&
                this.avatar.avatar &&
                this.player.animation !== "idle" &&
                this.player.animation !== "dancing"
            ) {
                const cameraAngleFromPlayer = Math.atan2(
                    this.player.body.position.x - this.avatar.avatar.position.x,
                    this.player.body.position.z - this.avatar.avatar.position.z
                );

                this.targetRotation.setFromAxisAngle(
                    this.upVector,
                    cameraAngleFromPlayer + this.player.directionOffset
                );
                this.avatar.avatar.quaternion.rotateTowards(
                    this.targetRotation,
                    0.15
                );
            }
        }
    }

    update() {
        if (this.avatar) {
            this.updateColliderMovement();
            this.updateAvatarPosition();
            this.updateAvatarRotation();
            this.updateAvatarAnimation();
            this.updateCameraPosition();
            // updateOtherPlayers removed - game is single-player only
        }
    }
}
