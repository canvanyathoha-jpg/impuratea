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
                    clickToClose: 'Klik untuk menutup',
                    timeRemaining: 'Waktu Tersisa',
                    autoAdvanceNotice: 'Jika waktunya habis, cerita akan lanjut otomatis.'
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
                    wisdomTitle: 'Wisdom & Moral Lesson',
                    finalScore: 'Final Corruption Score',
                    corruptionLevel: 'Corruption Level',
                    history: 'History',
                    readConversation: 'Read Conversation',
                    clickToClose: 'Click to close',
                    timeRemaining: 'Time Remaining',
                    autoAdvanceNotice: 'If time runs out, the story will move on automatically.'
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
            
            // Psychology Quiz
            psychology: {
                title: {
                    id: 'Kenali Dirimu',
                    en: 'Know Yourself'
                },
                question1: {
                    id: 'Bayangkan kamu punya waktu luang satu hari penuh. Apa yang paling ingin kamu lakukan?',
                    en: 'Imagine you have a full day of free time. What would you most like to do?'
                },
                question2: {
                    id: 'Ketika menghadapi masalah, kamu lebih suka...',
                    en: 'When facing a problem, you prefer to...'
                },
                question3: {
                    id: 'Prestasi yang paling membuatmu bangga adalah...',
                    en: 'The achievement that makes you most proud is...'
                },
                option1a: {
                    id: 'Membaca buku atau mempelajari hal baru yang menarik perhatianku',
                    en: 'Read a book or learn something new that interests me'
                },
                option1b: {
                    id: 'Berkumpul dengan teman-teman dan mengorganisir kegiatan seru bersama',
                    en: 'Gather with friends and organize fun activities together'
                },
                option1c: {
                    id: 'Mengerjakan proyek pribadi atau riset yang sudah lama ingin ku selesaikan',
                    en: 'Work on a personal project or research that I\'ve long wanted to complete'
                },
                option1d: {
                    id: 'Merencanakan event atau acara untuk komunitas kampus',
                    en: 'Plan an event or activity for the campus community'
                },
                option2a: {
                    id: 'Menganalisis secara mendalam dan mencari solusi berdasarkan data',
                    en: 'Analyze in depth and find solutions based on data'
                },
                option2b: {
                    id: 'Berdiskusi dengan banyak orang untuk mendapat berbagai perspektif',
                    en: 'Discuss with many people to get various perspectives'
                },
                option2c: {
                    id: 'Mencari referensi dari buku atau jurnal untuk solusi terbaik',
                    en: 'Search for references from books or journals for the best solution'
                },
                option2d: {
                    id: 'Membentuk tim dan mencari solusi bersama-sama',
                    en: 'Form a team and find solutions together'
                },
                option3a: {
                    id: 'Mendapat nilai sempurna atau menguasai topik yang sulit',
                    en: 'Get a perfect score or master a difficult topic'
                },
                option3b: {
                    id: 'Berhasil mengkoordinir acara besar yang disukai banyak orang',
                    en: 'Successfully coordinate a large event that many people enjoy'
                },
                option3c: {
                    id: 'Menyelesaikan penelitian atau karya ilmiah yang berkualitas',
                    en: 'Complete quality research or scientific work'
                },
                option3d: {
                    id: 'Membangun komunitas atau organisasi yang berdampak positif',
                    en: 'Build a community or organization with positive impact'
                },
                questionProgress: {
                    id: 'Pertanyaan {current} dari {total}',
                    en: 'Question {current} of {total}'
                },
                recommendationTitle: {
                    id: 'Rekomendasi Jalur Untukmu',
                    en: 'Recommended Path For You'
                },
                recommendationNarration: {
                    id: 'Namun, keputusan akhir ada di tanganmu. Silakan pilih jalur yang ingin kamu ambil:',
                    en: 'However, the final decision is in your hands. Please choose the path you want to take:'
                },
                pathAkademik: {
                    id: 'Jalur Akademik',
                    en: 'Academic Path'
                },
                pathOrganisasi: {
                    id: 'Jalur Organisasi',
                    en: 'Organization Path'
                },
                pathAkademikDesc: {
                    id: 'Berdasarkan jawabanmu, kamu memiliki kecenderungan untuk fokus pada pembelajaran dan pengembangan pengetahuan. Kamu suka menganalisis, meneliti, dan mendalami topik secara mendalam. Jalur Akademik cocok untukmu!',
                    en: 'Based on your answers, you have a tendency to focus on learning and knowledge development. You like to analyze, research, and delve deep into topics. The Academic Path is right for you!'
                },
                pathOrganisasiDesc: {
                    id: 'Berdasarkan jawabanmu, kamu memiliki jiwa kepemimpinan dan suka berinteraksi dengan banyak orang. Kamu senang mengorganisir kegiatan dan bekerja dalam tim. Jalur Organisasi cocok untukmu!',
                    en: 'Based on your answers, you have leadership qualities and enjoy interacting with many people. You like organizing activities and working in teams. The Organization Path is right for you!'
                },
                btnAkademik: {
                    id: 'Akademik',
                    en: 'Academic'
                },
                btnAkademikDesc: {
                    id: 'Masuk ke ruang kelas untuk belajar',
                    en: 'Enter the classroom to learn'
                },
                btnOrganisasi: {
                    id: 'Organisasi',
                    en: 'Organization'
                },
                btnOrganisasiDesc: {
                    id: 'Ikuti kegiatan organisasi kampus',
                    en: 'Follow campus organization activities'
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
                    corruptionStartsSmall: 'Corruption Starts Small',
                    corruptionStartsSmallDesc: 'Cheating and buying answers are acts of academic corruption that can grow bigger.',
                    integrityMoreValuable: 'Integrity is More Valuable',
                    integrityMoreValuableDesc: 'Strong character is more valuable than high grades obtained through cheating.',
                    rememberQuote: 'Choose honesty; it\'s the best investment for the future.',
                    endingTitle: {
                        clean: 'Clean Ending - Standing With Integrity Alone',
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

