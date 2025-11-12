import { languageManager } from './LanguageManager.js';

export default class PsychologyQuiz {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];

        // Questions will be built dynamically from languageManager
        this.buildQuestions();

        // Listen for language changes
        this.languageChangeHandler = (event) => {
            const newLang = event.detail?.language || languageManager.getLanguage();
            console.log("[PsychologyQuiz] Language changed to:", newLang);
            this.buildQuestions();
            this.updateTitle();
            this.renderQuestion();
            this.updateRecommendationTexts();
        };
        window.addEventListener('languageChanged', this.languageChangeHandler);

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

    buildQuestions() {
        this.questions = [
            {
                question: languageManager.t('psychology.question1'),
                options: [
                    { text: languageManager.t('psychology.option1a'), value: "akademik" },
                    { text: languageManager.t('psychology.option1b'), value: "organisasi" },
                    { text: languageManager.t('psychology.option1c'), value: "akademik" },
                    { text: languageManager.t('psychology.option1d'), value: "organisasi" }
                ]
            },
            {
                question: languageManager.t('psychology.question2'),
                options: [
                    { text: languageManager.t('psychology.option2a'), value: "akademik" },
                    { text: languageManager.t('psychology.option2b'), value: "organisasi" },
                    { text: languageManager.t('psychology.option2c'), value: "akademik" },
                    { text: languageManager.t('psychology.option2d'), value: "organisasi" }
                ]
            },
            {
                question: languageManager.t('psychology.question3'),
                options: [
                    { text: languageManager.t('psychology.option3a'), value: "akademik" },
                    { text: languageManager.t('psychology.option3b'), value: "organisasi" },
                    { text: languageManager.t('psychology.option3c'), value: "akademik" },
                    { text: languageManager.t('psychology.option3d'), value: "organisasi" }
                ]
            }
        ];
    }

    init() {
        // Get dynamic elements that will be created
        this.elements.questionText = this.elements.psychologyQuestion.querySelector('.psychology-question-text');
        this.elements.optionsContainer = this.elements.psychologyQuestion.querySelector('.psychology-options');
        this.elements.progressText = this.elements.psychologyQuestion.querySelector('.question-progress');
        
        // Update title
        this.updateTitle();

        this.renderQuestion();
        this.attachEventListeners();
    }

    updateTitle() {
        const titleElement = this.elements.psychologyQuestion.querySelector('.scene-choice-title');
        if (titleElement) {
            titleElement.textContent = languageManager.t('psychology.title');
        }
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
        const progressText = languageManager.t('psychology.questionProgress')
            .replace('{current}', this.currentQuestion + 1)
            .replace('{total}', this.questions.length);
        this.elements.progressText.textContent = progressText;

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

    updateRecommendationTexts() {
        // Always update recommendation screen texts (even if hidden)
        const recommendationTitle = this.elements.pathRecommendation.querySelector('.scene-choice-title');
        if (recommendationTitle) {
            recommendationTitle.textContent = languageManager.t('psychology.recommendationTitle');
        }
        
        const recommendationNarration = this.elements.pathRecommendation.querySelector('.scene-choice-narration');
        if (recommendationNarration) {
            recommendationNarration.textContent = languageManager.t('psychology.recommendationNarration');
        }
        
        const btnAkademik = document.getElementById('btnAkademik');
        const btnOrganisasi = document.getElementById('btnOrganisasi');
        
        if (btnAkademik) {
            const btnTitle = btnAkademik.querySelector('.btn-title');
            const btnDesc = btnAkademik.querySelector('.btn-desc');
            if (btnTitle) btnTitle.textContent = languageManager.t('psychology.btnAkademik');
            if (btnDesc) btnDesc.textContent = languageManager.t('psychology.btnAkademikDesc');
        }
        
        if (btnOrganisasi) {
            const btnTitle = btnOrganisasi.querySelector('.btn-title');
            const btnDesc = btnOrganisasi.querySelector('.btn-desc');
            if (btnTitle) btnTitle.textContent = languageManager.t('psychology.btnOrganisasi');
            if (btnDesc) btnDesc.textContent = languageManager.t('psychology.btnOrganisasiDesc');
        }
    }

    showRecommendation() {
        // Count answers
        const akademikCount = this.answers.filter(a => a === 'akademik').length;
        const organisasiCount = this.answers.filter(a => a === 'organisasi').length;

        const recommendedPath = akademikCount >= organisasiCount ? 'akademik' : 'organisasi';

        // Update recommendation UI
        if (recommendedPath === 'akademik') {
            this.elements.recommendationIcon.textContent = '📚';
            this.elements.recommendationPath.textContent = languageManager.t('psychology.pathAkademik');
            this.elements.recommendationDesc.textContent = languageManager.t('psychology.pathAkademikDesc');
        } else {
            this.elements.recommendationIcon.textContent = '🎭';
            this.elements.recommendationPath.textContent = languageManager.t('psychology.pathOrganisasi');
            this.elements.recommendationDesc.textContent = languageManager.t('psychology.pathOrganisasiDesc');
        }
        
        // Update other recommendation texts
        const recommendationTitle = this.elements.pathRecommendation.querySelector('.scene-choice-title');
        if (recommendationTitle) {
            recommendationTitle.textContent = languageManager.t('psychology.recommendationTitle');
        }
        
        const recommendationNarration = this.elements.pathRecommendation.querySelector('.scene-choice-narration');
        if (recommendationNarration) {
            recommendationNarration.textContent = languageManager.t('psychology.recommendationNarration');
        }
        
        // Update button texts
        const btnAkademik = document.getElementById('btnAkademik');
        const btnOrganisasi = document.getElementById('btnOrganisasi');
        
        if (btnAkademik) {
            const btnTitle = btnAkademik.querySelector('.btn-title');
            const btnDesc = btnAkademik.querySelector('.btn-desc');
            if (btnTitle) btnTitle.textContent = languageManager.t('psychology.btnAkademik');
            if (btnDesc) btnDesc.textContent = languageManager.t('psychology.btnAkademikDesc');
        }
        
        if (btnOrganisasi) {
            const btnTitle = btnOrganisasi.querySelector('.btn-title');
            const btnDesc = btnOrganisasi.querySelector('.btn-desc');
            if (btnTitle) btnTitle.textContent = languageManager.t('psychology.btnOrganisasi');
            if (btnDesc) btnDesc.textContent = languageManager.t('psychology.btnOrganisasiDesc');
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
    
    dispose() {
        // Remove language change listener
        if (this.languageChangeHandler) {
            window.removeEventListener('languageChanged', this.languageChangeHandler);
            this.languageChangeHandler = null;
        }
    }
}
