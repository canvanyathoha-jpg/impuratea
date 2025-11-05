/**
 * LanguageManager - Manages bilingual support (Indonesian/English)
 * Provides translation service for all game texts
 */

export default class LanguageManager {
    constructor() {
        // Default language: Indonesian
        this.currentLanguage = localStorage.getItem('gameLanguage') || 'id';
        
        // Translation dictionaries
        this.translations = {
            // UI Elements
            ui: {
                id: {
                    loading: 'Memuat Scene...',
                    pleaseWait: 'Mohon tunggu sebentar...',
                    continue: 'Lanjutkan',
                    back: 'Kembali',
                    restart: 'Main Lagi',
                    backToMenu: 'Kembali ke Menu',
                    selectCharacter: 'Pilih Karaktermu',
                    enterName: 'Masukkan Nama Kamu',
                    namePlaceholder: 'Tuliskan nama kamu di sini...',
                    male: 'Laki-laki',
                    female: 'Perempuan',
                    beginJourney: 'Mulai Perjalanan',
                    welcome: 'Selamat Datang di IMPURITEA',
                    rememberMessage: 'Ingat Pesan Ini',
                    wisdomTitle: 'Hikmah & Pesan Moral',
                    finalScore: 'Final Corruption Score',
                    corruptionLevel: 'Corruption Level',
                    history: 'History',
                    readConversation: 'Baca Percakapan',
                    clickToClose: 'Klik untuk menutup'
                },
                en: {
                    loading: 'Loading Scene...',
                    pleaseWait: 'Please wait a moment...',
                    continue: 'Continue',
                    back: 'Back',
                    restart: 'Play Again',
                    backToMenu: 'Back to Menu',
                    selectCharacter: 'Select Your Character',
                    enterName: 'Enter Your Name',
                    namePlaceholder: 'Type your name here...',
                    male: 'Male',
                    female: 'Female',
                    beginJourney: 'Begin Your Journey',
                    welcome: 'Welcome to IMPURITEA',
                    rememberMessage: 'Remember This Message',
                    wisdomTitle: 'Wisdom & Moral Message',
                    finalScore: 'Final Corruption Score',
                    corruptionLevel: 'Corruption Level',
                    history: 'History',
                    readConversation: 'Read Conversation',
                    clickToClose: 'Click to close'
                }
            },
            
            // Dialog choices
            choices: {
                id: {
                    yes: 'Ya',
                    no: 'Tidak',
                    accept: 'Terima',
                    refuse: 'Tolak',
                    continue: 'Lanjutkan'
                },
                en: {
                    yes: 'Yes',
                    no: 'No',
                    accept: 'Accept',
                    refuse: 'Refuse',
                    continue: 'Continue'
                }
            },
            
            // Ending messages
            ending: {
                id: {
                    honestyFoundation: 'Kejujuran adalah Fondasi',
                    honestyFoundationDesc: 'Setiap tindakan tidak jujur merusak integritas. Kejujuran membangun kepercayaan.',
                    corruptionStartsSmall: 'Korupsi Dimulai dari Hal Kecil',
                    corruptionStartsSmallDesc: 'Mencontek dan membeli jawaban adalah korupsi akademik yang bisa berkembang lebih besar.',
                    integrityMoreValuable: 'Integritas Lebih Berharga',
                    integrityMoreValuableDesc: 'Karakter kuat lebih berharga daripada nilai tinggi yang diperoleh dengan curang.',
                    rememberQuote: 'Pilihlah kejujuran, karena itu adalah investasi terbaik untuk masa depan.',
                    endingTitle: {
                        clean: 'Ending Bersih - Integritas Sendirian',
                        gray: 'Ending Abu-Abu - Kompromi Setengah-setengah',
                        bad: 'Ending Buruk - Korupsi Kecil Terbongkar'
                    }
                },
                en: {
                    honestyFoundation: 'Honesty is the Foundation',
                    honestyFoundationDesc: 'Every dishonest act damages integrity. Honesty builds trust.',
                    corruptionStartsSmall: 'Corruption Starts from Small Things',
                    corruptionStartsSmallDesc: 'Cheating and buying answers are academic corruption that can grow larger.',
                    integrityMoreValuable: 'Integrity is More Valuable',
                    integrityMoreValuableDesc: 'Strong character is more valuable than high grades obtained through cheating.',
                    rememberQuote: 'Choose honesty, because it is the best investment for the future.',
                    endingTitle: {
                        clean: 'Clean Ending - Solitary Integrity',
                        gray: 'Gray Ending - Half-hearted Compromise',
                        bad: 'Bad Ending - Small Corruption Exposed'
                    }
                }
            }
        };
        
        // Event listeners untuk language change
        this.listeners = [];
    }
    
    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Set language and save to localStorage
     */
    setLanguage(lang) {
        if (lang !== 'id' && lang !== 'en') {
            console.warn('[LanguageManager] Invalid language:', lang);
            return;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('gameLanguage', lang);
        
        // Notify all listeners
        this.listeners.forEach(listener => {
            try {
                listener(lang);
            } catch (error) {
                console.error('[LanguageManager] Error in language change listener:', error);
            }
        });
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        
        console.log('[LanguageManager] Language changed to:', lang);
    }
    
    /**
     * Toggle between Indonesian and English
     */
    toggleLanguage() {
        const newLang = this.currentLanguage === 'id' ? 'en' : 'id';
        this.setLanguage(newLang);
        return newLang;
    }
    
    /**
     * Get translation for a key
     * @param {string} key - Translation key (e.g., 'ui.loading', 'choices.yes')
     * @param {string} fallback - Fallback text if translation not found
     */
    t(key, fallback = '') {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`[LanguageManager] Translation key not found: ${key}`);
                return fallback || key;
            }
        }
        
        if (value && typeof value === 'object' && this.currentLanguage in value) {
            return value[this.currentLanguage];
        }
        
        console.warn(`[LanguageManager] Language '${this.currentLanguage}' not found for key: ${key}`);
        return fallback || key;
    }
    
    /**
     * Get translation for text that can be either a string or bilingual object
     * @param {string|object} text - Text string or object with {id: "...", en: "..."}
     */
    translate(text) {
        if (!text) return '';
        
        // If it's already a bilingual object
        if (typeof text === 'object' && ('id' in text || 'en' in text)) {
            return text[this.currentLanguage] || text.id || text.en || '';
        }
        
        // If it's a string, return as is (for now - can be extended later)
        return text;
    }
    
    /**
     * Register a listener for language changes
     */
    onLanguageChange(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Remove a language change listener
     */
    removeLanguageChangeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
}

// Export singleton instance
export const languageManager = new LanguageManager();

