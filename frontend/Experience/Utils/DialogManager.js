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

        // Auto-play settings
        this.autoPlayEnabled = false;
        this.autoPlaySpeed = 3000; // milliseconds per dialog (default 3 seconds)
        this.autoPlayTimer = null;
        
        // Dialog history
        this.dialogHistory = [];
        this.maxHistorySize = 50; // Maximum number of dialogs to keep in history

        // Create permanent history button di pojok kiri atas
        this.createPermanentHistoryButton();

        console.log('[DialogManager] Initialized');
    }
    
    /**
     * Create permanent history button di pojok kiri atas layar
     * Button ini terpisah dari dialog dan selalu terlihat
     */
    createPermanentHistoryButton() {
        // Remove existing button if any
        const existing = document.getElementById('dialog-history-button-permanent');
        if (existing) {
            existing.remove();
        }
        
        // Create new permanent button
        const historyButton = document.createElement('button');
        historyButton.id = 'dialog-history-button-permanent';
        historyButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 16px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 10011;
            font-family: 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
            backdrop-filter: blur(10px);
        `;
        
        historyButton.innerHTML = `📜 History (${this.dialogHistory.length})`;
        
        // Add click event listener
        historyButton.addEventListener('click', () => {
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.showHistory();
        });
        
        // Hover effects
        historyButton.addEventListener('mouseenter', (e) => {
            e.target.style.background = 'rgba(0, 255, 255, 0.2)';
            e.target.style.borderColor = '#00ffff';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.5)';
        });
        
        historyButton.addEventListener('mouseleave', (e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.8)';
            e.target.style.borderColor = '#00ffff';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
        });
        
        document.body.appendChild(historyButton);
        
        // Store reference untuk update counter
        this.permanentHistoryButton = historyButton;
    }
    
    /**
     * Update history button counter
     */
    updateHistoryButtonCounter() {
        if (this.permanentHistoryButton) {
            this.permanentHistoryButton.innerHTML = `📜 History (${this.dialogHistory.length})`;
        }
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

        // Add to dialog history
        this.addToHistory(config);

        // Camera controls tetap enabled agar player bisa melihat lingkungan saat dialog
        // this.disableCameraControls(); // DISABLED - biarkan kamera tetap bisa digerakkan

        // Create dialog container
        this.createDialogUI(config);
        
        // Don't show score UI during gameplay - only at ending
        // Score is still tracked in background silently
        
        // Start auto-play if enabled (only for non-choice dialogs)
        if (this.autoPlayEnabled && (!config.choices || config.choices.length === 0)) {
            this.startAutoPlay();
        }
    }
    
    /**
     * Add dialog to history
     */
    addToHistory(config) {
        const historyEntry = {
            speaker: config.speaker || 'Narator',
            text: config.text,
            timestamp: Date.now(),
            choices: config.choices ? config.choices.map(c => c.text) : null
        };
        
        this.dialogHistory.push(historyEntry);
        
        // Limit history size
        if (this.dialogHistory.length > this.maxHistorySize) {
            this.dialogHistory.shift();
        }
        
        // Update history button counter
        this.updateHistoryButtonCounter();
    }
    
    /**
     * Get dialog history
     */
    getHistory() {
        return [...this.dialogHistory];
    }
    
    /**
     * Start auto-play for current dialog
     */
    startAutoPlay() {
        // Clear any existing timer
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
        }
        
        // Only auto-play if there's no choice
        if (this.currentDialog && (!this.currentDialog.choices || this.currentDialog.choices.length === 0)) {
            this.autoPlayTimer = setTimeout(() => {
                this.handleContinue();
            }, this.autoPlaySpeed);
        }
    }
    
    /**
     * Stop auto-play
     */
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    /**
     * Set auto-play enabled/disabled
     */
    setAutoPlay(enabled) {
        this.autoPlayEnabled = enabled;
        if (enabled && this.currentDialog) {
            this.startAutoPlay();
        } else {
            this.stopAutoPlay();
        }
    }
    
    /**
     * Set auto-play speed (milliseconds)
     */
    setAutoPlaySpeed(speedMs) {
        this.autoPlaySpeed = Math.max(1000, Math.min(10000, speedMs)); // Clamp between 1-10 seconds
        if (this.autoPlayEnabled && this.currentDialog) {
            this.startAutoPlay();
        }
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

        // TIDAK PERLU BACKDROP GELAP - Dialog muncul tanpa overlay gelap untuk visibility yang lebih baik
        // Hapus backdrop untuk membuat dialog jelas tanpa overlay gelap

        const dialogDiv = document.createElement('div');
        dialogDiv.id = 'story-dialog';
        dialogDiv.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
            border: 3px solid #1976d2;
            color: #212121;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 10010; // Lebih tinggi dari showScreenSpeechBubble (10002) untuk memastikan choices tidak tertutup
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            animation: slideUp 0.5s ease-out;
            pointer-events: auto;
        `;

        let html = '';

        // Determine if this dialog text should be visually rendered by this UI.
        // Render SEMUA dialog di DialogManager untuk visibility yang jelas
        // Termasuk NPC dialogs yang dipanggil melalui DialogManager
        const shouldRenderText = true; // SELALU render untuk semua dialog yang masuk ke DialogManager

        if (shouldRenderText) {
            // Speaker name (if provided) - SELALU tampilkan dengan warna gelap yang kontras
            if (config.speaker) {
                // Different styling untuk berbagai jenis speaker
                const isTeacher = config.speaker.includes("Guru");
                const isBatin = config.speaker === "Kamu (batin)" || config.speaker.includes("batin");
                
                // Warna gelap untuk kontras dengan background putih
                const speakerColor = isTeacher ? '#b8860b' : isBatin ? '#1565c0' : '#1976d2'; // Dark colors untuk semua
                const speakerEmoji = isTeacher ? '👨‍🏫' : isBatin ? '💭' : '👤';
                
                html += `
                    <div style="font-size: 16px; color: ${speakerColor}; margin-bottom: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span>${speakerEmoji}</span>
                        <span>${config.speaker}</span>
                    </div>
                `;
            }

            // Dialog text dengan warna gelap HITAM untuk kontras maksimal dengan background putih
            const isTeacher = config.speaker?.includes("Guru");
            const textColor = '#000000'; // HITAM MURNI untuk kontras maksimal
            
            html += `
                <div style="font-size: 20px; line-height: 1.8; margin-bottom: 20px; color: ${textColor}; font-weight: 600; text-shadow: none; ${isTeacher ? 'border-left: 3px solid #ffd700; padding-left: 15px;' : ''}">
                    ${config.text}
                </div>
            `;
        }

        // Choices (if provided)
        if (config.choices && config.choices.length > 0) {
            html += `<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">`;
            
            config.choices.forEach((choice, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C...
                
                // Tentukan warna berdasarkan score: hijau untuk jujur (score 0), merah untuk korupsi (score > 0)
                const isHonest = choice.score === 0 || choice.score === undefined;
                const buttonColor = isHonest ? '#00ff00' : '#ff0000'; // Hijau untuk jujur, Merah untuk korupsi
                const bgGradient = isHonest 
                    ? 'linear-gradient(135deg, #0d4d00 0%, #0a3d00 100%)' // Hijau gelap untuk jujur
                    : 'linear-gradient(135deg, #4d0000 0%, #3d0000 100%)'; // Merah gelap untuk korupsi
                const labelColor = isHonest ? '#00ff00' : '#ff4444'; // Hijau terang/merah terang untuk label
                
                html += `
                    <button 
                        id="choice-${index}" 
                        class="choice-button"
                        style="
                            padding: 15px 20px;
                            background: ${bgGradient};
                            border: 2px solid ${buttonColor};
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
                        <strong style="color: ${labelColor};">[${letter}]</strong> ${choice.text}
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
        
        // Add auto-play controls and history button (only if no choices or after choices)
        if (!config.choices || config.choices.length === 0) {
            const autoPlayIndicator = this.autoPlayEnabled 
                ? `<div style="font-size: 12px; color: #1976d2; margin-top: 15px; text-align: center; font-weight: 600; padding: 5px;">
                    ⏩ Auto-play: ${(this.autoPlaySpeed / 1000).toFixed(1)}s
                   </div>`
                : '';
            
            html += autoPlayIndicator;
        }
        
        html += `
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                <button 
                    id="autoplay-toggle"
                    style="
                        padding: 8px 16px;
                        background: ${this.autoPlayEnabled ? '#00ff00' : '#666'};
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                >
                    ${this.autoPlayEnabled ? '⏸️ Auto-play: ON' : '▶️ Auto-play: OFF'}
                </button>
                ${!config.choices || config.choices.length === 0 ? `
                    <input 
                        type="range" 
                        id="autoplay-speed" 
                        min="1" 
                        max="10" 
                        value="${(this.autoPlaySpeed / 1000).toFixed(1)}"
                        style="width: 150px;"
                        title="Auto-play Speed"
                    />
                    <label for="autoplay-speed" style="font-size: 11px; color: #333; font-weight: 500;">
                        Speed: ${(this.autoPlaySpeed / 1000).toFixed(1)}s
                    </label>
                ` : ''}
            </div>
        `;

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
                    button.addEventListener('click', () => {
                        // Play click sound for button
                        if (this.experience && this.experience.soundManager) {
                            this.experience.soundManager.play('click', 0.6);
                        }
                        this.handleChoice(choice, index);
                    });
                    
                    // Hover effect - warna hover sesuai dengan jenis pilihan (jujur/korupsi)
                    button.addEventListener('mouseenter', (e) => {
                        const isHonest = choice.score === 0 || choice.score === undefined;
                        const hoverBg = isHonest 
                            ? 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)' // Hijau terang untuk jujur
                            : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'; // Merah terang untuk korupsi
                        e.target.style.background = hoverBg;
                        e.target.style.transform = 'translateX(10px)';
                        e.target.style.borderColor = isHonest ? '#00ff88' : '#ff8888';
                    });
                    button.addEventListener('mouseleave', (e) => {
                        const isHonest = choice.score === 0 || choice.score === undefined;
                        const normalBg = isHonest 
                            ? 'linear-gradient(135deg, #0d4d00 0%, #0a3d00 100%)' // Hijau gelap untuk jujur
                            : 'linear-gradient(135deg, #4d0000 0%, #3d0000 100%)'; // Merah gelap untuk korupsi
                        const borderColor = isHonest ? '#00ff00' : '#ff0000';
                        e.target.style.background = normalBg;
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.borderColor = borderColor;
                    });
                }
            });
        } else {
            const continueBtn = document.getElementById('continue-button');
            if (continueBtn) {
                continueBtn.addEventListener('click', () => {
                    // Play click sound for button
                    if (this.experience && this.experience.soundManager) {
                        this.experience.soundManager.play('click', 0.6);
                    }
                    this.handleContinue();
                });
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
                        // Play click sound for button
                        if (this.experience && this.experience.soundManager) {
                            this.experience.soundManager.play('click', 0.6);
                        }
                        this.handleChoice(choice, index);
                    });
                    
                    // Hover effects - warna hover sesuai dengan jenis pilihan (jujur/korupsi)
                    newButton.addEventListener('mouseenter', (e) => {
                        const isHonest = choice.score === 0 || choice.score === undefined;
                        const hoverBg = isHonest 
                            ? 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)' // Hijau terang untuk jujur
                            : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'; // Merah terang untuk korupsi
                        e.target.style.background = hoverBg;
                        e.target.style.transform = 'translateX(10px)';
                        e.target.style.borderColor = isHonest ? '#00ff88' : '#ff8888';
                    });
                    newButton.addEventListener('mouseleave', (e) => {
                        const isHonest = choice.score === 0 || choice.score === undefined;
                        const normalBg = isHonest 
                            ? 'linear-gradient(135deg, #0d4d00 0%, #0a3d00 100%)' // Hijau gelap untuk jujur
                            : 'linear-gradient(135deg, #4d0000 0%, #3d0000 100%)'; // Merah gelap untuk korupsi
                        const borderColor = isHonest ? '#00ff00' : '#ff0000';
                        e.target.style.background = normalBg;
                        e.target.style.transform = 'translateX(0)';
                        e.target.style.borderColor = borderColor;
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
                    // Play click sound for button
                    if (this.experience && this.experience.soundManager) {
                        this.experience.soundManager.play('click', 0.6);
                    }
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
        
        // Add auto-play toggle button listener
        const autoplayToggle = document.getElementById('autoplay-toggle');
        if (autoplayToggle) {
            autoplayToggle.addEventListener('click', () => {
                // Play click sound
                if (this.experience && this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
                this.setAutoPlay(!this.autoPlayEnabled);
                // Update button text and style
                autoplayToggle.textContent = this.autoPlayEnabled ? '⏸️ Auto-play: ON' : '▶️ Auto-play: OFF';
                autoplayToggle.style.background = this.autoPlayEnabled ? '#00ff00' : '#666';
            });
        }
        
        // History button sekarang permanent di pojok kiri atas, tidak perlu event listener lagi
        
        // Add auto-play speed slider
        const autoplaySpeedSlider = document.getElementById('autoplay-speed');
        if (autoplaySpeedSlider) {
            autoplaySpeedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                this.setAutoPlaySpeed(speed * 1000); // Convert to milliseconds
                // Update label
                const label = document.querySelector('label[for="autoplay-speed"]');
                if (label) {
                    label.textContent = `Speed: ${speed.toFixed(1)}s`;
                }
                // Update indicator if exists
                const indicator = document.querySelector('[data-autoplay-indicator]');
                if (indicator && this.autoPlayEnabled) {
                    indicator.textContent = `⏩ Auto-play: ${speed.toFixed(1)}s`;
                }
            });
        }
    }
    
    /**
     * Show dialog history
     */
    showHistory() {
        // Remove existing history UI
        const existing = document.getElementById('dialog-history-ui');
        if (existing) {
            existing.remove();
            return; // Toggle off
        }
        
        const historyDiv = document.createElement('div');
        historyDiv.id = 'dialog-history-ui';
        historyDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 700px;
            max-height: 70vh;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ffff;
            border-radius: 15px;
            padding: 20px;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 10020;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            overflow-y: auto;
        `;
        
        let historyHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #00ffff; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #00ffff;">📜 Dialog History</h2>
                <button id="close-history" style="
                    padding: 5px 15px;
                    background: #666;
                    border: none;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                ">✕ Close</button>
            </div>
        `;
        
        if (this.dialogHistory.length === 0) {
            historyHtml += `<div style="text-align: center; padding: 40px; color: #888;">No dialog history yet.</div>`;
        } else {
            this.dialogHistory.forEach((entry, index) => {
                const time = new Date(entry.timestamp).toLocaleTimeString();
                historyHtml += `
                    <div style="
                        margin-bottom: 15px;
                        padding: 15px;
                        background: rgba(0, 255, 255, 0.05);
                        border-left: 3px solid #00ffff;
                        border-radius: 5px;
                    ">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                            #${index + 1} - ${time}
                        </div>
                        <div style="font-weight: bold; color: #00ffff; margin-bottom: 8px;">
                            ${entry.speaker}
                        </div>
                        <div style="font-size: 14px; line-height: 1.5;">
                            ${entry.text}
                        </div>
                        ${entry.choices ? `
                            <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
                                Choices: ${entry.choices.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        historyDiv.innerHTML = historyHtml;
        document.body.appendChild(historyDiv);
        
        // Close button
        const closeBtn = document.getElementById('close-history');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (this.experience && this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
                historyDiv.remove();
            });
        }
        
        // Close on backdrop click
        historyDiv.addEventListener('click', (e) => {
            if (e.target === historyDiv) {
                if (this.experience && this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
                historyDiv.remove();
            }
        });
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

        // Add score silently (no visual feedback during gameplay)
        if (choice.score > 0) {
            this.scoreManager.addScore(choice.score);
            // Don't show score change notification - keep it hidden until ending
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
        // Disabled - score changes are hidden during gameplay
        // Score is only revealed at ending
        // This method is kept for backward compatibility but does nothing
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

        // Camera controls tidak perlu di-enable karena tidak pernah di-disable
        // this.enableCameraControls(); // DISABLED - kamera tetap enabled
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
        
        // Camera controls tidak perlu di-enable karena tidak pernah di-disable
        // this.enableCameraControls(); // DISABLED - kamera tetap enabled
    }

    // Show ending screen
    showEnding() {
        this.hideAll();
        
        // Enable and show score UI at ending (reveal corruption level now)
        this.scoreManager.enableScoreUI();

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
                // Play click sound for button
                if (this.experience && this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
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
                // Play click sound for button
                if (this.experience && this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
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


