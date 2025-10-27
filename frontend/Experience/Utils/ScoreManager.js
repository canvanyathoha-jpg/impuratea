/**
 * ScoreManager.js
 * Manages corruption score throughout the academic storyline
 * Score starts at 10% and increases based on player choices
 */

export default class ScoreManager {
    constructor() {
        this.score = this.loadScore();
        this.maxScore = 100;
        this.minScore = 10;
        
        console.log(`[ScoreManager] Initialized with score: ${this.score}%`);
    }

    // Add score based on choice
    addScore(points) {
        const oldScore = this.score;
        this.score = Math.min(this.maxScore, this.score + points);
        this.saveScore();
        
        console.log(`[ScoreManager] Score change: ${oldScore}% → ${this.score}% (+${points}%)`);
        return this.score;
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

    // Display score UI
    showScoreUI() {
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