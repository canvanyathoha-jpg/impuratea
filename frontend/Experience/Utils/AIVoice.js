/**
 * AIVoice - Text-to-Speech utility class using Web Speech API
 * Provides AI voice narration for game dialogues and speeches
 */

import { languageManager } from './LanguageManager.js';

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
        this.currentLanguage = languageManager.getLanguage();

        // Initialize voices
        this.initVoices();

        // Listen for language changes
        this.languageChangeHandler = (event) => {
            const newLang = event.detail?.language || languageManager.getLanguage();
            console.log("[AIVoice] Language changed to:", newLang);
            this.currentLanguage = newLang;
            this.selectBestVoice();
        };
        window.addEventListener('languageChanged', this.languageChangeHandler);

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
        const targetLang = this.currentLanguage || languageManager.getLanguage();
        const isIndonesian = targetLang === 'id';
        
        let bestVoice = null;
        
        if (isIndonesian) {
            // Try to find Indonesian voice first
            bestVoice = this.voices.find(voice =>
                voice.lang === 'id-ID' || voice.lang.startsWith('id')
            );
        } else {
            // For English, try to find English voice
            bestVoice = this.voices.find(voice =>
                voice.lang === 'en-US' || voice.lang === 'en-GB' || voice.lang.startsWith('en')
            );
        }

        // If no language-specific voice, try to find a good quality voice
        if (!bestVoice) {
            // Prefer Google voices or Microsoft voices
            bestVoice = this.voices.find(voice =>
                voice.name.includes('Google') || voice.name.includes('Microsoft')
            );
        }

        // Fallback to first available voice
        if (!bestVoice && this.voices.length > 0) {
            bestVoice = this.voices[0];
        }

        this.selectedVoice = bestVoice;
        console.log("[AIVoice] Selected voice:", bestVoice?.name || 'None', `for language: ${targetLang}`);
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
        
        // Set language based on current language setting
        const targetLang = this.currentLanguage || languageManager.getLanguage();
        this.utterance.lang = targetLang === 'id' ? 'id-ID' : 'en-US';

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

        // Remove language change listener
        if (this.languageChangeHandler) {
            window.removeEventListener('languageChanged', this.languageChangeHandler);
            this.languageChangeHandler = null;
        }

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
