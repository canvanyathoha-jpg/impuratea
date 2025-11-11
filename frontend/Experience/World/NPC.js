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
        this.model.scale.set(9, 9, 9); // Same scale as player avatar
        this.model.position.copy(this.position);
        this.model.rotation.y = THREE.MathUtils.degToRad(this.initialRotation); // Set initial rotation

        // Clone animations safely - check if animations exist
        this.animations = (avatarData.animations && Array.isArray(avatarData.animations)) 
            ? avatarData.animations.map((clip) => clip.clone()) 
            : [];

        this.scene.add(this.model);

        this.setAnimations();
        this.createChatBubble();
        this.createNameTag();

        console.log(`[NPC] Created ${this.name} (${this.gender}) at`, this.position);
        console.log(`[NPC] Available animations: ${this.animations.length}`, this.animations.map(clip => clip.name));
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

            // Try to find by name first
            for (const name of preferredNames) {
                const lowerName = name.toLowerCase();
                const match = this.animations.find((clip) => {
                    if (!clip || !clip.name) return false;
                    const clipName = clip.name.toLowerCase();
                    return (
                        clipName === lowerName ||
                        clipName.includes(lowerName) ||
                        lowerName.includes(clipName)
                    );
                });
                if (match) {
                    return match;
                }
            }

            // Fallback to index if name not found
            if (fallbackIndex >= 0 && fallbackIndex < this.animations.length) {
                return this.animations[fallbackIndex];
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

        // Create actions only for animations that exist
        if (idleClip) {
            try {
                this.actions.idle = this.mixer.clipAction(idleClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create idle animation:`, error);
            }
        }

        if (walkingClip) {
            try {
                this.actions.walking = this.mixer.clipAction(walkingClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create walking animation:`, error);
            }
        }

        if (runningClip) {
            try {
                this.actions.running = this.mixer.clipAction(runningClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create running animation:`, error);
            }
        }

        if (jumpingClip) {
            try {
                this.actions.jumping = this.mixer.clipAction(jumpingClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create jumping animation:`, error);
            }
        }

        if (wavingClip) {
            try {
                this.actions.waving = this.mixer.clipAction(wavingClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create waving animation:`, error);
            }
        }

        if (dancingClip) {
            try {
                this.actions.dancing = this.mixer.clipAction(dancingClip);
            } catch (error) {
                console.warn(`[NPC] Failed to create dancing animation:`, error);
            }
        }

        // Start with idle animation if available, otherwise use first available animation
        if (this.actions.idle) {
            this.currentAction = this.actions.idle;
            this.currentAction.play();
        } else if (this.animations.length > 0) {
            // Fallback: use first available animation
            try {
                const firstClip = this.animations[0];
                if (firstClip) {
                    this.currentAction = this.mixer.clipAction(firstClip);
                    this.currentAction.play();
                    console.warn(`[NPC] Using fallback animation: ${firstClip.name}`);
                }
            } catch (error) {
                console.warn(`[NPC] Failed to create fallback animation:`, error);
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

        // Update animations
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Update movement
        this.updateMovement(deltaTime);

        // Update chat
        this.updateChat();

        // Make name tag face camera
        if (this.nameTag && this.experience.camera) {
            this.nameTag.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
        }
        if (this.chatBubble && this.experience.camera) {
            this.chatBubble.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
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
