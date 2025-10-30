/**
 * Ending.js
 * 
 * Menampilkan ending cerita berdasarkan skor korupsi yang diperoleh player.
 * Skor maksimal = 100 (100%)
 * 
 * Ending bersih (10-50%): Menolak semua kecurangan
 * Ending abu-abu (51-75%): Kompromi setengah-setengah
 * Ending buruk (76-100%): Kejatuhan integritas
 */

import Experience from "../Experience.js";

export default class Ending {
    constructor() {
        this.overlay = null;
        this.isShowing = false;
    }

    /**
     * Menghitung persentase skor korupsi
     * Skor maksimal = 95 (dari semua pilihan terburuk di semua scene)
     */
    calculatePercentage() {
        // Prefer ScoreManager (persentase 0-100)
        let percentageFromManager = null;
        const exp = Experience.instance;
        if (exp && exp.scoreManager && typeof exp.scoreManager.getScore === 'function') {
            percentageFromManager = exp.scoreManager.getScore();
        }

        // Legacy/local fallbacks
        const legacyRaw = parseInt(localStorage.getItem('corruption-score') || '0'); // 0..95
        const managerStored = parseInt(localStorage.getItem('academic_corruption_score') || '0'); // 0..100

        const maxScore = 95; // Skor maksimal yang mungkin didapat

        if (typeof percentageFromManager === 'number' && !Number.isNaN(percentageFromManager)) {
            const pct = Math.max(0, Math.min(100, percentageFromManager));
            const rawApprox = Math.round((pct / 100) * maxScore);
            return { score: rawApprox, percentage: pct };
        }

        if (!Number.isNaN(managerStored) && managerStored > 0) {
            const pct = Math.max(0, Math.min(100, managerStored));
            const rawApprox = Math.round((pct / 100) * maxScore);
            return { score: rawApprox, percentage: pct };
        }

        // Fallback to legacy raw (0..95)
        const totalScore = Math.max(0, Math.min(maxScore, legacyRaw));
        const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100));
        return { score: totalScore, percentage };
    }

    /**
     * Menentukan jenis ending berdasarkan persentase
     */
    determineEnding(percentage) {
        if (percentage >= 10 && percentage <= 50) {
            return 'bersih';
        } else if (percentage >= 51 && percentage <= 75) {
            return 'abu-abu';
        } else if (percentage >= 76 && percentage <= 100) {
            return 'buruk';
        }
        // Default: ending bersih untuk skor < 10
        return 'bersih';
    }

    /**
     * Mendapatkan data ending berdasarkan jenis
     */
    getEndingData(endingType) {
        const endings = {
            bersih: {
                title: "Ending Bersih",
                subtitle: "Integritas Sendirian",
                percentage: "10-50%",
                color: "#4ecdc4",
                gradient: "linear-gradient(135deg, rgba(78, 205, 196, 0.95), rgba(46, 125, 120, 0.95))",
                story: [
                    "Kamu menolak semua bentuk kecurangan yang ditawarkan.",
                    "Meskipun ditinggalkan teman dan dimarahi senior, kamu tetap pada prinsipmu.",
                    "Ketika audit akhirnya dilakukan, semua yang kamu lakukan terbukti benar.",
                    "",
                    "Pembina akhirnya meminta maaf dan memberikan penghargaan khusus",
                    "atas kejujuran dan integritas yang kamu pertahankan.",
                ],
                message: "Integritas adalah pilihan yang sulit, tapi menghasilkan hasil yang benar. Kejujuranmu membuktikan bahwa berdiri sendiri tidak berarti salah."
            },
            'abu-abu': {
                title: "Ending Abu-Abu",
                subtitle: "Kompromi Setengah-Setengah",
                percentage: "51-75%",
                color: "#ffa726",
                gradient: "linear-gradient(135deg, rgba(255, 167, 38, 0.95), rgba(255, 143, 0, 0.95))",
                story: [
                    "Kamu kadang jujur, kadang ikut arus untuk menghindari konflik.",
                    "Acara berhasil sukses dan berjalan dengan lancar.",
                    "Namun, laporan keuangan yang kamu buat terlihat janggal saat diperiksa.",
                    "",
                    "Meskipun kamu tidak dihukum secara formal,",
                    "semua pihak kehilangan kepercayaan padamu.",
                ],
                message: "Kompromi kadang perlu, tapi terlalu banyak kompromi bisa membuatmu kehilangan dirimu sendiri. Kepercayaan yang hilang lebih mahal dari kesuksesan sesaat."
            },
            buruk: {
                title: "Ending Buruk",
                subtitle: "Kejatuhan Integritas",
                percentage: "76-100%",
                color: "#ef5350",
                gradient: "linear-gradient(135deg, rgba(239, 83, 80, 0.95), rgba(183, 28, 28, 0.95))",
                story: [
                    "Kamu sering memanipulasi data dan menuruti permintaan senior tanpa pertimbangan.",
                    "Awalnya kamu dipercaya dan semua acara berjalan sukses.",
                    "Tetapi ketika laporan audit resmi dilakukan, semua kebohonganmu terbongkar.",
                    "",
                    "Senior yang membujukmu menghilang begitu saja,",
                    "sementara kamu harus menanggung semua kesalahan sendirian.",
                ],
                message: "Integritas yang hilang tidak bisa dibeli kembali. Kesuksesan yang dibangun dengan kebohongan akan runtuh pada waktunya, dan kamu akan menanggungnya sendiri."
            }
        };

        return endings[endingType] || endings.bersih;
    }

    /**
     * Menampilkan ending screen
     */
    show() {
        if (this.isShowing) {
            console.warn("[Ending] Ending sudah ditampilkan");
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.isShowing = true;

            // Hitung skor dan tentukan ending
            const { score, percentage } = this.calculatePercentage();
            const endingType = this.determineEnding(percentage);
            const endingData = this.getEndingData(endingType);

            console.log(`[Ending] Score: ${score}, Percentage: ${percentage.toFixed(1)}%, Ending: ${endingType}`);

            // Buat overlay
            this.overlay = document.createElement('div');
            this.overlay.id = 'ending-overlay';
            this.overlay.innerHTML = `
                <div class="ending-bg"></div>
                <div class="ending-bubbles"></div>
                <div class="ending-container">
                    <div class="ending-header">
                        <div class="ending-title" style="color: ${endingData.color}">
                            ${endingData.title}
                        </div>
                        <div class="ending-subtitle">
                            ${endingData.subtitle}
                        </div>
                        <div class="ending-score">
                            <svg class="ending-score-ring" width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
                                <circle class="ending-score-ring-bg" cx="90" cy="90" r="70" />
                                <circle class="ending-score-ring-fg" cx="90" cy="90" r="70" style="stroke: ${endingData.color}; stroke-dashoffset: ${440 - Math.round(440 * (Math.max(0, Math.min(100, percentage)) / 100))};" />
                                <g class="ending-score-ring-text">
                                    <text x="90" y="88" text-anchor="middle" class="ending-score-percent">${percentage.toFixed(0)}%</text>
                                    <text x="90" y="110" text-anchor="middle" class="ending-score-label">Skor</text>
                                </g>
                            </svg>
                            <div class="ending-score-meta">
                                <div class="ending-score-value" style="color: ${endingData.color}">${score} / 95</div>
                                <div class="ending-score-range">Rentang: ${endingData.percentage}</div>
                            </div>
                        </div>
                    </div>

                    <div class="ending-story">
                        ${endingData.story.map(paragraph => 
                            paragraph ? `<p>${paragraph}</p>` : '<br>'
                        ).join('')}
                    </div>

                    <div class="ending-message" style="border-color: ${endingData.color}">
                        <div class="ending-message-icon">💭</div>
                        <div class="ending-message-text">
                            "${endingData.message}"
                        </div>
                    </div>

                    <div class="ending-actions">
                        <button id="ending-restart" class="ending-btn primary">
                            Main Lagi
                        </button>
                        <button id="ending-menu" class="ending-btn ghost">
                            Kembali ke Menu
                        </button>
                    </div>
                </div>
            `;

            // Style untuk overlay
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(1200px 800px at 20% 10%, rgba(30,64,124,0.35), transparent 60%),
                            radial-gradient(1200px 800px at 80% 90%, rgba(118,75,162,0.35), transparent 60%),
                            rgba(0,0,0,0.85);
                z-index: 10000002;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.8s ease;
                overflow-y: auto;
                padding: 40px 20px;
            `;

            // Style untuk container (akan ditambahkan ke CSS atau inline)
            const style = document.createElement('style');
            style.textContent = `
                :root { --ending-accent: ${endingData.color}; }

                .ending-bg::before,
                .ending-bg::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                }

                .ending-bg::before {
                    background: radial-gradient(800px 500px at 10% 20%, rgba(255,255,255,0.06), transparent 60%),
                                radial-gradient(900px 600px at 90% 80%, rgba(255,255,255,0.04), transparent 60%);
                    z-index: -1;
                }

                .ending-bg::after {
                    background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0));
                    mask-image: radial-gradient(70% 50% at 50% 50%, #000 60%, transparent 90%);
                    z-index: -1;
                }

                .ending-bubbles {
                    position: fixed; inset: 0; pointer-events: none; z-index: -1;
                    background:
                        radial-gradient(6px 6px at 20% 30%, rgba(255,255,255,0.08), transparent 50%),
                        radial-gradient(8px 8px at 70% 40%, rgba(255,255,255,0.06), transparent 50%),
                        radial-gradient(5px 5px at 40% 80%, rgba(255,255,255,0.05), transparent 50%);
                    animation: floatBg 18s linear infinite;
                }

                @keyframes floatBg {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                }

                .ending-container {
                    background: linear-gradient(155deg, rgba(20, 20, 28, 0.75), rgba(20, 20, 28, 0.55));
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 24px;
                    backdrop-filter: blur(14px) saturate(120%);
                    padding: 44px;
                    max-width: 920px;
                    width: 100%;
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
                    text-align: center;
                    animation: slideUp 0.7s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .ending-header { margin-bottom: 28px; }

                .ending-title {
                    font-size: 44px;
                    font-weight: 800;
                    margin-bottom: 6px;
                    letter-spacing: 0.3px;
                    text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
                }

                .ending-subtitle {
                    font-size: 20px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 18px;
                    letter-spacing: 0.4px;
                }
                .ending-score { display: flex; gap: 24px; align-items: center; justify-content: center; margin: 22px auto 8px; }
                .ending-score-meta { text-align: left; }
                .ending-score-value { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
                .ending-score-range { font-size: 14px; color: rgba(255,255,255,0.75); }

                .ending-score-ring { filter: drop-shadow(0 6px 18px rgba(0,0,0,0.35)); }
                .ending-score-ring-bg {
                    fill: none; stroke: rgba(255,255,255,0.12); stroke-width: 14; transform: rotate(-90deg); transform-origin: 90px 90px;
                }
                .ending-score-ring-fg {
                    fill: none; stroke-width: 14; stroke-linecap: round; stroke-dasharray: 440; transform: rotate(-90deg); transform-origin: 90px 90px; transition: stroke-dashoffset 900ms ease, stroke 300ms ease;
                }
                .ending-score-percent { font-size: 28px; font-weight: 800; fill: #fff; opacity: 0.95; }
                .ending-score-label { font-size: 12px; fill: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.2px; }

                .ending-story {
                    background: rgba(255, 255, 255, 0.96);
                    border-radius: 18px;
                    padding: 28px 30px;
                    margin-bottom: 22px;
                    text-align: left;
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
                }

                .ending-story p {
                    font-size: 18px;
                    line-height: 1.75;
                    color: #1b1b1f;
                    margin-bottom: 14px;
                }

                .ending-story p:last-child {
                    margin-bottom: 0;
                }

                .ending-message {
                    background: rgba(255, 255, 255, 0.14);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-left: 5px solid var(--ending-accent);
                    border-radius: 14px;
                    padding: 22px;
                    margin-bottom: 18px;
                    backdrop-filter: blur(8px);
                }

                .ending-message-icon {
                    font-size: 28px;
                    margin-bottom: 10px;
                }

                .ending-message-text {
                    font-size: 18px;
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1.6;
                    font-weight: 500;
                }

                .ending-actions { margin-top: 18px; display: flex; gap: 12px; justify-content: center; }

                .ending-btn {
                    border-radius: 12px;
                    padding: 14px 22px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform .15s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
                }
                .ending-btn.primary { background: var(--ending-accent); color: white; border: 0; }
                .ending-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(0,0,0,0.32); }
                .ending-btn.ghost { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.35); }
                .ending-btn.ghost:hover { background: rgba(255,255,255,0.08); transform: translateY(-1px); }

                @media (max-width: 768px) {
                    .ending-container {
                        padding: 26px 18px;
                    }

                    .ending-title {
                        font-size: 28px;
                    }

                    .ending-subtitle {
                        font-size: 16px;
                    }
                    .ending-score { gap: 14px; }
                    .ending-score-value { font-size: 20px; }

                    .ending-story {
                        padding: 18px;
                    }

                    .ending-story p {
                        font-size: 15px;
                    }

                    .ending-message-text {
                        font-size: 16px;
                    }
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(this.overlay);

            // Fade in
            setTimeout(() => {
                this.overlay.style.opacity = '1';
            }, 100);

            // Button actions
            const restartBtn = this.overlay.querySelector('#ending-restart');
            const menuBtn = this.overlay.querySelector('#ending-menu');
            if (restartBtn) restartBtn.addEventListener('click', () => window.location.reload());
            if (menuBtn) menuBtn.addEventListener('click', () => {
                window.location.href = window.location.pathname + '?scene=westgate';
            });

            // Resolve setelah ditampilkan
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }

    /**
     * Menghapus ending screen
     */
    dispose() {
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

