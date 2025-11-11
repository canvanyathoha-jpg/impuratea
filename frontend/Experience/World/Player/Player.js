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
        this.setJoyStick();
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

    setJoyStick() {
        // Check device preference from localStorage
        const deviceType = localStorage.getItem('impuratea-device') || 'desktop';
        
        // Only create joystick if device is mobile
        if (deviceType === 'mobile') {
            // Show joystick area
            if (this.domElements.joystickArea) {
                this.domElements.joystickArea.style.display = 'block';
            }
            
            this.options = {
                zone: this.domElements.joystickArea,
                mode: "dynamic",
                color: "rgba(30, 64, 124, 0.8)",
                size: 160,
                threshold: 0.1,
                fadeTime: 250,
                multitouch: false,
                maxNumberOfNipples: 1,
                dataOnly: false,
                position: { top: '50%', left: '50%' },
                catchDistance: 200,
            };
            this.joystick = nipplejs.create(this.options);

            this.joystick.on("start", () => {
                // Add active class for enhanced visual feedback
                if (this.domElements.joystickArea) {
                    this.domElements.joystickArea.classList.add('active');
                }
            });

            this.joystick.on("move", (e, data) => {
                this.actions.movingJoyStick = true;
                this.joystickVector.z = -data.vector.y;
                this.joystickVector.x = data.vector.x;
                
                // Add active class for enhanced visual feedback
                if (this.domElements.joystickArea) {
                    this.domElements.joystickArea.classList.add('active');
                }
            });

            this.joystick.on("end", () => {
                this.actions.movingJoyStick = false;
                
                // Remove active class
                if (this.domElements.joystickArea) {
                    this.domElements.joystickArea.classList.remove('active');
                }
            });

            this.joystick.on("dir", (evt, data) => {
                // Optional: Add direction-based visual feedback
                console.log("[Player] Joystick direction:", data.direction);
            });
        } else {
            // Hide joystick area for desktop
            if (this.domElements.joystickArea) {
                this.domElements.joystickArea.style.display = 'none';
            }
            this.joystick = null;
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
        if (!this.avatar && this.resources.items[avatarSkin]) {
            this.player.avatarSkin = avatarSkin;
            this.avatar = new Avatar(
                this.resources.items[avatarSkin],
                this.scene,
                undefined,
                undefined,
                avatarSkin // Pass avatarType ("male" or "female")
            );
            console.log(`[Player] Avatar created: ${avatarSkin}`);
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
        if (this.actions.forward) {
            this.player.directionOffset = Math.PI;
        }
        if (this.actions.backward) {
            this.player.directionOffset = 0;
        }

        if (this.actions.left) {
            this.player.directionOffset = -Math.PI / 2;
        }

        if (this.actions.forward && this.actions.left) {
            this.player.directionOffset = Math.PI + Math.PI / 4;
        }
        if (this.actions.backward && this.actions.left) {
            this.player.directionOffset = -Math.PI / 4;
        }

        if (this.actions.right) {
            this.player.directionOffset = Math.PI / 2;
        }

        if (this.actions.forward && this.actions.right) {
            this.player.directionOffset = Math.PI - Math.PI / 4;
        }
        if (this.actions.backward && this.actions.right) {
            this.player.directionOffset = Math.PI / 4;
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
        if (this.player.animation !== this.avatar.animation) {
            if (
                this.actions.left &&
                this.actions.right &&
                !this.actions.forward &&
                !this.actions.backward
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

            this.avatar.animation.play(this.player.animation);
        } else {
            this.avatar.animation.play("idle");
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
