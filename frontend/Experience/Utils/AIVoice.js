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

        // Set this as the active instance
        activeAIVoiceInstance = this;

        console.log("[AIVoice] AI Voice system initialized (no UI controls)");
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
            console.log("[AIVoice] Started speaking:", text.substring(0, 50) + "...");
        };

        this.utterance.onend = () => {
            this.isSpeaking = false;
            console.log("[AIVoice] Finished speaking");

            if (options.onEnd) {
                options.onEnd();
            }
        };

        this.utterance.onerror = (event) => {
            if (event.error === "not-allowed") {
                console.warn("[AIVoice] Browser blocked speech synthesis (user interaction required).");
            } else {
                console.error("[AIVoice] Speech error:", event.error);
            }
            this.isSpeaking = false;
        };

        // Speak the text
        try {
            this.synthesis.speak(this.utterance);
        } catch (error) {
            console.warn("[AIVoice] Unable to start speech synthesis:", error.message || error);
            this.isSpeaking = false;
        }
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            console.log("[AIVoice] Speech stopped");
        }
    }

    /**
     * Pause current speech
     */
    pause() {
        if (this.synthesis.speaking && !this.synthesis.paused) {
            this.synthesis.pause();
            this.isPaused = true;
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

        // Clear global instance reference if this is the active instance
        if (activeAIVoiceInstance === this) {
            activeAIVoiceInstance = null;
        }

        // Clear all properties
        this.utterance = null;
        this.isSpeaking = false;
        this.isPaused = false;

        console.log("[AIVoice] AI Voice system disposed successfully (no UI controls to clean)");
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
