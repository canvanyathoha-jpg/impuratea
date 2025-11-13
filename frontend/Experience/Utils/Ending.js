/**
 * Ending.js
 *
 * Professional ending screen with cinematic presentation
 * Score range: 0-100%
 *
 * Clean ending (10-50%): Integrity maintained
 * Gray ending (51-75%): Half-hearted compromise
 * Bad ending (76-100%): Fall from integrity
 */

import Experience from "../Experience.js";
import { languageManager } from "./LanguageManager.js";

export default class Ending {
    constructor() {
        this.overlay = null;
        this.isShowing = false;
        this.currentScore = null;
        this.currentPercentage = null;
        this.currentEndingType = null;
    }

    /**
     * Calculate corruption score percentage
     * Max score = 100 (ScoreManager uses 10-100 range)
     */
    calculatePercentage() {
        // Prefer ScoreManager (percentage 10-100)
        let percentageFromManager = null;
        const exp = Experience.instance;
        if (exp && exp.scoreManager && typeof exp.scoreManager.getScore === 'function') {
            percentageFromManager = exp.scoreManager.getScore();
        }

        // Legacy/local fallbacks
        const managerStored = parseInt(localStorage.getItem('academic_corruption_score') || '0'); // 10..100

        // ScoreManager already returns percentage directly (10-100%)
        if (typeof percentageFromManager === 'number' && !Number.isNaN(percentageFromManager)) {
            const pct = Math.max(10, Math.min(100, percentageFromManager));
            return { score: pct, percentage: pct };
        }

        if (!Number.isNaN(managerStored) && managerStored >= 10) {
            const pct = Math.max(10, Math.min(100, managerStored));
            return { score: pct, percentage: pct };
        }

        // Default: clean ending score
        return { score: 10, percentage: 10 };
    }

    /**
     * Determine ending type based on percentage
     * - 10-50% corruption → CLEAN ending (Integrity Maintained)
     * - 51-75% corruption → GRAY ending (Half-Hearted Compromise)
     * - 76-100% corruption → BAD ending (Fall from Grace)
     */
    determineEnding(percentage) {
        let endingType = 'clean'; // Default

        if (percentage >= 10 && percentage <= 50) {
            endingType = 'clean';
        } else if (percentage >= 51 && percentage <= 75) {
            endingType = 'gray';
        } else if (percentage >= 76 && percentage <= 100) {
            endingType = 'bad';
        }

        console.log(`[Ending] Determining ending for ${percentage}% corruption → ${endingType.toUpperCase()} ending`);
        return endingType;
    }

    /**
     * Translate bilingual text
     */
    t(textObj) {
        if (typeof textObj === 'string') return textObj;
        if (!textObj) return '';
        const lang = languageManager.getLanguage();
        return textObj[lang] || textObj.id || textObj.en || '';
    }

    /**
     * Get bilingual UI labels
     */
    getLabels() {
        return {
            chapterComplete: { id: "Bab Selesai", en: "Chapter Complete" },
            yourStory: { id: "Kisahmu", en: "Your Story" },
            personalReview: { id: "Tinjauan Performa Personal", en: "Personal Performance Review" },
            keyTakeaways: { id: "Poin Penting & Tips", en: "Key Takeaways & Tips" },
            forRealLife: { id: "Untuk Kehidupan Nyata", en: "For Real Life" },
            forNextPlaythrough: { id: "Untuk Permainan Berikutnya", en: "For Next Playthrough" },
            reflection: { id: "Refleksi", en: "Reflection" },
            playAgain: { id: "Main Lagi", en: "Play Again" },
            backToMenu: { id: "Kembali ke Menu", en: "Back to Menu" },
            thankYou: { id: "Terima kasih telah bermain IMPURITEA", en: "Thank you for playing IMPURITEA" },
            subtitle: { id: "Pengalaman naratif tentang integritas dan pilihan", en: "A narrative experience about integrity and choices" },
            corruptionScore: { id: "Skor Korupsi", en: "Corruption Score" },
            points: { id: "poin", en: "points" },
            overallImpact: { id: "Dampak Keseluruhan", en: "Overall Impact" },
            range: { id: "Rentang", en: "Range" },
            achievementUnlocked: { id: "Pencapaian Terbuka", en: "Achievement Unlocked" },
            analysis: { id: "Analisis:", en: "Analysis:" },
            downloadCertificate: { id: "Unduh Sertifikat", en: "Download Certificate" }
        };
    }

    /**
     * Get ending data based on type (with bilingual support)
     */
    getEndingData(endingType) {
        const endings = {
            clean: {
                title: { id: "Integritas Terjaga", en: "Integrity Maintained" },
                subtitle: { id: "Berdiri Sendirian dengan Kehormatan", en: "Standing Alone with Honor" },
                percentage: "10-50%",
                color: "#4ecdc4",
                colorDark: "#2d7873",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                icon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>`,
                story: [
                    { id: "Kamu menolak semua bentuk kecurangan yang ditawarkan padamu.", en: "You rejected all forms of cheating offered to you." },
                    { id: "Meskipun ditinggalkan teman dan dimarahi kakak kelas, kamu tetap memegang prinsipmu.", en: "Even when abandoned by friends and scolded by seniors, you stayed true to your principles." },
                    { id: "Saat audit akhirnya dilakukan, semua yang kamu lakukan terbukti benar.", en: "When the audit was finally conducted, everything you did was proven right." },
                    "",
                    { id: "Pembina akhirnya meminta maaf dan memberimu penghargaan khusus", en: "The supervisor eventually apologized and gave you a special award" },
                    { id: "atas kejujuran dan integritas yang kamu pertahankan.", en: "for the honesty and integrity you maintained." }
                ],
                message: {
                    id: "Integritas adalah pilihan sulit, tetapi menghasilkan akhir yang benar. Kejujuranmu membuktikan bahwa berdiri sendirian bukan berarti kamu salah.",
                    en: "Integrity is a difficult choice, but it yields the right results. Your honesty proves that standing alone doesn't mean being wrong."
                },
                impact: { id: "Positif", en: "Positive" },
                achievement: { id: "Teladan Integritas", en: "Paragon of Integrity" },
                achievementDesc: {
                    id: "Menjaga standar etika sepanjang perjalanan",
                    en: "Maintained ethical standards throughout the journey"
                },
                personalFeedback: {
                    praise: {
                        id: "Luar biasa! Kamu menunjukkan keberanian moral yang tinggi.",
                        en: "Outstanding! You demonstrated exceptional moral courage."
                    },
                    analysis: {
                        id: "Keputusanmu menunjukkan prinsip etis yang kuat dan keberanian untuk tetap bertahan, bahkan saat mendapat tekanan. Kamu memilih jalan yang lebih sulit, dan itu berbicara banyak tentang karaktermu.",
                        en: "Your decisions show strong ethical principles and the courage to stand by them, even when facing pressure. You chose the harder path, and that speaks volumes about your character."
                    },
                    highlight: {
                        id: "Kamu konsisten menolak korupsi dan menjaga integritas sepanjang perjalanan.",
                        en: "You consistently rejected corruption and maintained your integrity throughout the journey."
                    }
                },
                tips: [
                    {
                        id: "💎 Teguh pada nilai-nilaimu - Orang akan menghormati mereka yang berprinsip, meski butuh waktu.",
                        en: "💎 Stand firm in your values - People respect those who have principles, even if it takes time."
                    },
                    {
                        id: "🛡️ Dokumentasikan segala hal - Di situasi nyata, catatan melindungimu dari tuduhan palsu.",
                        en: "🛡️ Document everything - In real situations, keeping records protects you from false accusations."
                    },
                    {
                        id: "🤝 Bangun aliansi dengan orang yang sevisi - Kamu tak harus berdiri sendiri; cari mereka yang berbagi nilai denganmu.",
                        en: "🤝 Build alliances with like-minded people - You don't have to stand alone; find others who share your values."
                    },
                    {
                        id: "📢 Bicara sejak awal - Tuntaskan masalah sebelum berkembang jadi lebih besar.",
                        en: "📢 Speak up early - Address issues before they escalate into bigger problems."
                    }
                ],
                advice: {
                    realLife: {
                        id: "Di lingkungan akademik maupun profesional, pertahankan integritasmu. Meski tampak sulit sekarang, kejujuran membangun reputasi yang membuka peluang di masa depan.",
                        en: "In real academic or professional settings, maintain this integrity. While it may seem difficult now, honesty builds a reputation that opens doors in the long run."
                    },
                    nextPlaythrough: {
                        id: "Kamu telah melihat jalur terbaik. Cobalah mengeksplorasi pilihan lain untuk memahami mengapa integritas begitu penting.",
                        en: "You've seen the best path. Try exploring what happens when you make different choices to understand why integrity matters."
                    }
                }
            },
            gray: {
                title: { id: "Kompromi Setengah Hati", en: "Half-Hearted Compromise" },
                subtitle: { id: "Menapaki Jalan Tengah", en: "Walking the Middle Path" },
                percentage: "51-75%",
                color: "#ffa726",
                colorDark: "#f57c00",
                gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                icon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>`,
                story: [
                    { id: "Kamu kadang jujur, kadang ikut arus demi menghindari konflik.", en: "You were sometimes honest, sometimes going with the flow to avoid conflict." },
                    { id: "Acara berjalan lancar dan sukses.", en: "The event was successful and ran smoothly." },
                    { id: "Namun, laporan keuangan yang kamu buat tampak mencurigakan saat diperiksa.", en: "However, the financial report you made looked suspicious upon inspection." },
                    "",
                    { id: "Meski kamu tidak dihukum secara resmi,", en: "Although you weren't formally punished," },
                    { id: "kepercayaan semua orang hilang padamu.", en: "everyone lost trust in you." }
                ],
                message: {
                    id: "Kompromi kadang perlu, tapi terlalu sering bisa membuatmu kehilangan jati diri. Kepercayaan yang hilang jauh lebih mahal dari keberhasilan sesaat.",
                    en: "Compromise is sometimes necessary, but too much compromise can make you lose yourself. Lost trust is more expensive than momentary success."
                },
                impact: { id: "Campuran", en: "Mixed" },
                achievement: { id: "Sang Kompromis", en: "The Compromiser" },
                achievementDesc: {
                    id: "Berjalan di tengah antara integritas dan konformitas",
                    en: "Balanced between integrity and conformity"
                },
                personalFeedback: {
                    praise: {
                        id: "Kamu mencoba menyeimbangkan berbagai tekanan, menunjukkan adaptabilitas.",
                        en: "You tried to balance different pressures, which shows adaptability."
                    },
                    analysis: {
                        id: "Pilihanmu mencerminkan pergulatan banyak orang saat terjebak antara melakukan hal benar dan menyesuaikan diri. Kompromi ada tempatnya, tapi terlalu banyak dapat menggerus nilai dan kepercayaan orang lain padamu.",
                        en: "Your choices reflect the struggle many face when caught between doing what's right and fitting in. While compromise has its place, too much can erode your core values and others' trust in you."
                    },
                    highlight: {
                        id: "Kamu membuat beberapa keputusan baik, tetapi juga menyerah pada tekanan ketika itu tampak lebih mudah.",
                        en: "You made some good decisions, but also gave in to pressure when it seemed easier."
                    }
                },
                tips: [
                    {
                        id: "⚖️ Tentukan batas yang tak bisa ditawar - Ketahui nilai apa yang tak akan kamu kompromikan, apa pun tekanannya.",
                        en: "⚖️ Define your non-negotiables - Know which values you'll never compromise, no matter the pressure."
                    },
                    {
                        id: "🔍 Pikirkan jangka panjang - Jalan pintas sering menciptakan masalah lebih besar kelak. Pertimbangkan konsekuensi ke depan.",
                        en: "🔍 Think long-term - Quick fixes often create bigger problems later. Consider future consequences."
                    },
                    {
                        id: "💪 Latih dirimu berkata 'Tidak' - Semakin sering dilatih, semakin mudah. Mulailah dari situasi kecil.",
                        en: "💪 Practice saying 'No' - It gets easier with practice. Start with small situations."
                    },
                    {
                        id: "🎯 Pilih medan yang tepat - Tidak semua pertarungan sepadan, tetapi beberapa prinsip pantas dipertahankan.",
                        en: "🎯 Choose your battles - Not every fight is worth it, but some principles are worth defending."
                    },
                    {
                        id: "🤔 Renungkan alasanmu berkompromi - Memahami motivasimu membantu membuat pilihan lebih baik lain kali.",
                        en: "🤔 Reflect on why you compromised - Understanding your motivations helps you make better choices next time."
                    }
                ],
                advice: {
                    realLife: {
                        id: "Kenali nilai inti yang harus kamu pegang dan berkomitmenlah untuk tidak mengalah pada hal-hal tersebut, bahkan saat situasinya tak nyaman. Bangun keberanian mengambil keputusan sulit sebelum berada di tekanan tinggi.",
                        en: "Identify your core values and commit to not compromising on those, even when it's uncomfortable. Build the courage to make tough choices before you're in a high-pressure situation."
                    },
                    nextPlaythrough: {
                        id: "Cobalah membuat pilihan yang lebih konsisten ke satu arah. Lihat apa yang terjadi ketika kamu sepenuhnya memegang integritas atau mengeksplorasi konsekuensi penuh korupsi.",
                        en: "Try making more consistent choices in one direction. See what happens when you fully commit to integrity, or explore the full consequences of corruption."
                    }
                }
            },
            bad: {
                title: { id: "Jatuh dari Kehormatan", en: "Fall from Grace" },
                subtitle: { id: "Harga Sebuah Korupsi", en: "The Price of Corruption" },
                percentage: "76-100%",
                color: "#ef5350",
                colorDark: "#c62828",
                gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                icon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>`,
                story: [
                    { id: "Kamu sering memanipulasi data dan mengikuti permintaan senior tanpa berpikir panjang.", en: "You often manipulated data and followed senior requests without consideration." },
                    { id: "Awalnya kamu dipercaya dan semua acara berjalan sukses.", en: "Initially you were trusted and all events were successful." },
                    { id: "Namun ketika audit resmi dilakukan, semua kebohonganmu terbongkar.", en: "But when the official audit report was conducted, all your lies were exposed." },
                    "",
                    { id: "Para senior yang mengajakmu menghilang begitu saja,", en: "The seniors who persuaded you disappeared just like that," },
                    { id: "sementara kamu harus menanggung semua kesalahan sendirian.", en: "while you had to bear all the mistakes alone." }
                ],
                message: {
                    id: "Integritas yang hilang tak bisa dibeli kembali. Keberhasilan yang dibangun di atas kebohongan akan runtuh, dan kamu akan memikulnya sendirian.",
                    en: "Lost integrity cannot be bought back. Success built on lies will collapse in time, and you will bear it alone."
                },
                impact: { id: "Negatif", en: "Negative" },
                achievement: { id: "Bintang Jatuh", en: "Fallen Star" },
                achievementDesc: {
                    id: "Terperosok pada korupsi dan kehilangan arah",
                    en: "Succumbed to corruption and lost your way"
                },
                personalFeedback: {
                    praise: {
                        id: "Kamu merasakan konsekuensi penuh dari korupsi.",
                        en: "You experienced the full consequences of corruption."
                    },
                    analysis: {
                        id: "Perjalananmu menunjukkan betapa mudahnya tergelincir ketika keuntungan jangka pendek lebih diprioritaskan daripada integritas jangka panjang. Setiap kompromi kecil membuat berikutnya lebih mudah, hingga akhirnya kebohongan menghampirimu.",
                        en: "Your journey shows how easy it is to slide down a slippery slope when you prioritize short-term gains over long-term integrity. Each small compromise made the next one easier, until the lies caught up with you."
                    },
                    highlight: {
                        id: "Kamu belajar pelajaran berharga: korupsi selalu menagih, dan mereka yang menjerumuskanmu tidak akan ada ketika semuanya terbongkar.",
                        en: "You learned a valuable lesson: corruption always catches up, and those who led you astray won't be there to help when it does."
                    }
                },
                tips: [
                    {
                        id: "🚨 Kenali tanda bahaya sejak dini - Saat seseorang memintamu melakukan hal meragukan, itu peringatan.",
                        en: "🚨 Recognize red flags early - When someone asks you to do something questionable, it's a warning sign."
                    },
                    {
                        id: "🛑 Hentikan siklusnya - Tidak pernah terlambat untuk memutus pola. Akui kesalahan sebelum semuanya membesar.",
                        en: "🛑 Stop the cycle - It's never too late to break the pattern. Admit mistakes before they snowball."
                    },
                    {
                        id: "👥 Evaluasi pengaruh di sekitarmu - Dekati orang yang mendorong integritas, bukan jalan pintas.",
                        en: "👥 Evaluate your influences - Surround yourself with people who encourage integrity, not shortcuts."
                    },
                    {
                        id: "📝 Ambil tanggung jawab - Saat ketahuan, akuilah. Kejujuran setelahnya membantu membangun ulang kepercayaan.",
                        en: "📝 Take responsibility - When caught, own up to it. Honesty in the aftermath can help rebuild trust."
                    },
                    {
                        id: "🔄 Belajar dan bertumbuh - Kesalahan adalah pelajaran. Gunakan pengalaman ini untuk memahami pentingnya integritas.",
                        en: "🔄 Learn and grow - Mistakes are lessons. Use this experience to understand why integrity matters."
                    },
                    {
                        id: "💭 Pertanyakan anggapan 'semua orang juga begitu' - Banyak yang melakukannya tidak berarti itu benar.",
                        en: "💭 Question 'everyone does it' - Popularity doesn't make something right."
                    }
                ],
                advice: {
                    realLife: {
                        id: "Ending ini menunjukkan mengapa integritas penting. Di dunia nyata, korupsi memiliki konsekuensi serius—hukum, profesional, dan pribadi. Keuntungan sesaat tidak pernah sepadan. Jika kamu berada dalam situasi serupa, ingatlah hasil ini dan pilih secara berbeda.",
                        en: "This ending shows why maintaining integrity matters. In real life, corruption has serious consequences - legal, professional, and personal. It's never worth the temporary benefit. If you find yourself in similar situations, remember this outcome and choose differently."
                    },
                    nextPlaythrough: {
                        id: "Kamu telah melihat hasil terburuk. Cobalah bermain lagi dengan integritas sebagai kompasmu. Rasakan perbedaannya saat kamu berpegang pada prinsip.",
                        en: "You've seen the worst outcome. Try playing again with integrity as your guide. See how different the journey feels when you stand by your principles."
                    }
                }
            }
        };

        return endings[endingType] || endings.clean;
    }

    /**
     * Display ending screen with professional presentation
     */
    show() {
        if (this.isShowing) {
            console.warn("[Ending] Ending already shown");
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.isShowing = true;

            // Calculate score and determine ending
            const { score, percentage } = this.calculatePercentage();
            const endingType = this.determineEnding(percentage);
            const endingData = this.getEndingData(endingType);

            console.log(`[Ending] Score: ${score}, Percentage: ${percentage.toFixed(1)}%, Ending: ${endingType}`);

            // Get labels for bilingual support
            const labels = this.getLabels();

            // Create overlay with professional structure
            this.overlay = document.createElement('div');
            this.overlay.id = 'ending-overlay';
            this.overlay.innerHTML = `
                <!-- Animated Background -->
                <div class="ending-bg-wrapper">
                    <div class="ending-bg-gradient" style="background: ${endingData.gradient}"></div>
                    <div class="ending-bg-overlay"></div>
                    <div class="ending-particles"></div>
                </div>

                <!-- Main Content Container -->
                <div class="ending-main-container">
                    <!-- Cinematic Header -->
                    <div class="ending-cinematic-header">
                        <div class="ending-chapter-label">${this.t(labels.chapterComplete)}</div>
                        <div class="ending-divider"></div>
                    </div>

                    <!-- Hero Section -->
                    <div class="ending-hero">
                        <div class="ending-icon-wrapper" style="color: ${endingData.color}">
                            ${endingData.icon}
                        </div>
                        <h1 class="ending-title" style="color: ${endingData.color}">
                            ${this.t(endingData.title)}
                        </h1>
                        <p class="ending-subtitle">${this.t(endingData.subtitle)}</p>
                    </div>

                    <!-- Stats Grid -->
                    <div class="ending-stats-grid">
                        <!-- Score Card -->
                        <div class="ending-stat-card">
                            <div class="ending-stat-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                                </svg>
                            </div>
                            <div class="ending-stat-label">${this.t(labels.corruptionScore)}</div>
                            <div class="ending-stat-value" style="color: ${endingData.color}">${percentage.toFixed(0)}%</div>
                            <div class="ending-stat-subtext">${score} / 100 ${this.t(labels.points)}</div>
                        </div>

                        <!-- Impact Card -->
                        <div class="ending-stat-card">
                            <div class="ending-stat-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </div>
                            <div class="ending-stat-label">${this.t(labels.overallImpact)}</div>
                            <div class="ending-stat-value" style="color: ${endingData.color}">${this.t(endingData.impact)}</div>
                            <div class="ending-stat-subtext">${this.t(labels.range)}: ${endingData.percentage}</div>
                        </div>

                        <!-- Achievement Card -->
                        <div class="ending-stat-card ending-achievement-card" style="border-color: ${endingData.color}">
                            <div class="ending-achievement-badge" style="background: ${endingData.gradient}">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                </svg>
                            </div>
                            <div class="ending-stat-label">${this.t(labels.achievementUnlocked)}</div>
                            <div class="ending-achievement-title" style="color: ${endingData.color}">${this.t(endingData.achievement)}</div>
                            <div class="ending-stat-subtext">${this.t(endingData.achievementDesc)}</div>
                        </div>
                    </div>

                    <!-- Story Section -->
                    <div class="ending-story-section">
                        <div class="ending-story-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                            <span>${this.t(labels.yourStory)}</span>
                        </div>
                        <div class="ending-story-content">
                            ${endingData.story.map((paragraph, index) =>
                                paragraph ? `<p class="ending-story-para" style="animation-delay: ${index * 0.1}s">${this.t(paragraph)}</p>` : '<div class="ending-story-spacer"></div>'
                            ).join('')}
                        </div>
                    </div>

                    <!-- Personal Feedback Section -->
                    <div class="ending-feedback-section">
                        <div class="ending-feedback-header">
                            <div class="ending-feedback-icon" style="background: ${endingData.gradient}">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div class="ending-feedback-title-group">
                                <h3 class="ending-feedback-title">${this.t(labels.personalReview)}</h3>
                                <p class="ending-feedback-praise" style="color: ${endingData.color}">${this.t(endingData.personalFeedback.praise)}</p>
                            </div>
                        </div>
                        <div class="ending-feedback-body">
                            <div class="ending-feedback-analysis">
                                <strong>${this.t(labels.analysis)}</strong> ${this.t(endingData.personalFeedback.analysis)}
                            </div>
                            <div class="ending-feedback-highlight">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 16v-4M12 8h.01"/>
                                </svg>
                                ${this.t(endingData.personalFeedback.highlight)}
                            </div>
                        </div>
                    </div>

                    <!-- Tips & Life Lessons Section -->
                    <div class="ending-tips-section">
                        <div class="ending-section-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <span>${this.t(labels.keyTakeaways)}</span>
                        </div>
                        <div class="ending-tips-grid">
                            ${endingData.tips.map((tip, index) => `
                                <div class="ending-tip-item" style="animation-delay: ${index * 0.1}s">
                                    ${this.t(tip)}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Advice Section -->
                    <div class="ending-advice-section">
                        <div class="ending-advice-grid">
                            <div class="ending-advice-card" style="border-color: ${endingData.color}">
                                <div class="ending-advice-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                                    </svg>
                                </div>
                                <div class="ending-advice-label">${this.t(labels.forRealLife)}</div>
                                <div class="ending-advice-text">${this.t(endingData.advice.realLife)}</div>
                            </div>
                            <div class="ending-advice-card" style="border-color: ${endingData.color}">
                                <div class="ending-advice-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                        <path d="M21 3v5h-5"/>
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                        <path d="M3 21v-5h5"/>
                                    </svg>
                                </div>
                                <div class="ending-advice-label">${this.t(labels.forNextPlaythrough)}</div>
                                <div class="ending-advice-text">${this.t(endingData.advice.nextPlaythrough)}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Message Card -->
                    <div class="ending-message-card" style="border-left-color: ${endingData.color}">
                        <div class="ending-message-icon" style="color: ${endingData.color}">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div class="ending-message-content">
                            <div class="ending-message-label">${this.t(labels.reflection)}</div>
                            <div class="ending-message-text">${this.t(endingData.message)}</div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="ending-actions">
                        <button id="ending-certificate" class="ending-btn ending-btn-certificate" style="border-color: ${endingData.color}; color: ${endingData.color}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            ${this.t(labels.downloadCertificate)}
                        </button>
                        <button id="ending-restart" class="ending-btn ending-btn-primary" style="background: ${endingData.gradient}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                            </svg>
                            ${this.t(labels.playAgain)}
                        </button>
                        <button id="ending-menu" class="ending-btn ending-btn-secondary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            ${this.t(labels.backToMenu)}
                        </button>
                    </div>

                    <!-- Credits Footer -->
                    <div class="ending-credits">
                        <p>${this.t(labels.thankYou)}</p>
                        <div class="ending-credits-divider"></div>
                        <p class="ending-credits-sub">${this.t(labels.subtitle)}</p>
                    </div>
                </div>
            `;

            // Professional CSS Styles
            const style = document.createElement('style');
            style.textContent = `
                /* Base Overlay */
                #ending-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000002;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    opacity: 0;
                    animation: fadeIn 1.2s ease forwards;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 60px 20px 60px 20px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    -webkit-overflow-scrolling: touch;
                }

                @keyframes fadeIn {
                    to { opacity: 1; }
                }

                /* Animated Background */
                .ending-bg-wrapper {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: -1;
                }

                .ending-bg-gradient {
                    position: absolute;
                    inset: 0;
                    opacity: 0.15;
                    animation: gradientShift 20s ease infinite;
                }

                @keyframes gradientShift {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.15; }
                    50% { transform: scale(1.1) rotate(2deg); opacity: 0.2; }
                }

                .ending-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(10,10,15,0.7) 0%, rgba(5,5,10,0.95) 100%);
                }

                .ending-particles {
                    position: absolute;
                    inset: 0;
                    background-image:
                        radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.15), transparent),
                        radial-gradient(2px 2px at 60% 70%, rgba(255,255,255,0.1), transparent),
                        radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.1), transparent),
                        radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.15), transparent),
                        radial-gradient(2px 2px at 90% 60%, rgba(255,255,255,0.1), transparent);
                    background-size: 200% 200%;
                    background-position: 0% 0%;
                    animation: particleFloat 30s ease-in-out infinite;
                }

                @keyframes particleFloat {
                    0%, 100% { background-position: 0% 0%; }
                    50% { background-position: 100% 100%; }
                }

                /* Main Container */
                .ending-main-container {
                    background: linear-gradient(145deg, rgba(20,22,30,0.95), rgba(15,17,25,0.98));
                    border-radius: 32px;
                    backdrop-filter: blur(40px) saturate(150%);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 48px;
                    max-width: 1100px;
                    width: 100%;
                    margin: 0 auto;
                    min-height: min-content;
                    box-shadow:
                        0 40px 100px rgba(0,0,0,0.6),
                        inset 0 1px 0 rgba(255,255,255,0.1);
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(60px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Cinematic Header */
                .ending-cinematic-header {
                    text-align: center;
                    margin-bottom: 32px;
                    animation: fadeIn 0.8s ease 0.3s backwards;
                }

                .ending-chapter-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 12px;
                }

                .ending-divider {
                    width: 60px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    margin: 0 auto;
                }

                /* Hero Section */
                .ending-hero {
                    text-align: center;
                    margin-bottom: 48px;
                    animation: fadeIn 0.8s ease 0.5s backwards;
                }

                .ending-icon-wrapper {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 88px;
                    height: 88px;
                    border-radius: 24px;
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(10px);
                    margin-bottom: 24px;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
                }

                .ending-title {
                    font-size: 52px;
                    font-weight: 900;
                    line-height: 1.1;
                    margin-bottom: 12px;
                    letter-spacing: -0.5px;
                    text-shadow: 0 4px 24px rgba(0,0,0,0.4);
                }

                .ending-subtitle {
                    font-size: 22px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.7);
                    letter-spacing: 0.3px;
                }

                /* Stats Grid */
                .ending-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                    animation: fadeIn 0.8s ease 0.7s backwards;
                }

                .ending-stat-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 28px;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                }

                .ending-stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
                    background: rgba(255,255,255,0.08);
                }

                .ending-stat-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 16px;
                }

                .ending-stat-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.5);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }

                .ending-stat-value {
                    font-size: 36px;
                    font-weight: 800;
                    margin-bottom: 4px;
                }

                .ending-stat-subtext {
                    font-size: 14px;
                    color: rgba(255,255,255,0.5);
                }

                /* Achievement Card */
                .ending-achievement-card {
                    border-width: 2px;
                    position: relative;
                    overflow: hidden;
                }

                .ending-achievement-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    margin-bottom: 16px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }

                .ending-achievement-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                /* Story Section */
                .ending-story-section {
                    background: rgba(255,255,255,0.98);
                    border-radius: 24px;
                    padding: 36px;
                    margin-bottom: 32px;
                    box-shadow:
                        0 20px 60px rgba(0,0,0,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.9);
                    animation: fadeIn 0.8s ease 0.9s backwards;
                }

                .ending-story-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 700;
                    color: rgba(0,0,0,0.6);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 24px;
                }

                .ending-story-content {
                    color: #1a1a1a;
                }

                .ending-story-para {
                    font-size: 18px;
                    line-height: 1.8;
                    margin-bottom: 16px;
                    opacity: 0;
                    animation: fadeInUp 0.6s ease forwards;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .ending-story-spacer {
                    height: 12px;
                }

                .ending-story-para:last-child {
                    margin-bottom: 0;
                }

                /* Personal Feedback Section */
                .ending-feedback-section {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 32px;
                    margin-bottom: 32px;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.8s ease 1s backwards;
                }

                .ending-feedback-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .ending-feedback-icon {
                    flex-shrink: 0;
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }

                .ending-feedback-title-group {
                    flex: 1;
                }

                .ending-feedback-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.9);
                    margin: 0 0 8px 0;
                }

                .ending-feedback-praise {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }

                .ending-feedback-body {
                    color: rgba(255,255,255,0.85);
                }

                .ending-feedback-analysis {
                    font-size: 16px;
                    line-height: 1.7;
                    margin-bottom: 16px;
                }

                .ending-feedback-analysis strong {
                    color: rgba(255,255,255,0.95);
                }

                .ending-feedback-highlight {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    border-left: 3px solid rgba(255,255,255,0.2);
                    font-size: 15px;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.8);
                }

                .ending-feedback-highlight svg {
                    flex-shrink: 0;
                    margin-top: 2px;
                    opacity: 0.7;
                }

                /* Tips Section */
                .ending-tips-section {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 24px;
                    padding: 32px;
                    margin-bottom: 32px;
                    animation: fadeIn 0.8s ease 1.1s backwards;
                }

                .ending-section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.7);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 24px;
                }

                .ending-tips-grid {
                    display: grid;
                    gap: 16px;
                }

                .ending-tip-item {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 20px 24px;
                    font-size: 16px;
                    line-height: 1.7;
                    color: rgba(255,255,255,0.9);
                    opacity: 0;
                    animation: fadeInUp 0.5s ease forwards;
                    transition: all 0.3s ease;
                }

                .ending-tip-item:hover {
                    transform: translateX(4px);
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.15);
                }

                /* Advice Section */
                .ending-advice-section {
                    margin-bottom: 32px;
                    animation: fadeIn 0.8s ease 1.2s backwards;
                }

                .ending-advice-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }

                .ending-advice-card {
                    background: rgba(255,255,255,0.05);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 28px;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ending-advice-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
                    background: rgba(255,255,255,0.08);
                    border-width: 2px;
                }

                .ending-advice-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 16px;
                }

                .ending-advice-label {
                    font-size: 13px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    margin-bottom: 12px;
                }

                .ending-advice-text {
                    font-size: 15px;
                    line-height: 1.7;
                    color: rgba(255,255,255,0.85);
                }

                /* Message Card */
                .ending-message-card {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-left-width: 4px;
                    border-radius: 16px;
                    padding: 28px;
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                    margin-bottom: 40px;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.8s ease 1.1s backwards;
                }

                .ending-message-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ending-message-content {
                    flex: 1;
                }

                .ending-message-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    margin-bottom: 8px;
                }

                .ending-message-text {
                    font-size: 17px;
                    font-weight: 500;
                    line-height: 1.7;
                    color: rgba(255,255,255,0.9);
                }

                /* Action Buttons */
                .ending-actions {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 40px;
                    animation: fadeIn 0.8s ease 1.3s backwards;
                }

                .ending-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 32px;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    position: relative;
                    overflow: hidden;
                }

                .ending-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.1);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .ending-btn:hover::before {
                    opacity: 1;
                }

                .ending-btn:active {
                    transform: scale(0.97);
                }

                .ending-btn-primary {
                    color: white;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
                }

                .ending-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
                }

                .ending-btn-secondary {
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.9);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .ending-btn-secondary:hover {
                    background: rgba(255,255,255,0.12);
                    transform: translateY(-2px);
                }

                .ending-btn-certificate {
                    background: rgba(255,255,255,0.05);
                    border: 2px solid currentColor;
                    transition: all 0.3s ease;
                }

                .ending-btn-certificate:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
                }

                .ending-btn-certificate:active {
                    transform: translateY(0) scale(0.98);
                }

                /* Credits Footer */
                .ending-credits {
                    text-align: center;
                    padding-top: 32px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    animation: fadeIn 0.8s ease 1.5s backwards;
                }

                .ending-credits p {
                    font-size: 15px;
                    color: rgba(255,255,255,0.6);
                    margin: 0;
                }

                .ending-credits-divider {
                    width: 40px;
                    height: 1px;
                    background: rgba(255,255,255,0.2);
                    margin: 12px auto;
                }

                .ending-credits-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.4);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    #ending-overlay {
                        padding: 40px 16px 40px 16px;
                    }

                    .ending-main-container {
                        padding: 32px 24px;
                    }

                    .ending-title {
                        font-size: 36px;
                    }

                    .ending-subtitle {
                        font-size: 18px;
                    }

                    .ending-stats-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }

                    .ending-story-section {
                        padding: 24px;
                    }

                    .ending-story-para {
                        font-size: 16px;
                    }

                    .ending-message-card {
                        flex-direction: column;
                        text-align: center;
                        gap: 16px;
                    }

                    .ending-message-text {
                        font-size: 15px;
                    }

                    .ending-feedback-section {
                        padding: 24px;
                    }

                    .ending-feedback-header {
                        flex-direction: column;
                        text-align: center;
                        gap: 16px;
                    }

                    .ending-feedback-title {
                        font-size: 18px;
                    }

                    .ending-tips-section {
                        padding: 24px;
                    }

                    .ending-tip-item {
                        font-size: 15px;
                        padding: 16px 20px;
                    }

                    .ending-advice-grid {
                        grid-template-columns: 1fr;
                    }

                    .ending-actions {
                        flex-direction: column;
                    }

                    .ending-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    #ending-overlay {
                        padding: 30px 12px 30px 12px;
                    }

                    .ending-main-container {
                        padding: 24px 16px;
                        border-radius: 20px;
                        margin: 0 auto;
                    }

                    .ending-title {
                        font-size: 28px;
                    }

                    .ending-stat-value {
                        font-size: 28px;
                    }

                    .ending-feedback-section {
                        padding: 20px;
                    }

                    .ending-feedback-title {
                        font-size: 16px;
                    }

                    .ending-feedback-praise {
                        font-size: 14px;
                    }

                    .ending-tips-section {
                        padding: 20px;
                    }

                    .ending-tip-item {
                        font-size: 14px;
                        padding: 14px 18px;
                    }

                    .ending-advice-card {
                        padding: 20px;
                    }
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(this.overlay);

            // Button actions
            const resetScoreData = () => {
                const existingScoreUI = document.getElementById('score-ui');
                if (existingScoreUI) {
                    existingScoreUI.remove();
                }

                const expInstance = Experience.instance;
                if (expInstance && expInstance.scoreManager) {
                    expInstance.scoreManager.resetScore();
                } else {
                    try {
                        localStorage.removeItem('academic_corruption_score');
                    } catch (error) {
                        console.warn('[Ending] Failed to clear stored score:', error);
                    }
                }
            };

            const certificateBtn = this.overlay.querySelector('#ending-certificate');
            const restartBtn = this.overlay.querySelector('#ending-restart');
            const menuBtn = this.overlay.querySelector('#ending-menu');

            if (certificateBtn) {
                certificateBtn.addEventListener('click', () => {
            console.log('[Ending] Download certificate button clicked');
            this.generateCertificate(score, percentage, endingType, endingData);
                });
            }

            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    resetScoreData();
                    this.overlay.style.opacity = '0';
                    setTimeout(() => window.location.reload(), 300);
                });
            }

            if (menuBtn) {
                menuBtn.addEventListener('click', () => {
                    resetScoreData();
                    this.overlay.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = window.location.pathname + '?scene=westgate';
                    }, 300);
                });
            }

            // Language change listener - rebuild ending with new language
            this.languageChangeListener = () => {
                console.log('[Ending] Language changed, refreshing ending screen');
                if (this.overlay && this.isShowing) {
                    // Store scroll position
                    const scrollPos = this.overlay.scrollTop;

                    // Temporarily disable showing flag to allow rebuild
                    const wasShowing = this.isShowing;
                    this.isShowing = false;

                    // Remove old overlay without animation
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.parentNode.removeChild(this.overlay);
                    }

                    // Show new ending with updated language
                    this.show().then(() => {
                        // Restore scroll position after short delay
                        setTimeout(() => {
                            if (this.overlay) {
                                this.overlay.scrollTop = scrollPos;
                            }
                        }, 100);
                    });
                }
            };

            window.addEventListener('languageChanged', this.languageChangeListener);
            console.log('[Ending] Language change listener added');

            // Resolve after shown
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }

    /**
     * Load image as base64
     */
    loadImageAsBase64(url) {
        return new Promise((resolve, reject) => {
        const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = reject;
            img.src = encodeURI(url);
        });
    }

    /**
     * Generate and download certificate PDF with professional design
     */
    async generateCertificate(score, percentage, endingType, endingData) {
        const labels = this.getLabels();
        const userName = localStorage.getItem('impuritea-username') || 'Player';
        const endingTitle = this.t(endingData.title);
        const achievementTitle = this.t(endingData.achievement);
        const achievementDesc = this.t(endingData.achievementDesc);
        const impactLabel = this.t(endingData.impact);
        const corruptionLabel = this.t(labels.corruptionScore);
        const overallImpactLabel = this.t(labels.overallImpact);

        console.log('[Ending] Generating professional certificate...');
        console.log(`[Certificate] User: ${userName}`);
        console.log(`[Certificate] Score: ${score}, Percentage: ${percentage}%, Ending: ${endingType}`);
        console.log(`[Certificate] Achievement: ${achievementTitle}, Impact: ${impactLabel}`);

        // Get user name from localStorage
        // Get current date
        const currentDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const currentDateEN = new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            console.error('[Ending] jsPDF library not loaded');
            alert('PDF library not loaded. Please refresh the page.');
            return;
        }

        try {
            // Load logo
            const logoBase64 = await this.loadImageAsBase64('/images/logo impur.png');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Professional Certificate Design
            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();
            const margin = 15;

            // === BACKGROUND ===
            // Main background - clean white
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, width, height, 'F');

            // Top accent stripe
            let r, g, b;
            if (endingType === 'clean') {
                [r, g, b] = [102, 126, 234]; // Purple
            } else if (endingType === 'gray') {
                [r, g, b] = [255, 167, 38]; // Orange
            } else {
                [r, g, b] = [239, 83, 80]; // Red
            }
            doc.setFillColor(r, g, b);
            doc.rect(0, 0, width, 8, 'F');

            // Decorative corner elements
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(2);
            // Top left corner
            doc.line(margin, margin + 5, margin + 20, margin + 5);
            doc.line(margin, margin + 5, margin, margin + 25);
            // Top right corner
            doc.line(width - margin - 20, margin + 5, width - margin, margin + 5);
            doc.line(width - margin, margin + 5, width - margin, margin + 25);
            // Bottom left corner
            doc.line(margin, height - margin - 25, margin, height - margin - 5);
            doc.line(margin, height - margin - 5, margin + 20, height - margin - 5);
            // Bottom right corner
            doc.line(width - margin - 20, height - margin - 5, width - margin, height - margin - 5);
            doc.line(width - margin, height - margin - 25, width - margin, height - margin - 5);

            // Main border
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.rect(margin, margin, width - 2 * margin, height - 2 * margin);

            // === HEADER SECTION ===
            // Add logo
            const logoSize = 25;
            doc.addImage(logoBase64, 'PNG', 25, 20, logoSize, logoSize);

            // Organization name next to logo
            doc.setFontSize(16);
            doc.setTextColor(50, 50, 50);
            doc.setFont('helvetica', 'bold');
            doc.text('IMPURITEA', 25 + logoSize + 8, 28);

            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            doc.text('Anti-Corruption Educational Program', 25 + logoSize + 8, 34);
            doc.text('Where Integrity Meets Courage', 25 + logoSize + 8, 39);

            // Certificate title (large, centered)
            doc.setFontSize(36);
            doc.setTextColor(40, 40, 40);
            doc.setFont('times', 'bold');
            doc.text('CERTIFICATE', width / 2, 65, { align: 'center' });

            doc.setFontSize(28);
            doc.setTextColor(80, 80, 80);
            doc.text('OF COMPLETION', width / 2, 75, { align: 'center' });

            // Decorative line under title
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(1.5);
            doc.line(width / 2 - 40, 78, width / 2 + 40, 78);

            // === MAIN CONTENT ===
            // "This is to certify that"
            doc.setFontSize(11);
            doc.setTextColor(90, 90, 90);
            doc.setFont('helvetica', 'italic');
            doc.text(this.t({
                id: "Dengan ini menyatakan bahwa",
                en: "This is to certify that"
            }), width / 2, 92, { align: 'center' });

            // Participant name (large, emphasized)
            doc.setFontSize(32);
            doc.setTextColor(30, 30, 30);
            doc.setFont('times', 'bold');
            doc.text(userName, width / 2, 107, { align: 'center' });

            // Underline for name
            const nameWidth = doc.getTextWidth(userName);
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(0.8);
            doc.line(width / 2 - nameWidth / 2 - 5, 109, width / 2 + nameWidth / 2 + 5, 109);

            // Has successfully completed
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'normal');
            doc.text(this.t({
                id: "telah menyelesaikan perjalanan naratif interaktif",
                en: "has successfully completed the interactive narrative journey"
            }), width / 2, 120, { align: 'center' });
            doc.text(this.t({
                id: "dan menunjukkan pemahaman akan pengambilan keputusan beretika dengan meraih",
                en: "and demonstrated understanding of ethical decision-making by achieving"
            }), width / 2, 127, { align: 'center' });

            // Achievement Badge (colored box)
            const badgeY = 135;
            const badgeWidth = 100;
            const badgeHeight = 20;

            // Badge background
            doc.setFillColor(r, g, b);
            doc.setGState(new doc.GState({ opacity: 0.15 }));
            doc.roundedRect(width / 2 - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));

            // Badge border
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(0.5);
            doc.roundedRect(width / 2 - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 3, 3, 'S');

            // Badge text
            doc.setFontSize(16);
            doc.setTextColor(r, g, b);
            doc.setFont('helvetica', 'bold');
            doc.text(endingTitle, width / 2, badgeY + 13, { align: 'center' });

            // Achievement subtitle
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`"${achievementDesc}"`, width / 2, badgeY + 28, { align: 'center' });

            // === PERFORMANCE METRICS ===
            const metricsY = 169;
            const boxWidth = 65;
            const boxHeight = 22;
            const boxGap = 10;

            // Corruption Score Box
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(width / 2 - boxWidth - boxGap / 2, metricsY, boxWidth, boxHeight, 2, 2, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.roundedRect(width / 2 - boxWidth - boxGap / 2, metricsY, boxWidth, boxHeight, 2, 2, 'S');

            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'bold');
            doc.text(corruptionLabel.toUpperCase(), width / 2 - boxWidth / 2 - boxGap / 2, metricsY + 7, { align: 'center' });

            doc.setFontSize(20);
            doc.setTextColor(r, g, b);
            doc.setFont('helvetica', 'bold');
            doc.text(`${percentage.toFixed(0)}%`, width / 2 - boxWidth / 2 - boxGap / 2, metricsY + 18, { align: 'center' });

            // Impact Box
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(width / 2 + boxGap / 2, metricsY, boxWidth, boxHeight, 2, 2, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.roundedRect(width / 2 + boxGap / 2, metricsY, boxWidth, boxHeight, 2, 2, 'S');

            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'bold');
            doc.text(overallImpactLabel.toUpperCase(), width / 2 + boxWidth / 2 + boxGap / 2, metricsY + 7, { align: 'center' });

            doc.setFontSize(20);
            doc.setTextColor(r, g, b);
            doc.setFont('helvetica', 'bold');
            doc.text(impactLabel, width / 2 + boxWidth / 2 + boxGap / 2, metricsY + 18, { align: 'center' });

            // === FOOTER SECTION ===
            const footerY = height - 38;

            // Left side - Date and Certificate ID
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'bold');
            doc.text(this.t({
                id: "Tanggal Terbit:",
                en: "Date of Issue:"
            }), 25, footerY);
            doc.setFont('helvetica', 'normal');
            doc.text(currentDateEN, 25, footerY + 5);

            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text(this.t({
                id: "ID Sertifikat:",
                en: "Certificate ID:"
            }) + ' ' + Date.now().toString(36).toUpperCase(), 25, footerY + 12);

            // Center - Seal/Badge
            doc.setFillColor(r, g, b);
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.circle(width / 2, footerY + 3, 15, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));

            doc.setDrawColor(r, g, b);
            doc.setLineWidth(1.5);
            doc.circle(width / 2, footerY + 3, 15, 'S');
            doc.setLineWidth(0.8);
            doc.circle(width / 2, footerY + 3, 12, 'S');

            doc.setFontSize(8);
            doc.setTextColor(r, g, b);
            doc.setFont('helvetica', 'bold');
            doc.text('VERIFIED', width / 2, footerY + 2, { align: 'center' });
            doc.setFontSize(6);
            doc.text('IMPURITEA', width / 2, footerY + 7, { align: 'center' });

            // Right side - Digital Signature
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'bold');
            doc.text(this.t({
                id: "Tanda Tangan Resmi",
                en: "Authorized Signature"
            }), width - 25, footerY, { align: 'right' });

            // Signature line
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(width - 70, footerY + 3, width - 25, footerY + 3);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text('IMPURITEA Education Team', width - 25, footerY + 8, { align: 'right' });
            doc.text('Digital Certificate System', width - 25, footerY + 13, { align: 'right' });

            // Bottom disclaimer
            doc.setFontSize(7);
            doc.setTextColor(160, 160, 160);
            doc.setFont('helvetica', 'italic');
            const disclaimerText = this.t({
                id: 'Sertifikat ini menegaskan penyelesaian pengalaman naratif edukatif yang berfokus pada integritas, pengambilan keputusan etis, dan kesadaran anti-korupsi.',
                en: 'This certificate acknowledges the completion of an educational narrative experience focused on integrity, ethical decision-making, and anti-corruption awareness.'
            });
            doc.text(disclaimerText, width / 2, height - 12, { align: 'center', maxWidth: width - 50 });

            // Copyright
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text('© 2025 IMPURITEA - All Rights Reserved', width / 2, height - 7, { align: 'center' });

            // Save the PDF
            const fileName = `IMPURITEA_Certificate_${userName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            doc.save(fileName);

            console.log(`[Ending] Professional certificate generated: ${fileName}`);

        } catch (error) {
            console.error('[Ending] Error generating certificate:', error);
            alert('Failed to generate certificate. Please try again or check if the logo image is accessible.');
        }
    }

    /**
     * Remove ending screen
     */
    dispose() {
        // Remove language listener
        if (this.languageChangeListener) {
            window.removeEventListener('languageChanged', this.languageChangeListener);
            this.languageChangeListener = null;
            console.log('[Ending] Language change listener removed');
        }

        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
                this.isShowing = false;
            }, 800);
        }
    }
}
