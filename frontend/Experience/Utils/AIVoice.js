/**
 * AIVoice - Text-to-Speech utility class using Web Speech API
 * Provides AI voice narration for game dialogues and speeches
 */

// Global variable to track active AI Voice instance
let activeAIVoiceInstance = null;

export default class AIVoice {
    constructor() {
        // Remove any existing AI Voice instance before creating new one
        if (activeAIVoiceInstance) {
            console.log("[AIVoice] Disposing existing instance before creating new one");
            activeAIVoiceInstance.dispose();
        }

        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.isSpeaking = false;
        this.isPaused = false;
        this.voices = [];
        this.selectedVoice = null;
        this.rate = 0.9; // Slightly slower for better comprehension
        this.pitch = 1.0;
        this.volume = 0.8; // 80% volume

        // Initialize voices
        this.initVoices();

        // Create UI controls
        this.createVoiceControls();

        // Set this as the active instance
        activeAIVoiceInstance = this;

        console.log("[AIVoice] AI Voice system initialized");
    }

    initVoices() {
        // Load available voices
        this.voices = this.synthesis.getVoices();

        // If voices not loaded yet, wait for voiceschanged event
        if (this.voices.length === 0) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.voices = this.synthesis.getVoices();
                this.selectBestVoice();
                console.log("[AIVoice] Voices loaded:", this.voices.length);
            });
        } else {
            this.selectBestVoice();
        }
    }

    selectBestVoice() {
        // Try to find Indonesian voice first
        let indonesianVoice = this.voices.find(voice =>
            voice.lang === 'id-ID' || voice.lang.startsWith('id')
        );

        // If no Indonesian voice, try to find a good quality voice
        if (!indonesianVoice) {
            // Prefer Google voices or Microsoft voices
            indonesianVoice = this.voices.find(voice =>
                voice.name.includes('Google') || voice.name.includes('Microsoft')
            );
        }

        // Fallback to first available voice
        if (!indonesianVoice && this.voices.length > 0) {
            indonesianVoice = this.voices[0];
        }

        this.selectedVoice = indonesianVoice;
        console.log("[AIVoice] Selected voice:", indonesianVoice?.name || 'None');
    }

    /**
     * Speak the given text with AI voice
     * @param {string} text - Text to speak
     * @param {object} options - Options for speech (rate, pitch, volume, onEnd callback)
     */
    speak(text, options = {}) {
        // Stop any ongoing speech
        this.stop();

        // Show controls when starting to speak
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'block';
        }

        // Create new utterance
        this.utterance = new SpeechSynthesisUtterance(text);

        // Set voice properties
        this.utterance.voice = this.selectedVoice;
        this.utterance.rate = options.rate || this.rate;
        this.utterance.pitch = options.pitch || this.pitch;
        this.utterance.volume = options.volume || this.volume;
        this.utterance.lang = 'id-ID'; // Indonesian language

        // Event handlers
        this.utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateVoiceControls();
            console.log("[AIVoice] Started speaking:", text.substring(0, 50) + "...");
        };

        this.utterance.onend = () => {
            this.isSpeaking = false;
            this.updateVoiceControls();
            console.log("[AIVoice] Finished speaking");

            // Auto-hide controls after speech ends (optional - keep visible for user control)
            // Uncomment the line below if you want controls to hide automatically
            // if (this.controlsContainer) this.controlsContainer.style.display = 'none';

            if (options.onEnd) {
                options.onEnd();
            }
        };

        this.utterance.onerror = (event) => {
            console.error("[AIVoice] Speech error:", event.error);
            this.isSpeaking = false;
            this.updateVoiceControls();
        };

        // Speak the text
        this.synthesis.speak(this.utterance);
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateVoiceControls();
            console.log("[AIVoice] Speech stopped");
        }

        // Hide controls when stopped
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
    }

    /**
     * Pause current speech
     */
    pause() {
        if (this.synthesis.speaking && !this.synthesis.paused) {
            this.synthesis.pause();
            this.isPaused = true;
            this.updateVoiceControls();
            console.log("[AIVoice] Speech paused");
        }
    }

    /**
     * Resume paused speech
     */
    resume() {
        if (this.synthesis.paused) {
            this.synthesis.resume();
            this.isPaused = false;
            this.updateVoiceControls();
            console.log("[AIVoice] Speech resumed");
        }
    }

    /**
     * Toggle pause/resume
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Create voice control UI
     */
    createVoiceControls() {
        // Remove ALL existing controls (by ID and by class) to prevent duplicates
        const existingControlsById = document.getElementById('ai-voice-controls');
        if (existingControlsById) {
            existingControlsById.remove();
        }

        // Also remove any orphaned controls
        const allExistingControls = document.querySelectorAll('[id="ai-voice-controls"]');
        allExistingControls.forEach(control => control.remove());

        // Create controls container
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'ai-voice-controls';
        this.controlsContainer.style.pointerEvents = 'none'; // Allow clicks to pass through container
        this.controlsContainer.style.display = 'none'; // Hidden by default, shown only when speaking
        this.controlsContainer.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid rgba(255, 215, 0, 0.6);
                border-radius: 15px;
                padding: 15px;
                z-index: 999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                min-width: 200px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                pointer-events: auto;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 5px;
                ">
                    <span style="
                        color: #FFD700;
                        font-size: 14px;
                        font-weight: bold;
                        font-family: Arial, sans-serif;
                    ">🎙️ AI Voice</span>
                    <button id="voice-toggle-btn" style="
                        background: rgba(255, 215, 0, 0.2);
                        border: 1px solid rgba(255, 215, 0, 0.5);
                        border-radius: 8px;
                        color: #FFD700;
                        padding: 5px 10px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255, 215, 0, 0.3)'" onmouseout="this.style.background='rgba(255, 215, 0, 0.2)'">
                        Minimize
                    </button>
                </div>
                <div id="voice-controls-content" style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 8px;">
                        <button id="voice-play-pause-btn" style="
                            flex: 1;
                            background: linear-gradient(135deg, #4CAF50, #45a049);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            padding: 8px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            ⏸️ Pause
                        </button>
                        <button id="voice-stop-btn" style="
                            flex: 1;
                            background: linear-gradient(135deg, #f44336, #da190b);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            padding: 8px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            ⏹️ Stop
                        </button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="color: #FFD700; font-size: 11px; font-family: Arial, sans-serif;">
                            Volume: <span id="volume-value">80%</span>
                        </label>
                        <input type="range" id="voice-volume-slider" min="0" max="100" value="80" style="
                            width: 100%;
                            cursor: pointer;
                        ">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="color: #FFD700; font-size: 11px; font-family: Arial, sans-serif;">
                            Speed: <span id="speed-value">0.9x</span>
                        </label>
                        <input type="range" id="voice-speed-slider" min="0.5" max="2" step="0.1" value="0.9" style="
                            width: 100%;
                            cursor: pointer;
                        ">
                    </div>
                    <div id="voice-status" style="
                        color: #888;
                        font-size: 11px;
                        text-align: center;
                        font-family: Arial, sans-serif;
                        padding: 5px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 5px;
                    ">
                        Ready
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.controlsContainer);

        // Add event listeners
        this.setupControlEventListeners();
    }

    setupControlEventListeners() {
        // Toggle minimize/maximize
        const toggleBtn = document.getElementById('voice-toggle-btn');
        const content = document.getElementById('voice-controls-content');
        let isMinimized = false;

        toggleBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;
            content.style.display = isMinimized ? 'none' : 'flex';
            toggleBtn.textContent = isMinimized ? 'Maximize' : 'Minimize';
        });

        // Play/Pause button
        document.getElementById('voice-play-pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        // Stop button
        document.getElementById('voice-stop-btn').addEventListener('click', () => {
            this.stop();
        });

        // Volume slider
        const volumeSlider = document.getElementById('voice-volume-slider');
        const volumeValue = document.getElementById('volume-value');
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            volumeValue.textContent = e.target.value + '%';
            if (this.utterance) {
                this.utterance.volume = this.volume;
            }
        });

        // Speed slider
        const speedSlider = document.getElementById('voice-speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            this.rate = parseFloat(e.target.value);
            speedValue.textContent = e.target.value + 'x';
            if (this.utterance) {
                this.utterance.rate = this.rate;
            }
        });
    }

    updateVoiceControls() {
        const playPauseBtn = document.getElementById('voice-play-pause-btn');
        const status = document.getElementById('voice-status');

        if (!playPauseBtn || !status) return;

        if (this.isSpeaking) {
            if (this.isPaused) {
                playPauseBtn.innerHTML = '▶️ Resume';
                playPauseBtn.style.background = 'linear-gradient(135deg, #2196F3, #0b7dda)';
                status.textContent = 'Paused';
                status.style.color = '#FFA500';
            } else {
                playPauseBtn.innerHTML = '⏸️ Pause';
                playPauseBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                status.textContent = 'Speaking...';
                status.style.color = '#4CAF50';
            }
        } else {
            playPauseBtn.innerHTML = '⏸️ Pause';
            playPauseBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            status.textContent = 'Ready';
            status.style.color = '#888';
        }
    }

    /**
     * Clean up and dispose AI voice system
     */
    dispose() {
        console.log("[AIVoice] Disposing AI Voice system...");

        // Stop all speech immediately
        this.stop();

        // Cancel all pending utterances
        if (this.synthesis) {
            this.synthesis.cancel();
        }

        // Remove UI controls
        if (this.controlsContainer && document.body.contains(this.controlsContainer)) {
            this.controlsContainer.remove();
            this.controlsContainer = null;
        }

        // Clear global instance reference if this is the active instance
        if (activeAIVoiceInstance === this) {
            activeAIVoiceInstance = null;
        }

        // Clear all properties
        this.utterance = null;
        this.isSpeaking = false;
        this.isPaused = false;

        console.log("[AIVoice] AI Voice system disposed successfully");
    }

    /**
     * Static method to stop all global speech synthesis
     */
    static stopAll() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (activeAIVoiceInstance) {
            activeAIVoiceInstance.dispose();
        }
    }
}
