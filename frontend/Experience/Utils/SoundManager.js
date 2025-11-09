/**
 * SoundManager.js
 * Manages sound effects for the game
 */

export default class SoundManager {
    static instance;
    
    constructor() {
        if (SoundManager.instance) {
            return SoundManager.instance;
        }
        
        SoundManager.instance = this;
        this.soundEnabled = true;
        this.volume = 0.5;
        this.sounds = {};
        
        // Preload sound files (using Web Audio API or HTML5 Audio)
        this.loadSounds();
        
        console.log('[SoundManager] Initialized');
    }
    
    /**
     * Load sound files
     * Note: You'll need to add sound files to your public/media folder
     */
    loadSounds() {
        // Map of sound names to file paths
        // OPTIMIZATION: Removed ambientClassroom - file doesn't exist
        const soundFiles = {
            hover: '/media/sounds/hover.mp3',      // Hover sound
            click: '/media/sounds/click.mp3',       // Click sound
            dialogOpen: '/media/sounds/dialog_open.mp3', // Dialog open
            dialogClose: '/media/sounds/dialog_close.mp3', // Dialog close
        };
        
        // Ambient sounds (loopable)
        this.ambientSounds = {};
        
        // Try to load sounds, but gracefully handle if files don't exist
        Object.keys(soundFiles).forEach(soundName => {
            try {
                const audio = new Audio(soundFiles[soundName]);
                audio.preload = 'auto';
                audio.volume = this.volume;
                
                // Handle loading errors and success
                audio.addEventListener('error', (e) => {
                    console.warn(`[SoundManager] Could not load sound: ${soundName}`, e);
                    this.sounds[soundName] = null;
                });
                
                audio.addEventListener('canplaythrough', () => {
                    console.log(`[SoundManager] Sound loaded successfully: ${soundName}`);
                });
                
                // Try to load the audio
                audio.load();

                // All sounds are normal (non-loopable) for now
                this.sounds[soundName] = audio;
            } catch (error) {
                console.warn(`[SoundManager] Error creating audio for ${soundName}:`, error);
                this.sounds[soundName] = null;
            }
        });
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     * @param {number} volume - Optional volume override (0-1)
     */
    play(soundName, volume = null) {
        if (!this.soundEnabled) {
            console.log(`[SoundManager] Sound disabled, skipping: ${soundName}`);
            return;
        }
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.log(`[SoundManager] Sound not found: ${soundName}, using fallback`);
            // If sound file doesn't exist, create a simple tone as fallback
            this.playFallbackSound(soundName);
            return;
        }
        
        // Clone and play to allow overlapping sounds
        try {
            const audio = sound.cloneNode ? sound.cloneNode() : new Audio(sound.src);
            audio.volume = volume !== null ? Math.max(0, Math.min(1, volume)) : this.volume;
            
            // Reset to start
            audio.currentTime = 0;
            
            // Play with error handling
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`[SoundManager] Playing sound: ${soundName}`);
                    })
                    .catch(error => {
                        // Handle autoplay restrictions - this is common on first interaction
                        console.warn(`[SoundManager] Could not play sound ${soundName}:`, error);
                        // Try fallback for important sounds
                        if (soundName === 'click' || soundName === 'hover') {
                            this.playFallbackSound(soundName);
                        }
                    });
            }
        } catch (error) {
            console.warn(`[SoundManager] Error playing sound ${soundName}:`, error);
            // Try fallback for important sounds
            if (soundName === 'click' || soundName === 'hover') {
                this.playFallbackSound(soundName);
            }
        }
    }
    
    /**
     * Fallback: Generate simple tone if sound file doesn't exist
     * This ensures there's always some audio feedback
     */
    playFallbackSound(soundName) {
        if (!this.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different sounds
            const frequencies = {
                hover: 800,
                click: 600,
                dialogOpen: 1000,
                dialogClose: 500
            };
            
            oscillator.frequency.value = frequencies[soundName] || 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silently fail if Web Audio API is not available
            console.warn('[SoundManager] Web Audio API not available');
        }
    }
    
    /**
     * Set sound enabled/disabled
     */
    setEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Play ambient sound (loopable background sound)
     * @param {string} soundName - Name of the ambient sound
     * @param {number} volume - Optional volume override (0-1)
     */
    playAmbient(soundName, volume = null) {
        if (!this.soundEnabled) return;
        
        const sound = this.ambientSounds[soundName];
        if (!sound) {
            console.warn(`[SoundManager] Ambient sound not found: ${soundName}`);
            return;
        }
        
        try {
            sound.volume = volume !== null ? Math.max(0, Math.min(1, volume)) : 0.3;
            sound.currentTime = 0;
            
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`[SoundManager] Playing ambient sound: ${soundName}`);
                    })
                    .catch(error => {
                        console.warn(`[SoundManager] Could not play ambient sound ${soundName}:`, error);
                    });
            }
        } catch (error) {
            console.warn(`[SoundManager] Error playing ambient sound ${soundName}:`, error);
        }
    }
    
    /**
     * Stop ambient sound
     * @param {string} soundName - Name of the ambient sound to stop
     */
    stopAmbient(soundName) {
        const sound = this.ambientSounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
            console.log(`[SoundManager] Stopped ambient sound: ${soundName}`);
        }
    }
    
    /**
     * Stop all ambient sounds
     */
    stopAllAmbient() {
        Object.keys(this.ambientSounds).forEach(soundName => {
            this.stopAmbient(soundName);
        });
    }
}

