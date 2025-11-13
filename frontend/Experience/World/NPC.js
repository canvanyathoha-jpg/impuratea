import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Experience from "../Experience.js";

export default class NPC {
    constructor(options = {}) {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;

        // NPC Configuration
        this.name = options.name || "NPC";
        this.gender = options.gender || "male"; // 'male' or 'female'
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.initialRotation = options.initialRotation || 0; // Initial rotation in degrees
        this.waypoints = options.waypoints || []; // Array of Vector3 positions
        this.walkSpeed = options.walkSpeed || 2;
        this.dialogues = options.dialogues || ["Hi!", "Hello!", "Nice day!"];
        this.chatInterval = options.chatInterval || 10000; // Chat every 10 seconds

        // State
        this.currentWaypointIndex = 0;
        this.isMoving = false;
        this.targetPosition = null;
        this.chatBubble = null;
        this.lastChatTime = 0;

        this.setModel();
    }

    setModel() {
        // Get the appropriate model based on gender
        const modelKey = this.gender === "female" ? "female" : "male";
        const avatarData = this.resources.items[modelKey];

        if (!avatarData) {
            console.error(`[NPC] Model for ${this.gender} not found!`);
            return;
        }

        // Clone the model
        this.model = SkeletonUtils.clone(avatarData.scene);
        this.model.position.set(0, 0, 0);
        this.model.rotation.set(0, 0, 0);
        this.model.scale.set(1, 1, 1);

        // Dynamically scale model to match standard NPC height
        const initialBox = new THREE.Box3().setFromObject(this.model);
        const initialSize = initialBox.getSize(new THREE.Vector3());

        const targetHeight = this.gender === "female" ? 5.5 : 3; // Match Avatar scaling
        const scaleFactor = targetHeight / (initialSize.y || 1);
        this.model.scale.setScalar(scaleFactor);

        // Re-centre model so feet rest at y = 0
        const scaledBox = new THREE.Box3().setFromObject(this.model);
        const min = scaledBox.min;
        const max = scaledBox.max;

        this.model.position.x -= (min.x + max.x) / 2;
        this.model.position.z -= (min.z + max.z) / 2;
        this.model.position.y -= min.y;

        // Restore desired rotation
        this.model.rotation.y = THREE.MathUtils.degToRad(this.initialRotation);

        // Finally position NPC in world
        this.model.position.add(this.position);
        
        // OPTIMIZATION: Enable frustum culling and disable shadows for better performance
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = true; // Enable frustum culling
                child.castShadow = false; // Disable shadows for better performance
                child.receiveShadow = false; // Disable shadows for better performance
            }
        });

        // Clone animations safely - check if animations exist and filter out invalid ones
        if (avatarData.animations && Array.isArray(avatarData.animations)) {
            this.animations = avatarData.animations
                .filter((clip) => clip != null && clip.clone) // Filter out null/undefined and ensure clone method exists
                .map((clip) => {
                    try {
                        return clip.clone();
                    } catch (error) {
                        console.warn(`[NPC] Failed to clone animation:`, error);
                        return null;
                    }
                })
                .filter((clonedClip) => clonedClip != null && clonedClip.uuid); // Filter out null/undefined and ensure uuid exists
        } else {
            this.animations = [];
        }

        this.scene.add(this.model);

        this.setAnimations();
        this.createChatBubble();
        this.createNameTag();

        console.log(`[NPC] Created ${this.name} (${this.gender}) at`, this.position);
        console.log(`[NPC] Available animations: ${this.animations.length}`, this.animations.map(clip => clip ? clip.name : 'null'));
    }

    setAnimations() {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.actions = {};

        // Safely find animations by name (similar to Avatar.js approach)
        // This is more reliable than using index-based access
        const findClip = (preferredNames = [], fallbackIndex = 0) => {
            if (!this.animations || this.animations.length === 0) {
                return null;
            }

            // Filter out any invalid clips first
            const validAnimations = this.animations.filter((clip) => 
                clip != null && 
                typeof clip === 'object' && 
                clip.uuid && 
                clip.name
            );

            if (validAnimations.length === 0) {
                return null;
            }

            // Try to find by name first
            for (const name of preferredNames) {
                const lowerName = name.toLowerCase();
                const match = validAnimations.find((clip) => {
                    if (!clip || !clip.name) return false;
                    const clipName = clip.name.toLowerCase();
                    return (
                        clipName === lowerName ||
                        clipName.includes(lowerName) ||
                        lowerName.includes(clipName)
                    );
                });
                if (match && match.uuid) {
                    return match;
                }
            }

            // Fallback to index if name not found, but only if index is valid
            if (fallbackIndex >= 0 && fallbackIndex < validAnimations.length) {
                const fallbackClip = validAnimations[fallbackIndex];
                if (fallbackClip && fallbackClip.uuid) {
                    return fallbackClip;
                }
            }

            return null;
        };

        // Safely create clipActions for animations that exist
        const idleClip = findClip(['idle', 'standing', 'rest', 'breath'], 0);
        const walkingClip = findClip(['walk', 'walking', 'stride'], 1);
        const runningClip = findClip(['run', 'running', 'sprint'], 2);
        const jumpingClip = findClip(['jump', 'jumping'], 3);
        const wavingClip = findClip(['wave', 'waving'], 4);
        const dancingClip = findClip(['dance', 'dancing'], 5);

        // Helper function to safely create clipAction
        const createAction = (clip, actionName) => {
            if (!clip || !clip.uuid) {
                console.warn(`[NPC] Invalid clip for ${actionName}:`, clip);
                return null;
            }
            try {
                return this.mixer.clipAction(clip);
            } catch (error) {
                console.warn(`[NPC] Failed to create ${actionName} animation:`, error, clip);
                return null;
            }
        };

        // Create actions only for animations that exist and are valid
        if (idleClip && idleClip.uuid) {
            this.actions.idle = createAction(idleClip, 'idle');
        }

        if (walkingClip && walkingClip.uuid) {
            this.actions.walking = createAction(walkingClip, 'walking');
        }

        if (runningClip && runningClip.uuid) {
            this.actions.running = createAction(runningClip, 'running');
        }

        if (jumpingClip && jumpingClip.uuid) {
            this.actions.jumping = createAction(jumpingClip, 'jumping');
        }

        if (wavingClip && wavingClip.uuid) {
            this.actions.waving = createAction(wavingClip, 'waving');
        }

        if (dancingClip && dancingClip.uuid) {
            this.actions.dancing = createAction(dancingClip, 'dancing');
        }

        // Start with idle animation if available, otherwise use first available animation
        if (this.actions.idle) {
            try {
                this.currentAction = this.actions.idle;
                this.currentAction.play();
            } catch (error) {
                console.warn(`[NPC] Failed to play idle animation:`, error);
            }
        } else if (this.animations.length > 0) {
            // Fallback: use first valid animation
            const validAnimations = this.animations.filter((clip) => 
                clip != null && clip.uuid && typeof clip === 'object'
            );
            
            if (validAnimations.length > 0) {
                try {
                    const firstClip = validAnimations[0];
                    if (firstClip && firstClip.uuid) {
                        this.currentAction = createAction(firstClip, 'fallback');
                        if (this.currentAction) {
                            this.currentAction.play();
                            console.warn(`[NPC] Using fallback animation: ${firstClip.name || 'unknown'}`);
                        }
                    }
                } catch (error) {
                    console.warn(`[NPC] Failed to create fallback animation:`, error);
                }
            } else {
                console.warn(`[NPC] No valid animations available for ${this.name}`);
            }
        } else {
            console.warn(`[NPC] No animations available for ${this.name}`);
        }
    }

    createChatBubble() {
        // Create a sprite for the chat bubble
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Draw rounded rectangle background
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(context, 10, 10, 492, 236, 20);
        context.fill();

        // Add border
        context.strokeStyle = '#333';
        context.lineWidth = 4;
        this.roundRect(context, 10, 10, 492, 236, 20);
        context.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });

        this.chatBubble = new THREE.Sprite(spriteMaterial);
        this.chatBubble.scale.set(8, 4, 1);
        this.chatBubble.position.set(0, 12, 0); // Above NPC head
        this.model.add(this.chatBubble);
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    createNameTag() {
        // Create canvas for name tag
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, 512, 128);

        // Text
        context.fillStyle = '#ffffff';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, 256, 80);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        this.nameTag = new THREE.Sprite(spriteMaterial);
        this.nameTag.scale.set(6, 1.5, 1);
        this.nameTag.position.set(0, 10, 0); // Above NPC head
        this.model.add(this.nameTag);
    }

    showChat(message) {
        if (!this.chatBubble) return;
        if (typeof message !== 'string') {
            console.warn('[NPC] showChat received non-string message:', message);
            return;
        }

        // Update canvas with new message
        const canvas = this.chatBubble.material.map.image;
        const context = canvas.getContext('2d');

        // Clear canvas
        context.clearRect(0, 0, 512, 256);

        // Redraw background
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(context, 10, 10, 492, 236, 20);
        context.fill();

        context.strokeStyle = '#333';
        context.lineWidth = 4;
        this.roundRect(context, 10, 10, 492, 236, 20);
        context.stroke();

        // Draw text
        context.fillStyle = '#333';
        context.font = 'bold 40px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Word wrap
        const words = message.split(' ');
        let line = '';
        let y = 100;
        const maxWidth = 450;
        const lineHeight = 50;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = context.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                context.fillText(line, 256, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, 256, y);

        this.chatBubble.material.map.needsUpdate = true;

        // Show bubble with animation
        this.chatBubble.material.opacity = 1;

        // Hide after 3 seconds
        setTimeout(() => {
            if (this.chatBubble) {
                this.chatBubble.material.opacity = 0;
            }
        }, 3000);
    }

    playAnimation(name) {
        const newAction = this.actions[name];
        const oldAction = this.currentAction;

        // Safety check: only play if animation exists
        if (!newAction) {
            console.warn(`[NPC] Animation "${name}" not found for ${this.name}`);
            return;
        }

        // Don't change if already playing the same animation
        if (oldAction === newAction) return;

        // Safely transition to new animation
        try {
            newAction.reset();
            newAction.play();
            
            // Only crossfade if there's an old action playing
            if (oldAction) {
                newAction.crossFadeFrom(oldAction, 0.3);
            }

            this.currentAction = newAction;
        } catch (error) {
            console.warn(`[NPC] Error playing animation "${name}":`, error);
        }
    }

    moveTo(targetPosition) {
        this.targetPosition = targetPosition.clone();
        this.isMoving = true;
        this.playAnimation('walking');
    }

    updateMovement(deltaTime) {
        if (!this.isMoving || !this.targetPosition) return;

        const currentPos = this.model.position;
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, currentPos)
            .normalize();

        const distance = currentPos.distanceTo(this.targetPosition);
        const moveDistance = this.walkSpeed * deltaTime;

        if (distance < moveDistance) {
            // Reached target
            this.model.position.copy(this.targetPosition);
            this.isMoving = false;
            this.playAnimation('idle');

            // Move to next waypoint
            if (this.waypoints.length > 0) {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
                setTimeout(() => {
                    this.moveTo(this.waypoints[this.currentWaypointIndex]);
                }, Math.random() * 2000 + 1000); // Wait 1-3 seconds
            }
        } else {
            // Move towards target
            currentPos.add(direction.multiplyScalar(moveDistance));

            // Rotate to face movement direction with initial rotation offset
            const angle = Math.atan2(direction.x, direction.z);
            const offsetAngle = THREE.MathUtils.degToRad(this.initialRotation);
            this.model.rotation.y = angle + offsetAngle;
        }
    }

    updateChat() {
        const currentTime = Date.now();

        if (currentTime - this.lastChatTime > this.chatInterval) {
            const randomDialogue = this.dialogues[Math.floor(Math.random() * this.dialogues.length)];
            this.showChat(randomDialogue);
            this.lastChatTime = currentTime;
        }
    }

    update() {
        if (!this.model) return;

        const deltaTime = this.time.delta / 1000;

        // OPTIMIZATION: Update animations (always needed)
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // OPTIMIZATION: Update movement (always needed)
        this.updateMovement(deltaTime);

        // OPTIMIZATION: Update chat less frequently to save performance
        // Only update chat every few frames (reduce from every frame to every 3 frames)
        if (!this.chatUpdateCounter) this.chatUpdateCounter = 0;
        this.chatUpdateCounter++;
        if (this.chatUpdateCounter >= 3) {
            this.updateChat();
            this.chatUpdateCounter = 0;
        }

        // OPTIMIZATION: Update name tag and chat bubble less frequently
        // Only update every 2 frames to reduce calculations
        if (!this.uiUpdateCounter) this.uiUpdateCounter = 0;
        this.uiUpdateCounter++;
        if (this.uiUpdateCounter >= 2) {
            // Make name tag face camera
            if (this.nameTag && this.experience.camera) {
                this.nameTag.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
            }
            if (this.chatBubble && this.experience.camera) {
                this.chatBubble.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
            }
            this.uiUpdateCounter = 0;
        }
    }

    dispose() {
        if (this.model) {
            this.scene.remove(this.model);
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
}
