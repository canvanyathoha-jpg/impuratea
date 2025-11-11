/**
 * DialogManager.js
 * Manages story dialogs, choices, and scene progression
 */

import { languageManager } from './LanguageManager.js';

export default class DialogManager {
    constructor(experience = null) {
        this.experience = experience;
        // Safely get scoreManager - check if experience exists first
        this.scoreManager = (this.experience && this.experience.scoreManager) ? this.experience.scoreManager : null;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.isShowing = false;
        this.onChoiceCallback = null;
        this.languageManager = languageManager;
        
        // Listen for language changes to update UI
        this.languageManager.onLanguageChange(() => {
            this.updateUIForLanguage();
        });

        // Auto-play settings
        this.autoPlayEnabled = false;
        this.autoPlaySpeed = 3000; // milliseconds per dialog (default 3 seconds)
        this.autoPlayTimer = null;
        
        // Dialog countdown timer (20 seconds default)
        this.dialogTimerDuration = 20000; // 20 seconds in milliseconds
        this.dialogTimerRequest = null;
        this.dialogTimerInterval = null; // Backup interval timer
        this.dialogTimerEnd = null;
        this.dialogTimerStartTime = null; // Track when timer started
        this.dialogTimerActive = false;
        this.dialogTimerRemaining = this.dialogTimerDuration;
        this.isHandlingTimeout = false;
        this.currentDialogHasChoices = false;
        this.timerLastUpdate = null; // Track last update time for recovery
        this.timerRecoveryAttempts = 0; // Track recovery attempts to prevent infinite loops
        this.maxRecoveryAttempts = 3; // Maximum recovery attempts
        
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
        
        historyButton.innerHTML = `📜 ${this.languageManager.t('ui.history', 'History')} (${this.dialogHistory.length})`;
        
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
            this.permanentHistoryButton.innerHTML = `📜 ${this.languageManager.t('ui.history', 'History')} (${this.dialogHistory.length})`;
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
        // Reset any pending timeout handlers before showing new dialog
        this.clearDialogTimer();
        this.isHandlingTimeout = false;

        if (this.isShowing) {
            console.log('[DialogManager] Dialog already showing, queueing...');
            this.dialogQueue.push(config);
            return;
        }

        this.isShowing = true;
        this.currentDialog = config;
        this.onChoiceCallback = config.onChoice;

        console.log('[DialogManager] Showing dialog:', config);
        console.log('[DialogManager] Dialog text:', config.text);
        console.log('[DialogManager] Dialog speaker:', config.speaker);
        console.log('[DialogManager] Dialog choices:', config.choices);

        // Add to dialog history
        this.addToHistory(config);

        // Camera controls tetap enabled agar player bisa melihat lingkungan saat dialog
        // this.disableCameraControls(); // DISABLED - biarkan kamera tetap bisa digerakkan

        // Create dialog container
        try {
            this.createDialogUI(config);
            console.log('[DialogManager] Dialog UI created successfully');
        } catch (error) {
            console.error('[DialogManager] Error creating dialog UI:', error);
            this.isShowing = false;
            return;
        }
        
        // Start countdown timer after DOM is ready
        // Use setTimeout to ensure DOM elements are fully rendered
        setTimeout(() => {
            this.startDialogTimer(config);
        }, 50);
        
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
        // Use very high z-index to ensure dialog is always on top
        // Also ensure visibility is explicitly set
        dialogDiv.style.cssText = `
            position: fixed !important;
            bottom: 80px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 80% !important;
            max-width: 800px !important;
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(10px) !important;
            padding: 30px !important;
            border-radius: 15px !important;
            border: 3px solid #1976d2 !important;
            color: #212121 !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            z-index: 99999 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
            animation: slideUp 0.5s ease-out !important;
            pointer-events: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
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
                const speakerText = this.languageManager.translate(config.speaker);
                const isTeacher = speakerText.includes("Guru") || speakerText.toLowerCase().includes("teacher");
                const isBatin = speakerText.includes("batin") || speakerText.toLowerCase().includes("inner");
                
                // Warna gelap untuk kontras dengan background putih
                const speakerColor = isTeacher ? '#b8860b' : isBatin ? '#1565c0' : '#1976d2'; // Dark colors untuk semua
                const speakerEmoji = isTeacher ? '👨‍🏫' : isBatin ? '💭' : '👤';
                
                html += `
                    <div style="font-size: 16px; color: ${speakerColor}; margin-bottom: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span>${speakerEmoji}</span>
                        <span>${speakerText}</span>
                    </div>
                `;
            }

            // Dialog text dengan warna gelap HITAM untuk kontras maksimal dengan background putih
            // Translate dialog text if it's bilingual object, otherwise use as is
            const dialogText = this.languageManager.translate(config.text);
            const speakerText = config.speaker ? this.languageManager.translate(config.speaker) : '';
            const isTeacher = speakerText && (speakerText.includes("Guru") || speakerText.toLowerCase().includes("teacher"));
            const textColor = '#000000'; // HITAM MURNI untuk kontras maksimal
            
            html += `
                <div style="font-size: 20px; line-height: 1.8; margin-bottom: 20px; color: ${textColor}; font-weight: 600; text-shadow: none; ${isTeacher ? 'border-left: 3px solid #ffd700; padding-left: 15px;' : ''}">
                    ${dialogText}
                </div>
            `;
        }

        const timerLabel = this.languageManager.t('ui.timeRemaining', 'Time Remaining');
        const autoAdvanceNotice = this.languageManager.t(
            'ui.autoAdvanceNotice',
            'If time runs out, the story will move on automatically.'
        );

        const timerBlock = `
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 14px; font-weight: 700; color: #d32f2f;">
                        ⏳ ${timerLabel}: <span id="dialog-countdown">20.0s</span>
                    </div>
                    <div id="dialog-timer-bar" style="
                        flex: 1;
                        height: 8px;
                        margin-left: 12px;
                        border-radius: 4px;
                        background: linear-gradient(90deg, #43a047 0%, #fdd835 60%, #e53935 100%);
                        position: relative;
                        overflow: hidden;
                    ">
                        <span id="dialog-timer-progress" style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            height: 100%;
                            width: 100%;
                            background: rgba(255,255,255,0.65);
                            transform-origin: left center;
                            transition: width 0.2s ease-out;
                        "></span>
                    </div>
                </div>
                <p style="margin: 0; font-size: 12px; color: #555;">
                    ${autoAdvanceNotice}
                </p>
            </div>
        `;

        // Choices (if provided)
        if (config.choices && config.choices.length > 0) {
            html += timerBlock;

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
                        <strong style="color: ${labelColor};">[${letter}]</strong> ${this.languageManager.translate(choice.text)}
                    </button>
                `;
            });

            html += `</div>`;
        } else {
            html += timerBlock;
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
                    ${this.languageManager.t('choices.continue', 'Continue')} →
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
        
        // Ensure dialog is appended to body and visible
        try {
            document.body.appendChild(dialogDiv);
            console.log('[DialogManager] Dialog element appended to body');
            
            // Verify dialog is actually in DOM
            const verifyDialog = document.getElementById('story-dialog');
            if (verifyDialog) {
                console.log('[DialogManager] Dialog verified in DOM');
                console.log('[DialogManager] Dialog style:', window.getComputedStyle(verifyDialog).display);
                console.log('[DialogManager] Dialog z-index:', window.getComputedStyle(verifyDialog).zIndex);
            } else {
                console.error('[DialogManager] ERROR: Dialog element not found in DOM after append!');
            }
        } catch (error) {
            console.error('[DialogManager] Error appending dialog to body:', error);
        }

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
     * Start the countdown timer for choice dialogs
     * Uses both requestAnimationFrame and setInterval for reliability
     * @param {Object} config - Current dialog configuration
     * @param {number|null} overrideRemaining - Optional remaining time in ms (used when re-rendering)
     */
    startDialogTimer(config, overrideRemaining = null) {
        if (!config) {
            return;
        }

        // Clear any existing timers first
        this.clearDialogTimer();

        // Calculate remaining time - prioritize override, then use full duration
        const remainingMs =
            typeof overrideRemaining === 'number' && overrideRemaining >= 0
                ? Math.max(0, Math.min(overrideRemaining, this.dialogTimerDuration))
                : this.dialogTimerDuration;

        // Initialize timer state with absolute timestamps
        const now = performance.now();
        this.dialogTimerActive = true;
        this.dialogTimerRemaining = remainingMs;
        this.dialogTimerStartTime = now;
        this.dialogTimerEnd = now + remainingMs;
        this.timerLastUpdate = now;
        this.timerRecoveryAttempts = 0; // Reset recovery attempts when starting new timer
        this.currentDialogHasChoices =
            Array.isArray(config.choices) && config.choices.length > 0;

        // Get UI elements (will be checked on each update in case DOM changes)
        const getUIElements = () => {
            return {
                countdown: document.getElementById('dialog-countdown'),
                progress: document.getElementById('dialog-timer-progress')
            };
        };

        const refreshUI = (remaining) => {
            const elements = getUIElements();
            if (elements.countdown) {
                elements.countdown.textContent = this.formatTimerLabel(remaining);
            }
            if (elements.progress) {
                // Calculate progress based on remaining time vs full duration
                const clamped = Math.max(
                    0,
                    Math.min(1, remaining / this.dialogTimerDuration)
                );
                elements.progress.style.width = `${clamped * 100}%`;
            }
        };

        // Initial UI update
        refreshUI(this.dialogTimerRemaining);

        // Main update function - calculates remaining time from end time
        // This approach is more reliable as it uses absolute end time
        const updateTimer = () => {
            // Safety check: only stop if timer is explicitly inactive
            // Don't check isShowing here to allow timer to continue during dialog updates
            if (!this.dialogTimerActive) {
                return;
            }

            // Calculate remaining time based on end time (more reliable)
            const now = performance.now();
            let remaining = 0;
            
            if (this.dialogTimerEnd && this.dialogTimerStartTime) {
                // Primary method: calculate from end time
                remaining = Math.max(0, this.dialogTimerEnd - now);
            } else if (this.dialogTimerStartTime) {
                // Fallback: calculate from start time if end time is missing
                const elapsed = now - this.dialogTimerStartTime;
                const initialRemaining = this.dialogTimerRemaining || this.dialogTimerDuration;
                remaining = Math.max(0, initialRemaining - elapsed);
            } else {
                // Last resort: use stored remaining time
                remaining = this.dialogTimerRemaining || 0;
            }
            
            // Update state
            this.dialogTimerRemaining = remaining;
            this.timerLastUpdate = now;

            // Update UI (will handle missing elements gracefully)
            refreshUI(remaining);

            // Check if timer expired
            if (remaining <= 0) {
                // Only handle timeout if dialog is still showing
                if (this.isShowing) {
                    this.clearDialogTimer();
                    // Ensure UI shows 0.0s before timeout
                    refreshUI(0);
                    // Small delay to ensure UI is updated
                    setTimeout(() => {
                        this.handleDialogTimeout();
                    }, 50);
                } else {
                    // Dialog was closed, just clear timer
                    this.clearDialogTimer();
                }
                return;
            }
        };

        // Use requestAnimationFrame for smooth UI updates (60fps)
        const updateWithRAF = () => {
            if (!this.dialogTimerActive) {
                return;
            }
            updateTimer();
            this.dialogTimerRequest = requestAnimationFrame(updateWithRAF);
        };

        // Use setInterval as backup/primary timer (updates every 100ms)
        // This ensures timer continues even if requestAnimationFrame is throttled
        // Store interval ID to prevent memory leaks
        const intervalId = setInterval(() => {
            // Double-check timer is still supposed to be active
            if (!this.dialogTimerActive) {
                try {
                    clearInterval(intervalId);
                } catch (error) {
                    console.warn('[DialogManager] Error clearing interval in callback:', error);
                }
                if (this.dialogTimerInterval === intervalId) {
                    this.dialogTimerInterval = null;
                }
                return;
            }
            
            // Ensure timer end time is still valid - recovery mechanism
            if (!this.dialogTimerEnd) {
                if (this.dialogTimerStartTime) {
                    // Try to recover: recalculate end time from start time and remaining time
                    const now = performance.now();
                    const elapsed = now - this.dialogTimerStartTime;
                    // Use stored remaining time if available, otherwise calculate from duration
                    const initialRemaining = this.dialogTimerRemaining > 0 
                        ? this.dialogTimerRemaining + elapsed 
                        : this.dialogTimerDuration;
                    this.dialogTimerEnd = now + Math.max(0, initialRemaining - elapsed);
                    console.warn(`[DialogManager] Timer recovery: recalculated end time from start time. Remaining: ${((this.dialogTimerEnd - now) / 1000).toFixed(1)}s`);
                    this.timerRecoveryAttempts = 0; // Reset recovery attempts on success
                } else {
                    // Both end time and start time are missing - timer state is corrupted
                    console.error('[DialogManager] Timer state corrupted: both end time and start time are missing');
                    // Don't try to recover here - just let the timer continue with last known remaining time
                    // The timer will eventually expire based on stored remaining time
                }
            }
            
            // Update timer
            updateTimer();
        }, 100); // Update every 100ms for accuracy
        
        // Store interval ID
        this.dialogTimerInterval = intervalId;

        // Start requestAnimationFrame loop for smoother UI updates
        this.dialogTimerRequest = requestAnimationFrame(updateWithRAF);

        console.log(`[DialogManager] Timer started: ${(remainingMs / 1000).toFixed(1)}s remaining, end time: ${new Date(now + remainingMs).toISOString()}`);
    }

    /**
     * Stop and clean up the active choice timer
     */
    clearDialogTimer() {
        // Only log if timer was actually active
        const wasActive = this.dialogTimerActive;
        
        // Cancel requestAnimationFrame
        if (this.dialogTimerRequest) {
            cancelAnimationFrame(this.dialogTimerRequest);
            this.dialogTimerRequest = null;
        }
        
        // Clear interval timer (use try-catch for safety)
        if (this.dialogTimerInterval) {
            try {
                clearInterval(this.dialogTimerInterval);
            } catch (error) {
                console.warn('[DialogManager] Error clearing interval:', error);
            }
            this.dialogTimerInterval = null;
        }
        
        // Reset timer state
        this.dialogTimerActive = false;
        this.dialogTimerEnd = null;
        this.dialogTimerStartTime = null;
        this.timerLastUpdate = null;
        this.dialogTimerRemaining = this.dialogTimerDuration;
        this.timerRecoveryAttempts = 0; // Reset recovery attempts
        
        if (wasActive) {
            console.log('[DialogManager] Timer cleared');
        }
    }

    /**
     * Get remaining countdown time in milliseconds
     */
    getDialogTimerRemaining() {
        if (!this.dialogTimerActive || !this.dialogTimerStartTime) {
            return this.dialogTimerDuration;
        }
        
        // Calculate remaining time based on elapsed time from start
        // This is more reliable than using dialogTimerEnd
        const now = performance.now();
        const elapsed = now - this.dialogTimerStartTime;
        const remaining = Math.max(0, this.dialogTimerDuration - elapsed);
        
        // Update stored remaining time
        this.dialogTimerRemaining = remaining;
        
        return remaining;
    }

    /**
     * Format countdown label (seconds with one decimal)
     */
    formatTimerLabel(milliseconds) {
        const seconds = milliseconds / 1000;
        return `${seconds.toFixed(1)}s`;
    }

    /**
     * Handle automatic advancement when player runs out of time
     */
    handleDialogTimeout() {
        if (this.isHandlingTimeout) {
            return;
        }
        this.isHandlingTimeout = true;

        console.warn('[DialogManager] Dialog timer expired – advancing automatically.');

        if (this.currentDialogHasChoices) {
            this.hideDialog();

            setTimeout(() => {
                this.isShowing = false;

                if (this.onChoiceCallback) {
                    try {
                        this.onChoiceCallback(null, -1, { timedOut: true });
                    } catch (error) {
                        console.error('[DialogManager] Error while handling timeout callback:', error);
                    }
                }

                if (this.dialogQueue.length > 0) {
                    const nextDialog = this.dialogQueue.shift();
                    setTimeout(() => this.showDialog(nextDialog), 500);
                }
            }, 400);
        } else {
            this.handleContinue({ timedOut: true, skipHide: false });
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
                
                // Translate speaker, text, and choices if they are bilingual objects
                const translatedSpeaker = entry.speaker ? this.languageManager.translate(entry.speaker) : 'Narator';
                const translatedText = entry.text ? this.languageManager.translate(entry.text) : '';
                const translatedChoices = entry.choices && Array.isArray(entry.choices) 
                    ? entry.choices.map(c => c ? this.languageManager.translate(c) : '').filter(c => c !== '')
                    : null;
                
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
                            ${translatedSpeaker}
                        </div>
                        <div style="font-size: 14px; line-height: 1.5;">
                            ${translatedText}
                        </div>
                        ${translatedChoices ? `
                            <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
                                Choices: ${translatedChoices.join(', ')}
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

        // Stop countdown timer once player has picked an option
        this.clearDialogTimer();

        // Add score silently (no visual feedback during gameplay)
        if (choice.score > 0 && this.scoreManager) {
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

    handleContinue(options = {}) {
        const { timedOut = false, skipHide = false } = options;
        console.log('[DialogManager] Continue triggered', { timedOut, skipHide });
        console.log('[DialogManager] Current callback:', this.onChoiceCallback);
        console.log('[DialogManager] Dialog queue length:', this.dialogQueue.length);
        
        this.clearDialogTimer();

        if (!skipHide) {
            this.hideDialog();
        }

        setTimeout(() => {
            this.isShowing = false;
            
            if (this.onChoiceCallback) {
                console.log('[DialogManager] Calling callback...');
                try {
                    this.onChoiceCallback(null, -1, { timedOut });
                    console.log('[DialogManager] ✅ Callback executed successfully');
                } catch (error) {
                    console.error('[DialogManager] ❌ Error in callback:', error);
                }
            } else {
                console.warn('[DialogManager] ⚠️ No callback set!');
            }

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
        // Ensure countdown timer stops when dialog is dismissed
        this.clearDialogTimer();

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
        this.clearDialogTimer();
        this.hideDialog();
        if (this.scoreManager) {
            this.scoreManager.hideScoreUI();
        }
        this.isShowing = false;
        this.dialogQueue = [];
        
        // Remove backdrop if exists
        const backdrop = document.getElementById('dialog-backdrop');
        if (backdrop) backdrop.remove();
        
        // Camera controls tidak perlu di-enable karena tidak pernah di-disable
        // this.enableCameraControls(); // DISABLED - kamera tetap enabled
    }
    
    /**
     * Update UI elements when language changes
     */
    updateUIForLanguage() {
        // Update history button
        this.updateHistoryButtonCounter();
        
        // Update current dialog if showing
        if (this.isShowing && this.currentDialog) {
            let remainingForTimer = null;
            if (this.dialogTimerActive) {
                remainingForTimer = this.getDialogTimerRemaining();
            }

            // Recreate dialog UI with new language
            const existing = document.getElementById('story-dialog');
            if (existing) {
                existing.remove();
            }
            this.createDialogUI(this.currentDialog);
            
            // Restart timer after DOM is ready, preserving remaining time
            setTimeout(() => {
                this.startDialogTimer(this.currentDialog, remainingForTimer);
            }, 50);
        }
        
        // Update history if showing
        const historyUI = document.getElementById('dialog-history-ui');
        if (historyUI) {
            // Recreate history UI with new language
            historyUI.remove();
            this.showHistory();
        }
        
        // Update ending screen if showing
        const endingScreen = document.getElementById('ending-screen');
        if (endingScreen) {
            // Recreate ending screen with new language
            endingScreen.remove();
            this.showEnding();
        }
    }

    // Show ending screen
    showEnding() {
        this.hideAll();
        
        // Enable and show score UI at ending (reveal corruption level now)
        if (this.scoreManager) {
            this.scoreManager.enableScoreUI();
        }

        const ending = this.scoreManager ? this.scoreManager.getEnding() : { title: 'Ending', message: 'The story has ended.' };
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
                max-width: 580px;
                text-align: center;
                color: white;
                padding: 10px 15px;
                box-sizing: border-box;
            ">
                <h1 style="
                    font-size: 28px;
                    margin: 0 0 8px 0;
                    color: ${ending.color};
                    text-shadow: 0 0 20px ${ending.color};
                ">
                    ${ending.title}
                </h1>
                
                <div style="
                    font-size: 14px;
                    margin: 10px 0;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    line-height: 1.4;
                ">
                    ${ending.description}
                </div>

                <div style="
                    font-size: 24px;
                    margin: 10px 0;
                    color: ${ending.color};
                ">
                    ${this.languageManager.t('ui.finalScore', 'Final Corruption Score')}: ${this.scoreManager ? this.scoreManager.getScore() : 0}%
                </div>

                <div style="
                    margin: 10px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(13, 71, 161, 0.2) 100%);
                    border-left: 4px solid #1976d2;
                    border-radius: 8px;
                    text-align: left;
                    box-shadow: 0 3px 10px rgba(25, 118, 210, 0.3);
                ">
                    <h2 style="
                        font-size: 16px;
                        margin: 0 0 8px 0;
                        color: #64b5f6;
                    ">
                        💡 ${this.languageManager.t('ui.wisdomTitle', 'Wisdom & Moral Message')}
                    </h2>
                    <div style="
                        font-size: 12px;
                        line-height: 1.3;
                        color: #e3f2fd;
                    ">
                        <p style="margin: 6px 0;">
                            <strong style="color: #90caf9;">✨ ${this.languageManager.t('ending.honestyFoundation', 'Honesty is the Foundation')}</strong><br/>
                            ${this.languageManager.t('ending.honestyFoundationDesc', 'Every dishonest act damages integrity. Honesty builds trust.')}
                        </p>
                        <p style="margin: 6px 0;">
                            <strong style="color: #90caf9;">🚫 ${this.languageManager.t('ending.corruptionStartsSmall', 'Corruption Starts from Small Things')}</strong><br/>
                            ${this.languageManager.t('ending.corruptionStartsSmallDesc', 'Cheating and buying answers are academic corruption that can grow larger.')}
                        </p>
                        <p style="margin: 6px 0;">
                            <strong style="color: #90caf9;">🌟 ${this.languageManager.t('ending.integrityMoreValuable', 'Integrity is More Valuable')}</strong><br/>
                            ${this.languageManager.t('ending.integrityMoreValuableDesc', 'Strong character is more valuable than high grades obtained through cheating.')}
                        </p>
                    </div>
                </div>

                <div style="
                    margin: 10px 0;
                    padding: 10px;
                    background: rgba(255, 193, 7, 0.15);
                    border: 2px solid #ffc107;
                    border-radius: 8px;
                    text-align: center;
                ">
                    <div style="
                        font-size: 14px;
                        font-weight: bold;
                        color: #ffc107;
                        margin-bottom: 6px;
                    ">
                        📌 ${this.languageManager.t('ui.rememberMessage', 'Remember This Message')}
                    </div>
                    <div style="
                        font-size: 12px;
                        line-height: 1.3;
                        color: #fff9c4;
                        font-style: italic;
                    ">
                        "${this.languageManager.t('ending.rememberQuote', 'Choose honesty, because it is the best investment for the future.')}"
                    </div>
                </div>

                <button id="restart-button" style="
                    padding: 10px 25px;
                    background: ${ending.color};
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: all 0.3s;
                ">
                    ${this.languageManager.t('ui.restart', 'Play Again')}
                </button>

                <button id="back-to-menu" style="
                    padding: 10px 25px;
                    background: #333;
                    border: 2px solid white;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 8px;
                    transition: all 0.3s;
                ">
                    ${this.languageManager.t('ui.backToMenu', 'Back to Menu')}
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
                if (this.scoreManager) {
                    this.scoreManager.resetScore();
                }
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
                if (this.scoreManager) {
                    this.scoreManager.resetScore();
                }
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


