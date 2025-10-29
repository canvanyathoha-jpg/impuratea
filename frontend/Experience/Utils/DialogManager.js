/**
 * DialogManager.js
 * Manages story dialogs, choices, and scene progression
 */

export default class DialogManager {
    constructor(experience = null) {
        this.experience = experience;
        this.scoreManager = this.experience.scoreManager;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.isShowing = false;
        this.onChoiceCallback = null;

        console.log('[DialogManager] Initialized');
    }

    /**
     * Show a dialog with story text and optional choices
     * @param {Object} config - Dialog configuration
     * @param {string} config.text - Dialog text (cerita)
     * @param {string} config.speaker - Optional speaker name
     * @param {Array} config.choices - Array of choice objects {text, score, nextScene}
     * @param {Function} config.onChoice - Callback when choice is made
     * @param {string} config.sublimentMessage - Optional subliminal message
     */
    showDialog(config) {
        if (this.isShowing) {
            console.log('[DialogManager] Dialog already showing, queueing...');
            this.dialogQueue.push(config);
            return;
        }

        this.isShowing = true;
        this.currentDialog = config;
        this.onChoiceCallback = config.onChoice;

        console.log('[DialogManager] Showing dialog:', config);

        // Disable camera controls
        this.disableCameraControls();

        // Create dialog container
        this.createDialogUI(config);
        
        // Show score UI
        this.scoreManager.showScoreUI();
    }

    disableCameraControls() {
        console.log('[DialogManager] Attempting to disable camera controls...');
        
        // Disable pointer lock (FPS controls)
        if (document.pointerLockElement) {
            document.exitPointerLock();
            console.log('[DialogManager] Exited pointer lock');
        }
        
        // Try multiple ways to access camera controls
        let controlsDisabled = false;
        
        // Method 1: Through passed experience instance
        if (this.experience && this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.enabled = false;
            controlsDisabled = true;
            console.log('[DialogManager] Camera controls disabled via this.experience');
        }
        
        // Method 2: Through window.experience
        if (!controlsDisabled && window.experience && window.experience.camera && window.experience.camera.controls) {
            window.experience.camera.controls.enabled = false;
            controlsDisabled = true;
            console.log('[DialogManager] Camera controls disabled via window.experience');
        }
        
        // Method 3: Disable pointer events on canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.pointerEvents = 'none';
            console.log('[DialogManager] Canvas pointer events disabled');
        }

        // Change cursor to default
        document.body.style.cursor = 'default';
        
        if (!controlsDisabled) {
            console.log('[DialogManager] No camera controls found to disable');
        }
    }

    enableCameraControls() {
        console.log('[DialogManager] Attempting to enable camera controls...');
        
        let controlsEnabled = false;
        
        // Method 1: Through passed experience instance
        if (this.experience && this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.enabled = true;
            controlsEnabled = true;
            console.log('[DialogManager] Camera controls enabled via this.experience');
        }
        
        // Method 2: Through window.experience
        if (!controlsEnabled && window.experience && window.experience.camera && window.experience.camera.controls) {
            window.experience.camera.controls.enabled = true;
            controlsEnabled = true;
            console.log('[DialogManager] Camera controls enabled via window.experience');
        }
        
        // Method 3: Re-enable pointer events on canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.pointerEvents = 'auto';
            console.log('[DialogManager] Canvas pointer events enabled');
        }

        // Restore cursor
        document.body.style.cursor = '';
        
        if (!controlsEnabled) {
            console.log('[DialogManager] No camera controls found to enable');
        }
    }

    createDialogUI(config) {
        // Remove existing dialog and backdrop
        const existing = document.getElementById('story-dialog');
        if (existing) existing.remove();
        
        const existingBackdrop = document.getElementById('dialog-backdrop');
        if (existingBackdrop) existingBackdrop.remove();

        // Create backdrop to block camera controls and other interactions
        const backdrop = document.createElement('div');
        backdrop.id = 'dialog-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            pointer-events: auto;
        `;
        document.body.appendChild(backdrop);

        const dialogDiv = document.createElement('div');
        dialogDiv.id = 'story-dialog';
        dialogDiv.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: rgba(0, 0, 0, 0.95);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #00ffff;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 9999;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            animation: slideUp 0.5s ease-out;
            pointer-events: auto;
        `;

        let html = '';

        // Determine if this dialog text should be visually rendered by this UI.
        // It should render for narrative text (no speaker) or inner monologue.
        // It should NOT render for NPCs, as they use a 3D speech bubble.
        const shouldRenderText = !config.speaker || config.speaker === "Kamu (batin)";

        if (shouldRenderText) {
            // Speaker name (if provided)
            if (config.speaker) {
                html += `
                    <div style="font-size: 14px; color: #00ffff; margin-bottom: 10px; font-weight: bold;">
                        ${config.speaker}
                    </div>
                `;
            }

            // Dialog text
            html += `
                <div style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    ${config.text}
                </div>
            `;
        }

        // Choices (if provided)
        if (config.choices && config.choices.length > 0) {
            html += `<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">`;
            
            config.choices.forEach((choice, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C...
                html += `
                    <button 
                        id="choice-${index}" 
                        class="choice-button"
                        style="
                            padding: 15px 20px;
                            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                            border: 2px solid #00ffff;
                            border-radius: 10px;
                            color: white;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            text-align: left;
                            position: relative;
                            overflow: hidden;
                            pointer-events: auto;
                            user-select: none;
                        "
                    >
                        <strong style="color: #00ffff;">[${letter}]</strong> ${choice.text}
                        ${choice.score > 0 ? `<span style="color: #ff6b6b; font-size: 12px; margin-left: 10px;">(+${choice.score}% corruption)</span>` : ''}
                    </button>
                `;
            });

            html += `</div>`;
        } else {
            // Continue button if no choices
            html += `
                <button 
                    id="continue-button"
                    style="
                        padding: 12px 30px;
                        background: #00ffff;
                        border: none;
                        border-radius: 8px;
                        color: black;
                        font-weight: bold;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.3s;
                        margin-top: 15px;
                        pointer-events: auto;
                        user-select: none;
                    "
                >
                    Lanjutkan →
                </button>
            `;
        }

        // Subliminal message
        if (config.sublimentMessage) {
            html += `
                <div style="
                    margin-top: 20px;
                    padding: 15px;
                    background: rgba(255, 107, 107, 0.1);
                    border-left: 4px solid #ff6b6b;
                    border-radius: 5px;
                    font-size: 14px;
                    font-style: italic;
                    color: #ffaaaa;
                ">
                    💭 ${config.sublimentMessage}
                </div>
            `;
        }

        dialogDiv.innerHTML = html;
        document.body.appendChild(dialogDiv);

        // Add animation styles
        this.addDialogStyles();

        // CRITICAL: Wait for DOM to be fully rendered before attaching events
        setTimeout(() => {
            this.attachEventListeners(config);
        }, 10);

        // Add event listeners
        if (config.choices && config.choices.length > 0) {
            config.choices.forEach((choice, index) => {
                const button = document.getElementById(`choice-${index}`);
                if (button) {
                    button.addEventListener('click', () => this.handleChoice(choice, index));
                    
                    // Hover effect
                    button.addEventListener('mouseenter', (e) => {
                        e.target.style.background = 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)';
                        e.target.style.transform = 'translateX(10px)';
                        e.target.style.borderColor = '#ffffff';
                    });
                    button.addEventListener('mouseleave', (e) => {
                        e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.borderColor = '#00ffff';
                    });
                }
            });
        } else {
            const continueBtn = document.getElementById('continue-button');
            if (continueBtn) {
                continueBtn.addEventListener('click', () => this.handleContinue());
                continueBtn.addEventListener('mouseenter', (e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.background = '#00cccc';
                });
                continueBtn.addEventListener('mouseleave', (e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = '#00ffff';
                });
            }
        }
    }

    attachEventListeners(config) {
        console.log('[DialogManager] Attaching event listeners...');

        if (config.choices && config.choices.length > 0) {
            config.choices.forEach((choice, index) => {
                const button = document.getElementById(`choice-${index}`);
                console.log(`[DialogManager] Looking for choice-${index}:`, button);
                
                if (button) {
                    // Remove old listeners by cloning node
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    // Add new listener
                    newButton.addEventListener('click', (e) => {
                        console.log(`[DialogManager] Choice ${index} clicked!`);
                        e.preventDefault();
                        e.stopPropagation();
                        this.handleChoice(choice, index);
                    });
                    
                    // Hover effects
                    newButton.addEventListener('mouseenter', (e) => {
                        e.target.style.background = 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)';
                        e.target.style.transform = 'translateX(10px)';
                        e.target.style.borderColor = '#ffffff';
                    });
                    newButton.addEventListener('mouseleave', (e) => {
                        e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.borderColor = '#00ffff';
                    });
                    
                    console.log(`[DialogManager] ✅ Event listener attached to choice-${index}`);
                }
            });
        } else {
            const continueBtn = document.getElementById('continue-button');
            console.log('[DialogManager] Looking for continue-button:', continueBtn);
            
            if (continueBtn) {
                // Remove old listeners
                const newButton = continueBtn.cloneNode(true);
                continueBtn.parentNode.replaceChild(newButton, continueBtn);
                
                // Add new listener
                newButton.addEventListener('click', (e) => {
                    console.log('[DialogManager] 🖱️ Continue button clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleContinue();
                });
                
                // Hover effects
                newButton.addEventListener('mouseenter', (e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.background = '#00cccc';
                });
                newButton.addEventListener('mouseleave', (e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = '#00ffff';
                });
                
                console.log('[DialogManager] ✅ Event listener attached to continue button');
            } else {
                console.error('[DialogManager] ❌ Continue button not found!');
            }
        }
    }

    addDialogStyles() {
        // Check if styles already added
        if (document.getElementById('dialog-styles')) return;

        const style = document.createElement('style');
        style.id = 'dialog-styles';
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(100px);
                    opacity: 0;
                } 
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            #story-dialog {
                animation: slideUp 0.5s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    handleChoice(choice, index) {
        console.log(`[DialogManager] Choice ${index} selected:`, choice);

        // Add score
        if (choice.score > 0) {
            const newScore = this.scoreManager.addScore(choice.score);
            this.showScoreChange(choice.score, newScore);
        }

        // Hide current dialog with animation
        this.hideDialog();

        // Call callback after animation
        setTimeout(() => {
            // CRITICAL FIX: Set isShowing to false BEFORE calling callback
            this.isShowing = false;
            
            if (this.onChoiceCallback) {
                this.onChoiceCallback(choice, index);
            }

            // Process next dialog in queue
            if (this.dialogQueue.length > 0) {
                const nextDialog = this.dialogQueue.shift();
                setTimeout(() => this.showDialog(nextDialog), 500);
            }
        }, 500);
    }

    handleContinue() {
        console.log('[DialogManager] Continue clicked');
        console.log('[DialogManager] Current callback:', this.onChoiceCallback);
        console.log('[DialogManager] Dialog queue length:', this.dialogQueue.length);
        
        this.hideDialog();

        setTimeout(() => {
            // CRITICAL FIX: Set isShowing to false BEFORE calling callback
            // This allows the callback to immediately show the next dialog
            this.isShowing = false;
            
            if (this.onChoiceCallback) {
                console.log('[DialogManager] Calling callback...');
                try {
                    this.onChoiceCallback(null, -1);
                    console.log('[DialogManager] ✅ Callback executed successfully');
                } catch (error) {
                    console.error('[DialogManager] ❌ Error in callback:', error);
                }
            } else {
                console.warn('[DialogManager] ⚠️ No callback set!');
            }

            // Process queued dialogs if any
            if (this.dialogQueue.length > 0) {
                const nextDialog = this.dialogQueue.shift();
                console.log('[DialogManager] Showing next dialog from queue');
                setTimeout(() => this.showDialog(nextDialog), 500);
            } else {
                console.log('[DialogManager] No more dialogs in queue');
            }
        }, 500);
    }

    showScoreChange(points, newScore) {
        const changeDiv = document.createElement('div');
        changeDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            padding: 20px 40px;
            border-radius: 15px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeIn 0.3s ease-in;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        `;

        changeDiv.innerHTML = `
            Corruption +${points}%<br>
            <span style="font-size: 18px;">Total: ${newScore}%</span>
        `;

        document.body.appendChild(changeDiv);

        setTimeout(() => {
            changeDiv.style.animation = 'fadeOut 0.3s ease-out';
            changeDiv.style.opacity = '0';
            setTimeout(() => changeDiv.remove(), 300);
        }, 1500);

        // Update score UI
        this.scoreManager.showScoreUI();
    }

    hideDialog() {
        const dialog = document.getElementById('story-dialog');
        if (dialog) {
            dialog.style.animation = 'fadeOut 0.3s ease-out';
            dialog.style.opacity = '0';
            setTimeout(() => dialog.remove(), 300);
        }

        const backdrop = document.getElementById('dialog-backdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.3s';
            setTimeout(() => backdrop.remove(), 300);
        }

        // Re-enable camera controls
        this.enableCameraControls();
    }

    // Hide all UI elements
    hideAll() {
        this.hideDialog();
        this.scoreManager.hideScoreUI();
        this.isShowing = false;
        this.dialogQueue = [];
        
        // Remove backdrop if exists
        const backdrop = document.getElementById('dialog-backdrop');
        if (backdrop) backdrop.remove();
        
        // Re-enable camera
        this.enableCameraControls();
    }

    // Show ending screen
    showEnding() {
        this.hideAll();

        const ending = this.scoreManager.getEnding();
        console.log('[DialogManager] Showing ending:', ending);

        const endingDiv = document.createElement('div');
        endingDiv.id = 'ending-screen';
        endingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 1s ease-in;
        `;

        endingDiv.innerHTML = `
            <div style="
                max-width: 700px;
                text-align: center;
                color: white;
                padding: 40px;
            ">
                <h1 style="
                    font-size: 48px;
                    margin-bottom: 20px;
                    color: ${ending.color};
                    text-shadow: 0 0 20px ${ending.color};
                ">
                    ${ending.title}
                </h1>
                
                <div style="
                    font-size: 20px;
                    margin: 30px 0;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    line-height: 1.8;
                ">
                    ${ending.description}
                </div>

                <div style="
                    font-size: 36px;
                    margin: 30px 0;
                    color: ${ending.color};
                ">
                    Final Corruption Score: ${this.scoreManager.getScore()}%
                </div>

                <button id="restart-button" style="
                    padding: 15px 40px;
                    background: ${ending.color};
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.3s;
                ">
                    Main Lagi
                </button>

                <button id="back-to-menu" style="
                    padding: 15px 40px;
                    background: #333;
                    border: 2px solid white;
                    border-radius: 10px;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 10px;
                    transition: all 0.3s;
                ">
                    Kembali ke Menu
                </button>
            </div>
        `;

        document.body.appendChild(endingDiv);

        // Event listeners
        const restartBtn = document.getElementById('restart-button');
        const menuBtn = document.getElementById('back-to-menu');

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.scoreManager.resetScore();
                window.location.href = window.location.pathname + '?scene=a_scene1';
            });
            restartBtn.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.1)';
            });
            restartBtn.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1)';
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.scoreManager.resetScore();
                window.location.href = window.location.pathname + '?scene=westgate';
            });
            menuBtn.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.background = '#555';
            });
            menuBtn.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.background = '#333';
            });
        }
    }

    getScoreManager() {
        return this.scoreManager;
    }
}