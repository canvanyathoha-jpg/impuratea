import PsychologyQuiz from './PsychologyQuiz.js';

export default class SceneManager {
    constructor() {
        this.overlay = document.getElementById('sceneChoiceOverlay');
        this.btnAkademik = document.getElementById('btnAkademik');
        this.btnOrganisasi = document.getElementById('btnOrganisasi');
        this.psychologyQuiz = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.btnAkademik.addEventListener('click', () => {
            this.switchToScene('class');
        });

        this.btnOrganisasi.addEventListener('click', () => {
            this.switchToScene('organization');
        });
    }

    showChoiceOverlay() {
        this.overlay.classList.remove('hidden');

        // Initialize psychology quiz
        if (!this.psychologyQuiz) {
            this.psychologyQuiz = new PsychologyQuiz();
        }
    }

    hideChoiceOverlay() {
        this.overlay.classList.add('hidden');
    }

    switchToScene(sceneName) {
        console.log(`[SceneManager] Switching to scene: ${sceneName}`);
        this.hideChoiceOverlay();

        // Reload page with scene parameter
        const url = new URL(window.location);
        url.searchParams.set('scene', sceneName);
        console.log(`[SceneManager] Redirecting to: ${url.toString()}`);
        window.location.href = url.toString();
    }

    static getSceneFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('scene') || 'westgate';
    }
}

