export default class PsychologyQuiz {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];

        this.questions = [
            {
                question: "Bayangkan kamu punya waktu luang satu hari penuh. Apa yang paling ingin kamu lakukan?",
                options: [
                    { text: "Membaca buku atau mempelajari hal baru yang menarik perhatianku", value: "akademik" },
                    { text: "Berkumpul dengan teman-teman dan mengorganisir kegiatan seru bersama", value: "organisasi" },
                    { text: "Mengerjakan proyek pribadi atau riset yang sudah lama ingin ku selesaikan", value: "akademik" },
                    { text: "Merencanakan event atau acara untuk komunitas kampus", value: "organisasi" }
                ]
            },
            {
                question: "Ketika menghadapi masalah, kamu lebih suka...",
                options: [
                    { text: "Menganalisis secara mendalam dan mencari solusi berdasarkan data", value: "akademik" },
                    { text: "Berdiskusi dengan banyak orang untuk mendapat berbagai perspektif", value: "organisasi" },
                    { text: "Mencari referensi dari buku atau jurnal untuk solusi terbaik", value: "akademik" },
                    { text: "Membentuk tim dan mencari solusi bersama-sama", value: "organisasi" }
                ]
            },
            {
                question: "Prestasi yang paling membuatmu bangga adalah...",
                options: [
                    { text: "Mendapat nilai sempurna atau menguasai topik yang sulit", value: "akademik" },
                    { text: "Berhasil mengkoordinir acara besar yang disukai banyak orang", value: "organisasi" },
                    { text: "Menyelesaikan penelitian atau karya ilmiah yang berkualitas", value: "akademik" },
                    { text: "Membangun komunitas atau organisasi yang berdampak positif", value: "organisasi" }
                ]
            }
        ];

        this.elements = {
            psychologyQuestion: document.getElementById('psychologyQuestion'),
            pathRecommendation: document.getElementById('pathRecommendation'),
            questionText: null,
            optionsContainer: null,
            progressText: null,
            recommendationIcon: document.getElementById('recommendationIcon'),
            recommendationPath: document.getElementById('recommendationPath'),
            recommendationDesc: document.getElementById('recommendationDesc')
        };

        this.init();
    }

    init() {
        // Get dynamic elements that will be created
        this.elements.questionText = this.elements.psychologyQuestion.querySelector('.psychology-question-text');
        this.elements.optionsContainer = this.elements.psychologyQuestion.querySelector('.psychology-options');
        this.elements.progressText = this.elements.psychologyQuestion.querySelector('.question-progress');

        this.renderQuestion();
        this.attachEventListeners();
    }

    renderQuestion() {
        const question = this.questions[this.currentQuestion];

        // Update question text
        this.elements.questionText.textContent = question.question;

        // Update options
        this.elements.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionButton = document.createElement('button');
            optionButton.className = 'psychology-option-btn';
            optionButton.dataset.answer = option.value;
            optionButton.innerHTML = `
                <div class="option-number">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option.text}</div>
            `;
            this.elements.optionsContainer.appendChild(optionButton);
        });

        // Update progress
        this.elements.progressText.textContent = `Pertanyaan ${this.currentQuestion + 1} dari ${this.questions.length}`;

        // Re-attach event listeners for new buttons
        this.attachEventListeners();
    }

    attachEventListeners() {
        const optionButtons = this.elements.optionsContainer.querySelectorAll('.psychology-option-btn');
        optionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAnswer(e));
        });
    }

    handleAnswer(event) {
        const answer = event.currentTarget.dataset.answer;
        this.answers.push(answer);

        // Animate selection
        event.currentTarget.style.transform = 'scale(0.95)';
        event.currentTarget.style.opacity = '0.7';

        setTimeout(() => {
            if (this.currentQuestion < this.questions.length - 1) {
                this.currentQuestion++;
                this.renderQuestion();
            } else {
                this.showRecommendation();
            }
        }, 300);
    }

    showRecommendation() {
        // Count answers
        const akademikCount = this.answers.filter(a => a === 'akademik').length;
        const organisasiCount = this.answers.filter(a => a === 'organisasi').length;

        const recommendedPath = akademikCount >= organisasiCount ? 'akademik' : 'organisasi';

        // Update recommendation UI
        if (recommendedPath === 'akademik') {
            this.elements.recommendationIcon.textContent = '📚';
            this.elements.recommendationPath.textContent = 'Jalur Akademik';
            this.elements.recommendationDesc.textContent =
                'Berdasarkan jawabanmu, kamu memiliki kecenderungan untuk fokus pada pembelajaran dan pengembangan pengetahuan. Kamu suka menganalisis, meneliti, dan mendalami topik secara mendalam. Jalur Akademik cocok untukmu!';
        } else {
            this.elements.recommendationIcon.textContent = '🎭';
            this.elements.recommendationPath.textContent = 'Jalur Organisasi';
            this.elements.recommendationDesc.textContent =
                'Berdasarkan jawabanmu, kamu memiliki jiwa kepemimpinan dan suka berinteraksi dengan banyak orang. Kamu senang mengorganisir kegiatan dan bekerja dalam tim. Jalur Organisasi cocok untukmu!';
        }

        // Highlight recommended button
        setTimeout(() => {
            const btnAkademik = document.getElementById('btnAkademik');
            const btnOrganisasi = document.getElementById('btnOrganisasi');

            if (recommendedPath === 'akademik') {
                btnAkademik.classList.add('recommended');
            } else {
                btnOrganisasi.classList.add('recommended');
            }
        }, 500);

        // Hide question screen, show recommendation screen
        this.elements.psychologyQuestion.classList.add('hidden');
        this.elements.pathRecommendation.classList.remove('hidden');
    }
}
