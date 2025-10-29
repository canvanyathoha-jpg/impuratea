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
        const totalScore = parseInt(localStorage.getItem('corruption-score') || '0');
        const maxScore = 95; // Skor maksimal yang mungkin didapat
        // Normalisasi ke persentase (skor maksimal = 95)
        const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100));
        return {
            score: totalScore,
            percentage: percentage
        };
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
                <div class="ending-container">
                    <div class="ending-header">
                        <div class="ending-title" style="color: ${endingData.color}">
                            ${endingData.title}
                        </div>
                        <div class="ending-subtitle">
                            ${endingData.subtitle}
                        </div>
                        
                        <!-- Skor Display - Menampilkan skor dengan jelas -->
                        <div class="ending-score-display">
                            <div class="ending-score-label">Skor Korupsi</div>
                            <div class="ending-score-value" style="color: ${endingData.color}">
                                ${score} / 95
                            </div>
                            <div class="ending-score-percentage" style="color: ${endingData.color}">
                                ${percentage.toFixed(1)}%
                            </div>
                            <div class="ending-score-range">
                                Rentang: ${endingData.percentage}
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
                        <button class="ending-restart-btn" onclick="window.location.reload()">
                            Main Lagi
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
                background: rgba(0, 0, 0, 0.95);
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
                .ending-container {
                    background: ${endingData.gradient};
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-radius: 30px;
                    padding: 50px;
                    max-width: 800px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    text-align: center;
                    animation: slideUp 0.8s ease;
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

                .ending-header {
                    margin-bottom: 40px;
                }

                .ending-title {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .ending-subtitle {
                    font-size: 28px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.95);
                    margin-bottom: 15px;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }

                .ending-score-display {
                    background: rgba(255, 255, 255, 0.15);
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 20px;
                    padding: 25px;
                    margin: 30px auto 0;
                    max-width: 500px;
                    backdrop-filter: blur(10px);
                }

                .ending-score-label {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 10px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .ending-score-value {
                    font-size: 42px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }

                .ending-score-percentage {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
                }

                .ending-score-range {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    margin-top: 8px;
                    font-weight: 500;
                }

                .ending-story {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 35px;
                    margin-bottom: 30px;
                    text-align: left;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                }

                .ending-story p {
                    font-size: 19px;
                    line-height: 1.8;
                    color: #333;
                    margin-bottom: 15px;
                }

                .ending-story p:last-child {
                    margin-bottom: 0;
                }

                .ending-message {
                    background: rgba(255, 255, 255, 0.2);
                    border: 3px solid;
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    backdrop-filter: blur(10px);
                }

                .ending-message-icon {
                    font-size: 32px;
                    margin-bottom: 15px;
                }

                .ending-message-text {
                    font-size: 20px;
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1.6;
                    font-weight: 500;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }

                .ending-actions {
                    margin-top: 30px;
                }

                .ending-restart-btn {
                    background: rgba(255, 255, 255, 0.95);
                    color: #333;
                    border: none;
                    border-radius: 50px;
                    padding: 18px 50px;
                    font-size: 20px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                }

                .ending-restart-btn:hover {
                    background: white;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                }

                .ending-restart-btn:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .ending-container {
                        padding: 30px 20px;
                    }

                    .ending-title {
                        font-size: 36px;
                    }

                    .ending-subtitle {
                        font-size: 22px;
                    }

                    .ending-score-display {
                        padding: 20px;
                        margin: 20px auto 0;
                    }

                    .ending-score-value {
                        font-size: 36px;
                    }

                    .ending-score-percentage {
                        font-size: 28px;
                    }

                    .ending-story {
                        padding: 25px;
                    }

                    .ending-story p {
                        font-size: 16px;
                    }

                    .ending-message-text {
                        font-size: 18px;
                    }
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(this.overlay);

            // Fade in
            setTimeout(() => {
                this.overlay.style.opacity = '1';
            }, 100);

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

