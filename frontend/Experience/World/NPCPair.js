import * as THREE from "three";
import NPC from "./NPC.js";
import Experience from "../Experience.js";

export default class NPCPair {
    constructor(options = {}) {
        this.experience = new Experience();
        this.time = this.experience.time;

        // Configuration
        this.npc1Config = options.npc1 || {};
        this.npc2Config = options.npc2 || {};
        this.distance = options.distance || 3; // Distance between NPCs
        this.conversation = options.conversation || [];
        this.walkTogether = options.walkTogether !== false; // Default true
        this.pauseInterval = options.pauseInterval || 15000; // Pause every 15 seconds
        this.pauseDuration = options.pauseDuration || 5000; // Pause for 5 seconds

        // State
        this.isPaused = false;
        this.lastPauseTime = 0;
        this.currentConversationIndex = 0;
        this.lastChatTime = 0;
        this.chatDelay = 3000; // 3 seconds between each dialog

        this.createNPCs();
    }

    createNPCs() {
        // Calculate positions with offset
        const basePos = this.npc1Config.position || new THREE.Vector3(0, 0, 0);
        const offsetPos = basePos.clone().add(new THREE.Vector3(this.distance, 0, 0));

        // Create first NPC
        this.npc1 = new NPC({
            ...this.npc1Config,
            position: basePos,
            dialogues: [], // Disable random chat for paired NPCs
            chatInterval: 999999
        });

        // Create second NPC with offset position
        this.npc2 = new NPC({
            ...this.npc2Config,
            position: offsetPos,
            dialogues: [], // Disable random chat for paired NPCs
            chatInterval: 999999
        });

        // Sync waypoints if walking together
        if (this.walkTogether && this.npc1Config.waypoints) {
            // Create offset waypoints for npc2
            const offsetWaypoints = this.npc1Config.waypoints.map(wp =>
                wp.clone().add(new THREE.Vector3(this.distance, 0, 0))
            );
            this.npc2.waypoints = offsetWaypoints;
        }

        console.log(`[NPCPair] Created pair: ${this.npc1.name} & ${this.npc2.name}`);
    }

    pauseForChat() {
        this.isPaused = true;
        this.npc1.isMoving = false;
        this.npc2.isMoving = false;

        // Play idle animation
        if (this.npc1.actions && this.npc1.actions.idle) {
            this.npc1.playAnimation('idle');
        }
        if (this.npc2.actions && this.npc2.actions.idle) {
            this.npc2.playAnimation('idle');
        }

        // Make them face each other
        const direction = new THREE.Vector3()
            .subVectors(this.npc2.model.position, this.npc1.model.position)
            .normalize();

        const angle1 = Math.atan2(direction.x, direction.z);
        this.npc1.model.rotation.y = angle1;

        const angle2 = Math.atan2(-direction.x, -direction.z);
        this.npc2.model.rotation.y = angle2;

        // Start conversation
        this.currentConversationIndex = 0;
        this.startConversation();
    }

    resumeWalking() {
        this.isPaused = false;

        // Resume movement
        if (this.npc1.waypoints.length > 0) {
            this.npc1.moveTo(this.npc1.waypoints[this.npc1.currentWaypointIndex]);
        }
        if (this.npc2.waypoints.length > 0) {
            this.npc2.moveTo(this.npc2.waypoints[this.npc2.currentWaypointIndex]);
        }
    }

    startConversation() {
        if (this.conversation.length === 0) return;

        this.showNextDialog();
    }

    showNextDialog() {
        if (this.currentConversationIndex >= this.conversation.length) {
            // Conversation finished
            return;
        }

        const dialog = this.conversation[this.currentConversationIndex];
        const speaker = dialog.speaker === 1 ? this.npc1 : this.npc2;

        speaker.showChat(dialog.text);

        this.currentConversationIndex++;
        this.lastChatTime = Date.now();

        // Schedule next dialog
        if (this.currentConversationIndex < this.conversation.length) {
            setTimeout(() => {
                this.showNextDialog();
            }, this.chatDelay);
        }
    }

    // Sync movement of both NPCs
    syncMovement() {
        if (!this.walkTogether) return;

        // Make sure both NPCs are at the same waypoint index
        if (this.npc1.currentWaypointIndex !== this.npc2.currentWaypointIndex) {
            this.npc2.currentWaypointIndex = this.npc1.currentWaypointIndex;
        }

        // If one reaches waypoint, make the other reach too
        if (!this.npc1.isMoving && this.npc2.isMoving) {
            this.npc2.isMoving = false;
            if (this.npc2.model) {
                this.npc2.model.position.copy(this.npc2.targetPosition);
            }
        }
        if (!this.npc2.isMoving && this.npc1.isMoving) {
            this.npc1.isMoving = false;
            if (this.npc1.model) {
                this.npc1.model.position.copy(this.npc1.targetPosition);
            }
        }
    }

    update() {
        const currentTime = Date.now();

        // Check if should pause for conversation
        if (!this.isPaused && currentTime - this.lastPauseTime > this.pauseInterval) {
            this.pauseForChat();
            this.lastPauseTime = currentTime;
        }

        // Resume walking after pause duration
        if (this.isPaused && currentTime - this.lastPauseTime > this.pauseDuration) {
            this.resumeWalking();
        }

        // Sync movement when walking together
        if (!this.isPaused) {
            this.syncMovement();
        }

        // Update individual NPCs
        if (this.npc1) {
            // Override normal movement update during pause
            if (!this.isPaused) {
                this.npc1.update();
            } else {
                // Only update animations and visuals, not movement
                const deltaTime = this.time.delta / 1000;
                if (this.npc1.mixer) {
                    this.npc1.mixer.update(deltaTime);
                }
                // Update name tag orientation
                if (this.npc1.nameTag && this.experience.camera) {
                    this.npc1.nameTag.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
                }
                if (this.npc1.chatBubble && this.experience.camera) {
                    this.npc1.chatBubble.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
                }
            }
        }

        if (this.npc2) {
            // Override normal movement update during pause
            if (!this.isPaused) {
                this.npc2.update();
            } else {
                // Only update animations and visuals, not movement
                const deltaTime = this.time.delta / 1000;
                if (this.npc2.mixer) {
                    this.npc2.mixer.update(deltaTime);
                }
                // Update name tag orientation
                if (this.npc2.nameTag && this.experience.camera) {
                    this.npc2.nameTag.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
                }
                if (this.npc2.chatBubble && this.experience.camera) {
                    this.npc2.chatBubble.quaternion.copy(this.experience.camera.perspectiveCamera.quaternion);
                }
            }
        }
    }

    dispose() {
        if (this.npc1) {
            this.npc1.dispose();
        }
        if (this.npc2) {
            this.npc2.dispose();
        }
    }
}
