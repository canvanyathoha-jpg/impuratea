import * as THREE from "three";
import Experience from "../Experience.js";

export default class UIManager {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;

        // Store active UI elements
        this.speechBubbles = new Map(); // Map<npcId, {element, target, offset}>
        this.choicePanel = null;
        this.interactionPrompt = null;

        // Create container for all spatial UI elements
        this.container = document.createElement('div');
        this.container.id = 'spatial-ui-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Helper function: Project 3D world position to 2D screen coordinates
     * @param {THREE.Object3D|THREE.Vector3} object - Three.js object or position vector
     * @returns {{x: number, y: number, visible: boolean}} Screen coordinates in pixels
     */
    projectWorldToScreen(object) {
        // Get camera dynamically (not cached in constructor)
        const camera = this.experience.camera?.instance;

        if (!camera) {
            console.warn('[UIManager] Camera not ready yet');
            return { x: 0, y: 0, visible: false };
        }

        const vector = new THREE.Vector3();

        // Get position from object or use vector directly
        if (object.isObject3D) {
            vector.setFromMatrixPosition(object.matrixWorld);
        } else {
            vector.copy(object);
        }

        // Project to normalized device coordinates (-1 to +1)
        vector.project(camera);

        // Check if behind camera
        const behindCamera = vector.z > 1;

        // Convert to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * this.sizes.width;
        const y = (vector.y * -0.5 + 0.5) * this.sizes.height;

        return {
            x: x,
            y: y,
            visible: !behindCamera && vector.z < 1
        };
    }

    /**
     * Create a speech bubble for an NPC
     * @param {string} npcId - Unique identifier for the NPC
     * @param {THREE.Object3D} targetObject - The 3D object to follow
     * @param {string} text - Dialog text
     * @param {THREE.Vector3} offset - Offset from target position (default: above head)
     */
    createSpeechBubble(npcId, targetObject, text, offset = new THREE.Vector3(0, 3, 0)) {
        // Remove existing bubble if any
        this.removeSpeechBubble(npcId);

        // Create bubble element
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.innerHTML = `
            <div class="speech-bubble-content">
                <div class="speech-bubble-text">${text}</div>
            </div>
            <div class="speech-bubble-tail"></div>
        `;

        bubble.style.cssText = `
            position: absolute;
            min-width: 200px;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.95);
            border: 3px solid #333;
            border-radius: 20px;
            padding: 15px 20px;
            color: #333;
            font-size: 16px;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translate(-50%, -100%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        this.container.appendChild(bubble);

        // Store bubble data
        this.speechBubbles.set(npcId, {
            element: bubble,
            target: targetObject,
            offset: offset
        });

        // Fade in
        setTimeout(() => {
            bubble.style.opacity = '1';
        }, 10);

        return bubble;
    }

    /**
     * Create interaction prompt (e.g., "Press [E] to talk")
     * @param {THREE.Object3D} targetObject - The 3D object to follow
     * @param {string} text - Prompt text
     * @param {THREE.Vector3} offset - Offset from target position
     */
    createInteractionPrompt(targetObject, text = "Tekan [E] untuk bicara", offset = new THREE.Vector3(0, 2.5, 0)) {
        // Remove existing prompt
        this.removeInteractionPrompt();

        const prompt = document.createElement('div');
        prompt.className = 'interaction-prompt';
        prompt.innerHTML = `
            <div class="prompt-icon">💬</div>
            <div class="prompt-text">${text}</div>
        `;

        prompt.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 10px 20px;
            color: white;
            font-size: 16px;
            transform: translate(-50%, -100%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        this.container.appendChild(prompt);

        this.interactionPrompt = {
            element: prompt,
            target: targetObject,
            offset: offset
        };

        // Fade in
        setTimeout(() => {
            prompt.style.opacity = '1';
        }, 10);

        return prompt;
    }

    /**
     * Create choice panel with options
     * @param {THREE.Object3D|THREE.Vector3} targetObject - Position to anchor the panel
     * @param {Array} choices - Array of choice objects: [{id, text, description, type}]
     * @param {Function} onChoiceSelected - Callback when choice is clicked
     * @param {THREE.Vector3} offset - Offset from target
     */
    createChoicePanel(targetObject, choices, onChoiceSelected, offset = new THREE.Vector3(0, 0, 2)) {
        // Remove existing panel
        this.removeChoicePanel();

        const panel = document.createElement('div');
        panel.className = 'choice-panel';

        let choicesHTML = '';
        choices.forEach((choice, index) => {
            const colorClass = choice.type === 'honest' ? 'choice-honest' : 'choice-corrupt';
            choicesHTML += `
                <button class="choice-button ${colorClass}" data-choice-id="${choice.id}">
                    <div class="choice-label">${String.fromCharCode(65 + index)}.</div>
                    <div class="choice-content">
                        <div class="choice-text">${choice.text}</div>
                        <div class="choice-description">${choice.description}</div>
                    </div>
                </button>
            `;
        });

        panel.innerHTML = `
            <div class="choice-panel-content">
                ${choicesHTML}
            </div>
        `;

        panel.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 15px;
            padding: 20px;
            transform: translate(-50%, -50%);
            pointer-events: all;
            opacity: 0;
            transition: opacity 0.3s ease;
            min-width: 400px;
        `;

        this.container.appendChild(panel);

        // Add click handlers
        const buttons = panel.querySelectorAll('.choice-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const choiceId = button.getAttribute('data-choice-id');
                onChoiceSelected(choiceId);
            });
        });

        this.choicePanel = {
            element: panel,
            target: targetObject,
            offset: offset,
            isFixed: false // Set to true if you want it fixed in screen space
        };

        // Fade in
        setTimeout(() => {
            panel.style.opacity = '1';
        }, 10);

        return panel;
    }

    /**
     * Update all spatial UI elements positions
     * Call this in your main update loop
     */
    updatePositions() {
        // Update speech bubbles
        this.speechBubbles.forEach((bubble, npcId) => {
            this.updateElementPosition(bubble);
        });

        // Update interaction prompt
        if (this.interactionPrompt) {
            this.updateElementPosition(this.interactionPrompt);
        }

        // Update choice panel
        if (this.choicePanel && !this.choicePanel.isFixed) {
            this.updateElementPosition(this.choicePanel);
        }
    }

    /**
     * Update a single UI element position
     * @param {Object} uiData - Object containing {element, target, offset}
     */
    updateElementPosition(uiData) {
        const { element, target, offset } = uiData;

        // Get world position
        const worldPos = new THREE.Vector3();
        if (target.isObject3D) {
            target.getWorldPosition(worldPos);
        } else {
            worldPos.copy(target);
        }

        // Apply offset
        worldPos.add(offset);

        // Project to screen
        const screenPos = this.projectWorldToScreen(worldPos);

        // Update element position
        if (screenPos.visible) {
            element.style.left = `${screenPos.x}px`;
            element.style.top = `${screenPos.y}px`;
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    /**
     * Remove a speech bubble
     * @param {string} npcId - NPC identifier
     */
    removeSpeechBubble(npcId) {
        const bubble = this.speechBubbles.get(npcId);
        if (bubble) {
            bubble.element.style.opacity = '0';
            setTimeout(() => {
                if (bubble.element.parentNode) {
                    bubble.element.remove();
                }
            }, 300);
            this.speechBubbles.delete(npcId);
        }
    }

    /**
     * Remove interaction prompt
     */
    removeInteractionPrompt() {
        if (this.interactionPrompt) {
            this.interactionPrompt.element.style.opacity = '0';
            setTimeout(() => {
                if (this.interactionPrompt.element.parentNode) {
                    this.interactionPrompt.element.remove();
                }
                this.interactionPrompt = null;
            }, 300);
        }
    }

    /**
     * Remove choice panel
     */
    removeChoicePanel() {
        if (this.choicePanel) {
            this.choicePanel.element.style.opacity = '0';
            setTimeout(() => {
                if (this.choicePanel.element.parentNode) {
                    this.choicePanel.element.remove();
                }
                this.choicePanel = null;
            }, 300);
        }
    }

    /**
     * Clean up all UI elements
     */
    dispose() {
        // Remove all speech bubbles
        this.speechBubbles.forEach((bubble, npcId) => {
            this.removeSpeechBubble(npcId);
        });

        // Remove prompts and panels
        this.removeInteractionPrompt();
        this.removeChoicePanel();

        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.remove();
        }
    }
}
