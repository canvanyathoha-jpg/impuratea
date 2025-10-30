/**
 * ScoreManager.js
 * Manages corruption score throughout the academic storyline
 * Score starts at 10% and increases based on player choices
 */

export default class ScoreManager {
    constructor() {
        this.maxScore = 100;
        this.minScore = 10;
        this.score = this.loadScore();
        
        // Hide score UI during gameplay - only show at ending
        this.showScoreUIFlag = false; // Set to true only when showing ending
        
        console.log(`[ScoreManager] Initialized with score: ${this.score}%`);
    }

    // Add score based on choice
    addScore(points) {
        const oldScore = this.score;
        this.score = Math.min(this.maxScore, this.score + points);
        this.saveScore();
        
        console.log(`[ScoreManager] Score change: ${oldScore}% → ${this.score}% (+${points}%)`);
        
        // Hide visual feedback and UI during gameplay
        // Only show at ending - keeping track in background silently
        
        return this.score;
    }
    
    /**
     * Show visual feedback when score changes
     */
    showScoreChangeFeedback(points, oldScore, newScore) {
        // Remove existing feedback
        const existing = document.getElementById('score-change-feedback');
        if (existing) existing.remove();
        
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'score-change-feedback';
        feedbackDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            z-index: 10001;
            animation: scoreFlash 0.8s ease-out;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
            border: 2px solid #ff6b6b;
        `;
        
        feedbackDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>⚠️</span>
                <div>
                    <div>Corruption +${points}%</div>
                    <div style="font-size: 14px; opacity: 0.8;">${oldScore}% → ${newScore}%</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(feedbackDiv);
        
        // Add animation style if not exists
        if (!document.getElementById('score-flash-animation')) {
            const style = document.createElement('style');
            style.id = 'score-flash-animation';
            style.textContent = `
                @keyframes scoreFlash {
                    0% {
                        opacity: 0;
                        transform: translateX(50px) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translateX(0) scale(1.1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-20px) scale(0.9);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after animation
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.remove();
            }
        }, 800);
    }
    
    /**
     * Update score UI with smooth animation
     */
    updateScoreUI() {
        const scoreDiv = document.getElementById('score-ui');
        if (!scoreDiv) return;
        
        // Find score number element
        const scoreNumber = scoreDiv.querySelector('div:nth-child(2)'); // Second div contains the score
        const progressBar = scoreDiv.querySelector('div[style*="width"] div'); // Nested div is progress bar
        
        // Update score number text with animation
        if (scoreNumber) {
            // Flash animation
            scoreNumber.style.animation = 'none';
            // Update text
            scoreNumber.textContent = `${this.score}%`;
            scoreNumber.style.color = this.getScoreColor();
            
            setTimeout(() => {
                scoreNumber.style.animation = 'scoreNumberFlash 0.5s ease';
            }, 10);
        }
        
        if (progressBar) {
            // Update progress bar with new score
            progressBar.style.width = `${this.score}%`;
            progressBar.style.background = this.getScoreColor();
            // Flash animation
            progressBar.style.animation = 'progressBarFlash 0.5s ease';
        }
        
        // Update border color
        scoreDiv.style.borderColor = this.getScoreColor();
        
        // Add animations if not exist
        if (!document.getElementById('score-ui-animations')) {
            const style = document.createElement('style');
            style.id = 'score-ui-animations';
            style.textContent = `
                @keyframes scoreNumberFlash {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                @keyframes progressBarFlash {
                    0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0); }
                    50% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get current score
    getScore() {
        return this.score;
    }

    // Reset score to initial value
    resetScore() {
        this.score = this.minScore;
        this.saveScore();
        console.log(`[ScoreManager] Score reset to ${this.minScore}%`);
    }

    // Save score to localStorage
    saveScore() {
        try {
            localStorage.setItem('academic_corruption_score', this.score.toString());
        } catch (error) {
            console.error('[ScoreManager] Failed to save score:', error);
        }
    }

    // Load score from localStorage
    loadScore() {
        try {
            const saved = localStorage.getItem('academic_corruption_score');
            return saved ? parseInt(saved) : this.minScore;
        } catch (error) {
            console.error('[ScoreManager] Failed to load score:', error);
            return this.minScore;
        }
    }

    // Determine ending based on score
    getEnding() {
        if (this.score <= 50) {
            return {
                type: 'BERSIH',
                title: 'Ending Bersih - Integritas Sendirian',
                description: 'Kamu memilih jalur jujur hampir di semua kesempatan. Nilai rata-rata rendah, sering dipermalukan, bahkan dicoret dari kelompok. Namun guru melihat ketekunan dan kejujuranmu, sehingga kamu mendapat apresiasi simbolis. Meski tanpa banyak teman, kamu belajar bahwa harga diri lebih berharga dari nilai.',
                color: '#00ff00'
            };
        } else if (this.score <= 75) {
            return {
                type: 'ABU_ABU',
                title: 'Ending Abu-Abu - Kompromi Setengah-setengah',
                description: 'Kamu kadang jujur, kadang mengambil jalan pintas. Kadang lolos, kadang kena masalah. Guru dan teman menilaimu "tidak bisa dipercaya" karena plin-plan. Kamu naik kelas dengan nilai pas-pasan, tapi tidak ada yang benar-benar menghargai usahamu. Setengah integritas = sama saja tidak punya integritas.',
                color: '#ffaa00'
            };
        } else {
            return {
                type: 'BURUK',
                title: 'Ending Buruk - Korupsi Kecil Terbongkar',
                description: 'Kamu sering memilih jalan pintas (AI, bocoran, beli materi). Awalnya nilai bagus, tapi akhirnya ketahuan saat ada audit nilai & guru membandingkan pekerjaan. Kamu dipanggil BK, nilaimu dibatalkan, dan hampir gagal naik kelas. Reputasi rusak, teman menjauhi, orang tua kecewa. Korupsi kecil akhirnya selalu ketahuan.',
                color: '#ff0000'
            };
        }
    }

    // Display score UI (only call this when showing ending)
    showScoreUI() {
        // Only show if flag is enabled (typically only at ending)
        if (!this.showScoreUIFlag) {
            return;
        }
        
        // Remove existing score UI if any
        const existing = document.getElementById('score-ui');
        if (existing) existing.remove();

        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'score-ui';
        scoreDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid ${this.getScoreColor()};
            color: white;
            font-family: Arial, sans-serif;
            z-index: 999;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
        `;

        scoreDiv.innerHTML = `
            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Corruption Level</div>
            <div style="font-size: 24px; font-weight: bold; color: ${this.getScoreColor()};">${this.score}%</div>
            <div style="width: 150px; height: 8px; background: #333; border-radius: 4px; margin-top: 8px; overflow: hidden;">
                <div style="width: ${this.score}%; height: 100%; background: ${this.getScoreColor()}; transition: width 0.5s;"></div>
            </div>
        `;

        document.body.appendChild(scoreDiv);
    }
    
    /**
     * Enable score UI display (call this before showing ending)
     */
    enableScoreUI() {
        this.showScoreUIFlag = true; // Use different variable name to avoid conflict with method name
        // Call the method to actually display the UI
        const existing = document.getElementById('score-ui');
        if (existing) existing.remove();

        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'score-ui';
        scoreDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid ${this.getScoreColor()};
            color: white;
            font-family: Arial, sans-serif;
            z-index: 999;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
        `;

        scoreDiv.innerHTML = `
            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Corruption Level</div>
            <div style="font-size: 24px; font-weight: bold; color: ${this.getScoreColor()};">${this.score}%</div>
            <div style="width: 150px; height: 8px; background: #333; border-radius: 4px; margin-top: 8px; overflow: hidden;">
                <div style="width: ${this.score}%; height: 100%; background: ${this.getScoreColor()}; transition: width 0.5s;"></div>
            </div>
        `;

        document.body.appendChild(scoreDiv);
    }
    
    /**
     * Disable score UI display (default during gameplay)
     */
    disableScoreUI() {
        this.showScoreUIFlag = false;
        this.hideScoreUI(); // Hide immediately
    }

    // Hide score UI
    hideScoreUI() {
        const scoreDiv = document.getElementById('score-ui');
        if (scoreDiv) {
            scoreDiv.remove();
        }
    }

    // Get color based on score
    getScoreColor() {
        if (this.score <= 50) return '#00ff00'; // Green - Bersih
        if (this.score <= 75) return '#ffaa00'; // Orange - Abu-abu
        return '#ff0000'; // Red - Buruk
    }
}