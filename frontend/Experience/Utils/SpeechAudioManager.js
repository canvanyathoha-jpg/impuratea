/**
 * SpeechAudioManager - Manages text-to-speech audio for speech bubbles
 * Prioritas: ResponsiveVoice (Indonesian voices yang lebih natural) -> Web Speech API (fallback)
 */
export default class SpeechAudioManager {
    constructor() {
        // Check if ResponsiveVoice is available (prioritas utama untuk Indonesian voices)
        this.responsiveVoiceAvailable = typeof responsiveVoice !== 'undefined';
        
        // Check if browser supports Web Speech API (fallback)
        this.isSupported = 'speechSynthesis' in window;
        
        if (this.responsiveVoiceAvailable) {
            console.log('[SpeechAudioManager] ✅ ResponsiveVoice tersedia - menggunakan Indonesian voices');
        } else if (this.isSupported) {
            console.log('[SpeechAudioManager] ⚠️ ResponsiveVoice tidak tersedia - menggunakan Web Speech API sebagai fallback');
            // Initialize speech synthesis
            this.synthesis = window.speechSynthesis;
            
            // Get available voices (async, may take time to load)
            this.voices = [];
            this.loadVoices();
            
            // Listen for voices changed event
            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = () => this.loadVoices();
            }
        } else {
            console.warn('[SpeechAudioManager] ❌ Tidak ada TTS engine yang tersedia');
        }
        
        // Current utterance untuk stop jika perlu
        this.currentUtterance = null;
    }
    
    /**
     * Load available voices
     */
    loadVoices() {
        if (!this.isSupported) return;
        
        this.voices = this.synthesis.getVoices();
        console.log('[SpeechAudioManager] Loaded', this.voices.length, 'voices');
        
        // Log detailed voice information
        this.logAvailableVoices();
    }
    
    /**
     * Log semua available voices dengan detail (untuk debugging dan pemilihan voice)
     */
    logAvailableVoices() {
        if (this.voices.length === 0) return;
        
        console.log('\n=== AVAILABLE VOICES IN YOUR BROWSER ===');
        console.log(`Total: ${this.voices.length} voices\n`);
        
        // Kelompokkan voices berdasarkan bahasa dan gender
        const femaleVoices = this.voices.filter(v => {
            const name = v.name.toLowerCase();
            return !name.includes('male') && !name.includes('david') && 
                   !name.includes('mark') && !name.includes('richard') &&
                   !name.includes('alex') && !name.includes('tom') &&
                   !name.includes('daniel') && !name.includes('man') &&
                   !name.includes('andika');
        });
        
        const maleVoices = this.voices.filter(v => {
            const name = v.name.toLowerCase();
            return name.includes('male') || name.includes('david') || 
                   name.includes('mark') || name.includes('richard') ||
                   name.includes('alex') || name.includes('tom') ||
                   name.includes('daniel') || name.includes('andika');
        });
        
        const indonesianVoices = this.voices.filter(v => 
            v.lang.includes('id') || v.name.toLowerCase().includes('indonesian')
        );
        
        const googleVoices = this.voices.filter(v => 
            v.name.toLowerCase().includes('google')
        );
        
        console.log('📢 FEMALE VOICES (' + femaleVoices.length + '):');
        femaleVoices.forEach((v, i) => {
            const langInfo = v.lang.includes('id') ? '🇮🇩' : 
                            v.lang.includes('en-us') ? '🇺🇸' :
                            v.lang.includes('en-gb') ? '🇬🇧' :
                            v.lang.includes('en') ? '🇬🇧' : '🌍';
            console.log(`  ${i + 1}. ${langInfo} ${v.name} (${v.lang})`);
        });
        
        console.log('\n👨 MALE VOICES (' + maleVoices.length + '):');
        maleVoices.forEach((v, i) => {
            const langInfo = v.lang.includes('id') ? '🇮🇩' : 
                            v.lang.includes('en-us') ? '🇺🇸' :
                            v.lang.includes('en-gb') ? '🇬🇧' :
                            v.lang.includes('en') ? '🇬🇧' : '🌍';
            console.log(`  ${i + 1}. ${langInfo} ${v.name} (${v.lang})`);
        });
        
        console.log('\n🇮🇩 INDONESIAN VOICES (' + indonesianVoices.length + '):');
        indonesianVoices.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v.name} (${v.lang})`);
        });
        
        console.log('\n🔍 GOOGLE VOICES (' + googleVoices.length + '):');
        googleVoices.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v.name} (${v.lang})`);
        });
        
        console.log('\n=== RECOMMENDED FOR FEMALE NPC ===');
        const recommendedFemale = femaleVoices.filter(v => {
            const name = v.name.toLowerCase();
            return name.includes('google') || 
                   name.includes('zira') ||
                   name.includes('samantha') ||
                   name.includes('karen') ||
                   name.includes('susan');
        });
        
        if (recommendedFemale.length > 0) {
            recommendedFemale.forEach(v => {
                console.log(`  ✅ ${v.name} (${v.lang})`);
            });
        } else {
            console.log('  ⚠️ No recommended voices found. Using any available female voice.');
        }
        
        console.log('\n=====================================\n');
    }
    
    /**
     * Get voice berdasarkan gender dan bahasa
     * @param {string} gender - 'male' atau 'female'
     * @returns {SpeechSynthesisVoice|null} Voice yang sesuai
     */
    getVoice(gender = 'female') {
        if (!this.isSupported) {
            console.warn('[SpeechAudioManager] Web Speech API tidak didukung');
            return null;
        }
        
        // Pastikan voices sudah ter-load, jika belum reload
        if (this.voices.length === 0) {
            console.warn('[SpeechAudioManager] Voices belum ter-load, reloading...');
            this.loadVoices();
            
            // Jika masih kosong setelah reload, coba lagi setelah delay
            if (this.voices.length === 0) {
                setTimeout(() => {
                    this.loadVoices();
                    console.log('[SpeechAudioManager] Voices reloaded after delay:', this.voices.length);
                }, 100);
                return null;
            }
        }
        
        const isFemale = gender.toLowerCase() === 'female';
        console.log(`[SpeechAudioManager] 🎤 Looking for ${isFemale ? 'FEMALE' : 'MALE'} voice from ${this.voices.length} available voices`);
        
        // Prioritas 1: Indonesian voice dengan gender yang sesuai
        // Catatan: Microsoft hanya punya Andika (male) untuk Indonesian, tidak ada female Indonesian voice
        let voice = this.voices.find(v => {
            const isIndonesian = v.lang.includes('id') || 
                                v.name.includes('Indonesian') || 
                                v.name.includes('Indo');
            if (!isIndonesian) return false;
            
            const name = v.name.toLowerCase();
            if (isFemale) {
                // Untuk female, HINDARI yang jelas male (termasuk Andika)
                if (name.includes('male') || name.includes('laki') || name.includes('pria') ||
                    name.includes('andika') || name.includes('david') || name.includes('mark')) {
                    return false; // Reject male voices
                }
                // Sayangnya tidak ada Indonesian female voice di Microsoft
                // Jadi kita skip dan akan cari alternatif di prioritas berikutnya
                return name.includes('female') || name.includes('perempuan') || 
                       name.includes('wanita');
            } else {
                // Untuk male, gunakan Microsoft Andika (Indonesian male voice)
                if (name.includes('female') || name.includes('perempuan') || name.includes('wanita') ||
                    name.includes('zira')) {
                    return false; // Reject female voices
                }
                // Microsoft Andika adalah voice MALE untuk Indonesian - perfect untuk male NPC
                return name.includes('male') || name.includes('laki') || 
                       name.includes('pria') || name.includes('andika');
            }
        });
        
        // Prioritas 2: Cari voice yang lebih natural untuk bahasa Indonesia
        // Untuk female: Hindari Andika (male voice), fokus pada female voices yang natural
        if (!voice) {
            if (isFemale) {
                // Sub-prioritas 2a: Google female voices (biasanya lebih natural untuk berbagai bahasa)
                voice = this.voices.find(v => {
                    const name = v.name.toLowerCase();
                    const lang = v.lang.toLowerCase();
                    
                    // HINDARI yang jelas male (termasuk Andika)
                    if (name.includes('male') || name.includes('david') || 
                        name.includes('mark') || name.includes('richard') ||
                        name.includes('alex') || name.includes('tom') ||
                        name.includes('daniel') || name.includes('man') ||
                        name.includes('andika')) {
                        return false;
                    }
                    
                    // Prioritaskan Google female voices - lebih natural untuk non-English
                    if (name.includes('google') && (name.includes('female') || lang.includes('en'))) {
                        return true; // Google female voices lebih natural
                    }
                    
                    return false; // Skip untuk sub-prioritas ini
                });
                
                // Sub-prioritas 2b: Cari English female voices yang paling natural
                // Coba berbagai English female voices dan pilih yang terdengar lebih neutral
                if (!voice) {
                    // Cari English female voices dengan urutan prioritas:
                    // 1. Voices yang tidak terlalu kental aksennya (US English biasanya lebih neutral)
                    // 2. Voices yang tidak terlalu "nasal" atau "robotic"
                    const preferredFemaleNames = [
                        'zira',      // Microsoft Zira (US English - neutral)
                        'samantha',  // Apple Samantha (natural)
                        'karen',     // Microsoft Karen
                        'susan',     // Microsoft Susan
                        'hazel',     // Microsoft Hazel
                        'eva',       // Microsoft Eva
                        'maria',     // Microsoft Maria
                        'tessa',     // Microsoft Tessa
                        'victoria'   // Microsoft Victoria
                    ];
                    
                    for (const preferredName of preferredFemaleNames) {
                        voice = this.voices.find(v => {
                            const name = v.name.toLowerCase();
                            const lang = v.lang.toLowerCase();
                            
                            // HINDARI yang jelas male
                            if (name.includes('male') || name.includes('david') || 
                                name.includes('mark') || name.includes('richard') ||
                                name.includes('alex') || name.includes('tom') ||
                                name.includes('daniel') || name.includes('man') ||
                                name.includes('andika')) {
                                return false;
                            }
                            
                            // Cari voice dengan nama yang diinginkan
                            return name.includes(preferredName) && lang.includes('en');
                        });
                        
                        if (voice) break; // Jika sudah ketemu, stop
                    }
                }
                
                // Sub-prioritas 2c: Fallback ke female voices lainnya (jika masih belum ketemu)
                if (!voice) {
                    voice = this.voices.find(v => {
                        const name = v.name.toLowerCase();
                        const lang = v.lang.toLowerCase();
                        
                        // HINDARI yang jelas male (termasuk Andika)
                        if (name.includes('male') || name.includes('david') || 
                            name.includes('mark') || name.includes('richard') ||
                            name.includes('alex') || name.includes('tom') ||
                            name.includes('daniel') || name.includes('man') ||
                            name.includes('andika')) {
                            return false;
                        }
                        
                        // Ambil English female voices apapun yang tersedia
                        return (name.includes('female') || name.includes('zira')) && 
                               lang.includes('en');
                    });
                }
                
                // Log semua available female voices untuk debugging
                if (!voice) {
                    console.warn('[SpeechAudioManager] ⚠️ No suitable female voice found. Available voices:');
                    const allFemaleVoices = this.voices.filter(v => {
                        const name = v.name.toLowerCase();
                        return !name.includes('male') && !name.includes('david') && 
                               !name.includes('mark') && !name.includes('andika');
                    });
                    console.log(allFemaleVoices.map(v => `  - ${v.name} (${v.lang})`));
                }
            } else {
                // Untuk male: prioritaskan Microsoft Andika (Indonesian) jika belum terpilih
                voice = this.voices.find(v => {
                    const name = v.name.toLowerCase();
                    const lang = v.lang.toLowerCase();
                    
                    // HINDARI yang jelas female
                    if (name.includes('female') || name.includes('zira') || 
                        name.includes('samantha') || name.includes('susan') ||
                        name.includes('karen') || name.includes('victoria')) {
                        return false;
                    }
                    
                    // Prioritaskan Indonesian male voice (Andika)
                    if ((lang.includes('id') || name.includes('indonesian')) && 
                        (name.includes('andika') || name.includes('male'))) {
                        return true;
                    }
                    
                    // Fallback ke male English voices
                    return name.includes('male') || name.includes('david') || 
                           name.includes('mark') || name.includes('richard') ||
                           name.includes('alex') || name.includes('tom');
                });
            }
        }
        
        // Prioritas 3: Indonesian voice - TAPI HARUS skip yang jelas male untuk female request
        if (!voice) {
            voice = this.voices.find(v => {
                const isIndonesian = v.lang.includes('id') || 
                                    v.name.includes('Indonesian') ||
                                    v.name.includes('Indo');
                if (!isIndonesian) return false;
                
                // Untuk female, SKIP yang jelas male (termasuk Andika)
                if (isFemale) {
                    const name = v.name.toLowerCase();
                    if (name.includes('male') || name.includes('laki') || name.includes('pria') ||
                        name.includes('andika')) {
                        return false; // Skip male voices untuk female request
                    }
                    // Jangan ambil Indonesian voice untuk female karena tidak ada yang female
                    // Lebih baik cari English female
                    return false; // Skip semua Indonesian untuk female (tidak ada female voice Indonesian)
                } else {
                    // Untuk male, hanya ambil yang jelas male (termasuk Andika)
                    const name = v.name.toLowerCase();
                    return name.includes('male') || name.includes('laki') || 
                           name.includes('pria') || name.includes('andika');
                }
            });
        }
        
        // Prioritas 4: English voice dengan gender yang sesuai (fallback) - TAPI lebih ketat
        if (!voice) {
            if (isFemale) {
                // Female: cari voices yang jelas female dan hindari male
                voice = this.voices.find(v => {
                    if (!v.lang.includes('en')) return false;
                    const name = v.name.toLowerCase();
                    // HINDARI male voices
                    if (name.includes('male') || name.includes('david') || 
                        name.includes('mark') || name.includes('richard') ||
                        name.includes('alex') || name.includes('tom') ||
                        name.includes('daniel') || name.includes('man')) {
                        return false;
                    }
                    // HARUS mengandung kata-kata female
                    return name.includes('female') || name.includes('zira') || 
                           name.includes('samantha') || name.includes('susan') ||
                           name.includes('karen') || name.includes('victoria') ||
                           name.includes('hazel') || name.includes('eva') ||
                           name.includes('maria') || name.includes('tessa');
                });
            } else {
                // Male: cari voices yang jelas male dan hindari female
                voice = this.voices.find(v => {
                    if (!v.lang.includes('en')) return false;
                    const name = v.name.toLowerCase();
                    // HINDARI female voices
                    if (name.includes('female') || name.includes('zira') || 
                        name.includes('samantha') || name.includes('susan') ||
                        name.includes('karen') || name.includes('victoria') ||
                        name.includes('woman') || name.includes('girl')) {
                        return false;
                    }
                    // HARUS mengandung kata-kata male
                    return name.includes('male') || name.includes('david') || 
                           name.includes('mark') || name.includes('richard') ||
                           name.includes('alex') || name.includes('tom') ||
                           name.includes('daniel') || name.includes('paul') ||
                           name.includes('james') || name.includes('john');
                });
            }
        }
        
        // FINAL FALLBACK: Jangan gunakan voice yang jelas salah gender
        // Lebih baik return null dan gunakan pitch adjustment saja
        if (!voice) {
            console.warn(`[SpeechAudioManager] ⚠️ Tidak ada voice ${isFemale ? 'female' : 'male'} yang cocok!`);
            console.warn('[SpeechAudioManager] Akan menggunakan pitch adjustment ekstrem sebagai kompensasi');
            return null; // Tidak return voice yang salah gender
        }
        
        // Validasi akhir: pastikan voice yang dipilih benar
        const finalName = voice.name.toLowerCase();
        if (isFemale && (finalName.includes('male') || finalName.includes('david') || 
            finalName.includes('mark') || finalName.includes('richard') ||
            finalName.includes('andika'))) { // Microsoft Andika adalah MALE!
            console.warn(`[SpeechAudioManager] ⚠️ Voice ${voice.name} terdeteksi sebagai MALE untuk female request! Rejecting...`);
            return null;
        }
        if (!isFemale && (finalName.includes('female') || finalName.includes('zira') || 
            finalName.includes('samantha') || finalName.includes('susan'))) {
            console.warn(`[SpeechAudioManager] ⚠️ Voice ${voice.name} terdeteksi sebagai FEMALE untuk male request! Rejecting...`);
            return null;
        }
        
        console.log(`[SpeechAudioManager] ✅ Selected voice: ${voice.name} (${voice.lang}) for ${isFemale ? 'female' : 'male'}`);
        return voice;
    }
    
    /**
     * Speak text dengan voice yang sesuai gender
     * Prioritas: ResponsiveVoice (Indonesian) -> Web Speech API (fallback)
     * @param {string} text - Text yang akan di-speak
     * @param {object} options - Options: gender, rate, pitch, volume, onStart, onEnd
     */
    speak(text, options = {}) {
        // Stop any current speech
        this.stop();

        // Skip speaking for specific texts that should stay silent (e.g. psychology quiz intro)
        const sanitizedText = (text || "").trim();
        const mutedPhrases = [
            "Bayangkan kamu punya waktu luang satu hari penuh. Apa yang paling ingin kamu lakukan?"
        ];
        if (mutedPhrases.includes(sanitizedText)) {
            console.log("[SpeechAudioManager] 🔇 Skipping speech for muted phrase.");
            if (options.onEnd) {
                options.onEnd();
            }
            return;
        }
        
        const gender = options.gender || 'female';
        const isFemale = gender.toLowerCase() === 'female';
        
        // Prioritas 1: Gunakan ResponsiveVoice jika tersedia (lebih natural untuk Indonesian)
        if (this.responsiveVoiceAvailable) {
            try {
                // ResponsiveVoice voice names untuk Indonesian:
                // - "Indonesian Female" untuk female NPC
                // - "Indonesian Male" untuk male NPC
                const voiceName = isFemale ? 'Indonesian Female' : 'Indonesian Male';
                
                // Rate: 0.85-1.0 untuk naturalness (default ResponsiveVoice rate adalah 1.0)
                const rate = options.rate !== undefined ? options.rate : 0.92;
                
                // Pitch: 1.0 untuk natural (ResponsiveVoice pitch range: 0-2, default: 1)
                const pitch = options.pitch !== undefined ? options.pitch : (isFemale ? 1.1 : 0.95);
                
                // Volume: 0-1 (default: 1)
                const volume = options.volume !== undefined ? options.volume : 0.85;
                
                console.log(`[SpeechAudioManager] 🔊 Using ResponsiveVoice: ${voiceName} (gender: ${gender}, rate: ${rate}, pitch: ${pitch})`);
                
                // Call onStart callback jika ada
                if (options.onStart) {
                    options.onStart();
                }
                
                // ResponsiveVoice API: responsiveVoice.speak(text, voice, options)
                responsiveVoice.speak(text, voiceName, {
                    rate: rate,
                    pitch: pitch,
                    volume: volume,
                    onstart: () => {
                        console.log('[SpeechAudioManager] ✅ ResponsiveVoice speech started');
                    },
                    onend: () => {
                        console.log('[SpeechAudioManager] ✅ ResponsiveVoice speech ended');
                        if (options.onEnd) {
                            options.onEnd();
                        }
                    },
                    onerror: (error) => {
                        console.error('[SpeechAudioManager] ❌ ResponsiveVoice error:', error);
                        // Fallback ke Web Speech API jika ResponsiveVoice error
                        this.speakWithWebSpeechAPI(text, options);
                    }
                });
                
                return; // Exit early karena sudah menggunakan ResponsiveVoice
            } catch (error) {
                console.error('[SpeechAudioManager] ❌ Error using ResponsiveVoice:', error);
                // Fallback ke Web Speech API
                this.speakWithWebSpeechAPI(text, options);
            }
        }
        
        // Prioritas 2: Fallback ke Web Speech API
        if (this.isSupported) {
            this.speakWithWebSpeechAPI(text, options);
        } else {
            console.warn('[SpeechAudioManager] ❌ Tidak ada TTS engine yang tersedia');
        }
    }
    
    /**
     * Helper method: Speak menggunakan Web Speech API (fallback)
     * @param {string} text - Text yang akan di-speak
     * @param {object} options - Options: gender, rate, pitch, volume, onStart, onEnd
     */
    speakWithWebSpeechAPI(text, options = {}) {
        if (!this.isSupported) {
            console.warn('[SpeechAudioManager] Web Speech API tidak didukung');
            return;
        }
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice berdasarkan gender (default: female)
        const gender = options.gender || 'female';
        const isFemale = gender.toLowerCase() === 'female';
        const voice = this.getVoice(gender);
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang || 'id-ID';
            console.log(`[SpeechAudioManager] ✅ Using Web Speech API voice: ${voice.name} (gender: ${gender})`);
        } else {
            utterance.lang = 'id-ID';
            console.warn(`[SpeechAudioManager] ⚠️ No suitable voice found for ${gender}, using pitch adjustment only`);
        }
        
        // Set options dengan pitch dan rate yang disesuaikan untuk naturalness
        // Untuk voice yang bukan Indonesian (misalnya English voice untuk female),
        // kita gunakan pitch/rate yang membuatnya terdengar lebih natural
        
        // Cek apakah voice adalah Indonesian
        const isIndonesianVoice = voice && (voice.lang.includes('id') || 
                                           voice.name.toLowerCase().includes('indonesian') ||
                                           voice.name.toLowerCase().includes('andika'));
        
        if (options.rate !== undefined) {
            utterance.rate = options.rate;
        } else {
            // Rate lebih lambat untuk naturalness (terutama untuk non-Indonesian voices)
            utterance.rate = isIndonesianVoice ? 0.95 : 0.88; // Lebih lambat untuk English voices agar lebih natural
        }
        
        // Pitch adjustment untuk naturalness:
        // Untuk female: pitch sedikit lebih tinggi tapi natural
        // Untuk male: pitch normal
        if (options.pitch !== undefined) {
            utterance.pitch = options.pitch;
        } else {
            if (isFemale) {
                // Untuk female: pitch natural (1.15-1.2)
                // Jangan terlalu tinggi agar terdengar natural
                utterance.pitch = 1.18;
            } else {
                // Untuk male: pitch normal
                utterance.pitch = 0.92;
            }
        }
        
        utterance.volume = options.volume || 0.85; // Volume (0 to 1)
        
        console.log(`[SpeechAudioManager] 🔊 Speech settings - Gender: ${gender}, Voice: ${voice ? voice.name : 'default'}, Lang: ${voice ? voice.lang : 'N/A'}, Pitch: ${utterance.pitch}, Rate: ${utterance.rate}`);
        
        // Event handlers
        utterance.onstart = () => {
            console.log('[SpeechAudioManager] Speech started');
            if (options.onStart) options.onStart();
        };
        
        utterance.onend = () => {
            console.log('[SpeechAudioManager] Speech ended');
            this.currentUtterance = null;
            if (options.onEnd) options.onEnd();
        };
        
        utterance.onerror = (error) => {
            console.error('[SpeechAudioManager] Speech error:', error);
            this.currentUtterance = null;
            if (options.onError) options.onError(error);
        };
        
        // Store and speak
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }
    
    /**
     * Stop current speech
     */
    stop() {
        // Stop ResponsiveVoice jika sedang berbicara
        if (this.responsiveVoiceAvailable && typeof responsiveVoice !== 'undefined') {
            try {
                responsiveVoice.cancel();
                console.log('[SpeechAudioManager] 🛑 Stopped ResponsiveVoice');
            } catch (error) {
                console.error('[SpeechAudioManager] Error stopping ResponsiveVoice:', error);
            }
        }
        
        // Stop Web Speech API jika sedang berbicara
        if (this.isSupported && this.currentUtterance) {
            this.synthesis.cancel();
            this.currentUtterance = null;
            console.log('[SpeechAudioManager] 🛑 Stopped Web Speech API');
        }
    }
    
    /**
     * Check if currently speaking
     */
    isSpeaking() {
        if (this.responsiveVoiceAvailable && typeof responsiveVoice !== 'undefined') {
            try {
                return responsiveVoice.isPlaying();
            } catch (error) {
                console.error('[SpeechAudioManager] Error checking ResponsiveVoice status:', error);
            }
        }
        
        if (this.isSupported && this.synthesis) {
            return this.synthesis.speaking;
        }
        
        return false;
    }
}



