import "./index.scss";
import { io } from "socket.io-client";
import Experience from "./Experience/Experience.js";
import elements from "./Experience/Utils/functions/elements.js";
import { languageManager } from "./Experience/Utils/LanguageManager.js";

// Dom Elements ----------------------------------

const domElements = elements({
    canvas: ".experience-canvas",
    chatContainer: ".chat-container",
    messageSubmitButton: "#chat-message-button",
    messageInput: "#chat-message-input",
    inputWrapper: ".message-input-wrapper",
    nameInputButton: "#name-input-button",
    nameInput: "#name-input",
    avatarLeftImg: ".avatar-left",
    avatarRightImg: ".avatar-right",
});

// Frontend Server ----------------------------------

const socketUrl = new URL("/", window.location.href);

// const socket = io(socketUrl.toString());
const chatSocket = io(socketUrl.toString() + "chat");
const updateSocket = io(socketUrl.toString() + "update");
let userName = "";

// Experience ----------------------------------

const experience = new Experience(domElements.canvas, updateSocket);

// Sockets ----------------------------------

chatSocket.on("connect", () => {
    // console.log("Connected to server with ID" + chatSocket.id);
});

// Event listeners for chat - keep these
domElements.messageSubmitButton.addEventListener("click", handleMessageSubmit);
domElements.chatContainer.addEventListener("click", handleChatClick);
document.addEventListener("keydown", handleMessageSubmit);

// Note: nameInputButton and avatar listeners are now handled by Preloader.js
// Removing duplicate event listeners to prevent conflicts

function handleChatClick() {
    if (domElements.inputWrapper.classList.contains("hidden"))
        domElements.inputWrapper.classList.remove("hidden");
}

// These functions are no longer needed
// Name and avatar selections are now handled by Preloader.js
// The Preloader class has its own handlers that emit to socket
function handleNameSubmit() {
    // Function kept for backward compatibility but no longer used
    userName = domElements.nameInput.value;
    chatSocket.emit("setName", userName);
    updateSocket.emit("setName", userName);
}

function handleCharacterSelectionLeft() {
    // Function kept for backward compatibility but no longer used
    updateSocket.emit("setAvatar", "male");
}

function handleCharacterSelectionRight() {
    // Function kept for backward compatibility but no longer used
    updateSocket.emit("setAvatar", "female");
}

function handleMessageSubmit(event) {
    if (event.type === "click" || event.key === "Enter") {
        // Play click sound for button click (not for Enter key)
        if (event.type === "click" && experience && experience.soundManager) {
            experience.soundManager.play('click', 0.6);
        }
        
        domElements.inputWrapper.classList.toggle("hidden");
        domElements.messageInput.focus();

        if (domElements.messageInput.value === "") return;
        displayMessage(
            userName,
            domElements.messageInput.value.substring(0, 500),
            getTime()
        );
        chatSocket.emit(
            "send-message",
            domElements.messageInput.value.substring(0, 500),
            getTime()
        );
        domElements.messageInput.value = "";
    }
}

function getTime() {
    const currentDate = new Date();
    const hours = currentDate.getHours().toString().padStart(2, "0");
    const minutes = currentDate.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;
    return time;
}

function displayMessage(name, message, time) {
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `<span class="different-color">[${time}] ${name}:</span> ${message}`;
    domElements.chatContainer.append(messageDiv);
    domElements.chatContainer.scrollTop =
        domElements.chatContainer.scrollHeight;
}

// Get data from server ----------------------------------

chatSocket.on("recieved-message", (name, message, time) => {
    displayMessage(name, message, time);
});

// Update Socket ----------------------------------------------------
updateSocket.on("connect", () => {});

const audio = document.getElementById("myAudio");

window.addEventListener("keydown", function (e) {
    if (e.code === "Equal") {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        } else {
            audio.play();
        }
    }
});

// Language Toggle Setup
const languageToggleBtn = document.getElementById('language-toggle-btn');
const languageFlag = document.getElementById('language-flag');
const languageText = document.getElementById('language-text');

// Update language button UI
function updateLanguageButton() {
    const lang = languageManager.getLanguage();
    if (languageFlag && languageText) {
        if (lang === 'id') {
            languageFlag.textContent = '🇮🇩';
            languageText.textContent = 'ID';
        } else {
            languageFlag.textContent = '🇬🇧';
            languageText.textContent = 'EN';
        }
    }
}

// Initialize language button
updateLanguageButton();

// Ensure language toggle button is visible
const ensureLanguageButtonVisible = () => {
    const btn = document.getElementById('language-toggle-btn');
    if (btn) {
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        btn.style.zIndex = '999999999999999';
        btn.style.pointerEvents = 'auto';
        console.log('[Language] Button ensured visible:', btn);
    } else {
        console.error('[Language] Language toggle button not found!');
    }
};

// Run immediately
ensureLanguageButtonVisible();

// Also run after DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLanguageButtonVisible);
} else {
    ensureLanguageButtonVisible();
}

// Also ensure it's visible after a short delay (in case preloader hides it)
setTimeout(ensureLanguageButtonVisible, 100);
setTimeout(ensureLanguageButtonVisible, 500);
setTimeout(ensureLanguageButtonVisible, 1000);

// Toggle language on button click
if (languageToggleBtn) {
    languageToggleBtn.addEventListener('click', () => {
        // Play click sound
        if (experience && experience.soundManager) {
            experience.soundManager.play('click', 0.6);
        }
        
        const newLang = languageManager.toggleLanguage();
        updateLanguageButton();
        console.log('[Language] Language toggled to:', newLang);
        
        // Dispatch event untuk update UI
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
    });
}

// Listen for language changes from other sources
window.addEventListener('languageChanged', (event) => {
    updateLanguageButton();
    updateLandingPageLanguage();
});

// Landing Page Translations
const landingPageTranslations = {
    heroBadge: {
        id: "Game Naratif Interaktif",
        en: "Interactive Narrative Game"
    },
    landingSubtitle: {
        id: "Di Mana Integritas Bertemu Keberanian",
        en: "Where Integrity Meets Courage"
    },
    heroTagline: {
        id: "Game bercerita orang pertama yang inovatif yang menempatkanmu di pusat perjuangan Indonesia melawan korupsi",
        en: "A groundbreaking first-person story-driven game that puts you at the heart of Indonesia's fight against corruption"
    },
    yourMission: {
        id: "Misi Kamu",
        en: "Your Mission"
    },
    missionText: {
        id: "Masuk ke dunia seorang siswa SMA yang bertekad menavigasi dunia kompleks masyarakat Indonesia modern. Di IMPURITEA, setiap pilihan yang kamu buat membentuk narasi, setiap keputusan menguji kompas moralmu, dan setiap tindakan menciptakan riak di sistem yang sangat membutuhkan perubahan.",
        en: "Step into the shoes of a determined high school student navigating the complex world of modern Indonesian society. In IMPURITEA, every choice you make shapes the narrative, every decision tests your moral compass, and every action ripples through a system desperately in need of change."
    },
    deepNarrative: {
        id: "Narasi Mendalam",
        en: "Deep Narrative"
    },
    deepNarrativeDesc: {
        id: "Alami cerita bercabang di mana pilihan moralmu menciptakan konsekuensi unik dan berbagai ending",
        en: "Experience a branching story where your moral choices create unique consequences and multiple endings"
    },
    moralDilemmas: {
        id: "Dilema Moral",
        en: "Moral Dilemmas"
    },
    moralDilemmasDesc: {
        id: "Hadapi keputusan sulit yang menantang nilai-nilaimu: integritas vs kenyamanan, kebenaran vs keamanan",
        en: "Face difficult decisions that challenge your values: integrity vs. convenience, truth vs. safety"
    },
    realisticSetting: {
        id: "Latar Realistis",
        en: "Realistic Setting"
    },
    realisticSettingDesc: {
        id: "Jelajahi lingkungan SMA Indonesia yang autentik penuh dengan karakter dan hubungan yang kompleks",
        en: "Explore an authentic Indonesian high school environment filled with complex characters and relationships"
    },
    investigation: {
        id: "Investigasi",
        en: "Investigation"
    },
    investigationDesc: {
        id: "Buka kebenaran tersembunyi, kumpulkan bukti, dan ungkap korupsi melalui pengamatan dan dialog yang cermat",
        en: "Uncover hidden truths, gather evidence, and expose corruption through careful observation and dialogue"
    },
    theStory: {
        id: "Ceritanya",
        en: "The Story"
    },
    storyText1: {
        id: "Korupsi telah merasuk ke dalam sistem sekolahmu, mulai dari nilai ujian yang dimanipulasi hingga dana yang digelapkan. Sebagai siswa yang menyaksikan pelanggaran secara langsung, kamu dihadapkan pada pertanyaan kritis:",
        en: "Corruption has woven itself into the fabric of your school, from rigged test scores to embezzled funds. As a student who witnesses wrongdoing firsthand, you're faced with a critical question:"
    },
    storyQuestion: {
        id: "Apakah kamu akan diam untuk jalan yang lebih mudah, atau berdiri tegak untuk apa yang benar dan mempertaruhkan segalanya?",
        en: "Will you stay silent for an easier path, or stand up for what's right and risk everything?"
    },
    storyText2: {
        id: "Perjalananmu akan menguji keberanianmu, menantang hubunganmu, dan memaksa kamu menghadapi harga keadilan. Di dunia di mana kekuasaan melindungi dirinya sendiri, bisakah satu siswa membuat perbedaan?",
        en: "Your journey will test your courage, challenge your relationships, and force you to confront the price of justice. In a world where power protects itself, can one student make a difference?"
    },
    gameplayFeatures: {
        id: "Fitur Permainan",
        en: "Gameplay Features"
    },
    dynamicDialogue: {
        id: "Sistem Dialog Dinamis:",
        en: "Dynamic Dialogue System:"
    },
    dynamicDialogueDesc: {
        id: "Terlibat dalam percakapan bermakna di mana kata-katamu memiliki bobot dan konsekuensi",
        en: "Engage in meaningful conversations where your words carry weight and consequences"
    },
    characterRelationships: {
        id: "Hubungan Karakter:",
        en: "Character Relationships:"
    },
    characterRelationshipsDesc: {
        id: "Bangun kepercayaan atau ciptakan musuh – setiap interaksi penting",
        en: "Build trust or create enemies – every interaction matters"
    },
    evidenceCollection: {
        id: "Pengumpulan Bukti:",
        en: "Evidence Collection:"
    },
    evidenceCollectionDesc: {
        id: "Kumpulkan bukti korupsi melalui dokumen, rekaman, dan kesaksian saksi",
        en: "Gather proof of corruption through documents, recordings, and witness testimonies"
    },
    multipleEndings: {
        id: "Berbagai Ending:",
        en: "Multiple Endings:"
    },
    multipleEndingsDesc: {
        id: "Pilihanmu mengarah ke hasil yang berbeda – sukses, kegagalan, atau sesuatu di antaranya",
        en: "Your choices lead to different outcomes – success, failure, or something in between"
    },
    immersiveFirstPerson: {
        id: "Tampilan Orang Pertama yang Imersif:",
        en: "Immersive First-Person View:"
    },
    immersiveFirstPersonDesc: {
        id: "Alami cerita melalui mata karaktermu dalam lingkungan 3D yang dapat dijelajahi penuh",
        en: "Experience the story through your character's eyes in a fully explorable 3D environment"
    },
    coreThemes: {
        id: "Tema Inti",
        en: "Core Themes"
    },
    justice: {
        id: "Keadilan",
        en: "Justice"
    },
    justiceDesc: {
        id: "Mengejar kebenaran dan keadilan dalam sistem yang korup",
        en: "The pursuit of truth and fairness in a corrupt system"
    },
    integrity: {
        id: "Integritas",
        en: "Integrity"
    },
    integrityDesc: {
        id: "Berdiri di atas prinsipmu meskipun ada tekanan dan konsekuensi",
        en: "Standing by your principles despite pressure and consequences"
    },
    sacrifice: {
        id: "Pengorbanan",
        en: "Sacrifice"
    },
    sacrificeDesc: {
        id: "Biaya pribadi untuk melakukan apa yang benar",
        en: "The personal cost of doing what's right"
    },
    truth: {
        id: "Kebenaran",
        en: "Truth"
    },
    truthDesc: {
        id: "Mengungkap dan menghadapi realitas yang tidak nyaman",
        en: "Uncovering and confronting uncomfortable realities"
    },
    readyToMakeStand: {
        id: "Apakah Kamu Siap untuk Berdiri Tegak?",
        en: "Are You Ready to Make a Stand?"
    },
    ctaText: {
        id: "Bergabunglah dalam perjuangan melawan korupsi. Pilihanmu. Ceritamu. Warisanmu.",
        en: "Join the fight against corruption. Your choices. Your story. Your legacy."
    },
    beginJourney: {
        id: "Mulai Perjalananmu",
        en: "Begin Your Journey"
    },
    ourPartners: {
        id: "Mitra & Kredit Kami",
        en: "Our Partners & Credits"
    },
    partnersIntro: {
        id: "IMPURITEA dibuat dengan dukungan dan kolaborasi institusi pendidikan terkemuka di Malang. Kami berterima kasih kepada semua mitra yang telah mendukung proyek ini.",
        en: "IMPURITEA was created with the support and collaboration of leading educational institutions in Malang. We thank all partners who have supported this project."
    },
    madeWithLove: {
        id: "Dibuat Dengan ❤️ Oleh SMA Taruna Nusantara",
        en: "Made With ❤️ By"
    },
    madeByText: {
        id: "IMPURITEA dikembangkan oleh tim kreatif yang berdedikasi untuk meningkatkan kesadaran anti-korupsi melalui media interaktif dan pendidikan karakter. Proyek ini merupakan kolaborasi antara pengembang game, pendidik, dan aktivis anti-korupsi.",
        en: "IMPURITEA is developed by a creative team dedicated to raising anti-corruption awareness through interactive media and character education. This project is a collaboration between game developers, educators, and anti-corruption activists."
    },
    welcomeTitle: {
        id: "Selamat Datang di IMPURITEA",
        en: "Welcome to IMPURITEA"
    },
    enterYourName: {
        id: "Masukkan Nama Kamu",
        en: "Enter Your Name"
    },
    namePlaceholder: {
        id: "Tuliskan nama kamu di sini...",
        en: "Type your name here..."
    },
    continue: {
        id: "Lanjutkan",
        en: "Continue"
    },
    selectCharacter: {
        id: "Pilih Karaktermu",
        en: "Select Your Character"
    },
    selectCharacterSubtitle: {
        id: "Klik pada karakter yang ingin kamu gunakan",
        en: "Click on the character you want to use"
    },
    male: {
        id: "Laki-laki",
        en: "Male"
    },
    female: {
        id: "Perempuan",
        en: "Female"
    },
    gameControls: {
        id: "💡 Kontrol Permainan",
        en: "💡 Game Controls"
    },
    walkControls: {
        id: "W/A/S/D - Berjalan",
        en: "W/A/S/D - Walk"
    },
    runControl: {
        id: "SHIFT - Berlari",
        en: "SHIFT - Run"
    },
    jumpControl: {
        id: "SPACE - Melompat",
        en: "SPACE - Jump"
    },
    lookControl: {
        id: "Mouse - Lihat sekeliling",
        en: "Mouse - Look around"
    }
};

function updateLandingPageLanguage() {
    const lang = languageManager.getLanguage();
    
    // Helper function to update text
    const updateText = (selector, translation) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = languageManager.translate(translation);
        }
    };
    
    // Update all landing page texts
    updateText('.hero-badge', landingPageTranslations.heroBadge);
    updateText('.landing-subtitle', landingPageTranslations.landingSubtitle);
    updateText('.hero-tagline', landingPageTranslations.heroTagline);
    updateText('.game-overview h2.section-title', landingPageTranslations.yourMission);
    updateText('.overview-text', landingPageTranslations.missionText);
    
    // Feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length >= 4) {
        featureCards[0].querySelector('h3').textContent = languageManager.translate(landingPageTranslations.deepNarrative);
        featureCards[0].querySelector('p').textContent = languageManager.translate(landingPageTranslations.deepNarrativeDesc);
        featureCards[1].querySelector('h3').textContent = languageManager.translate(landingPageTranslations.moralDilemmas);
        featureCards[1].querySelector('p').textContent = languageManager.translate(landingPageTranslations.moralDilemmasDesc);
        featureCards[2].querySelector('h3').textContent = languageManager.translate(landingPageTranslations.realisticSetting);
        featureCards[2].querySelector('p').textContent = languageManager.translate(landingPageTranslations.realisticSettingDesc);
        featureCards[3].querySelector('h3').textContent = languageManager.translate(landingPageTranslations.investigation);
        featureCards[3].querySelector('p').textContent = languageManager.translate(landingPageTranslations.investigationDesc);
    }
    
    // Story section
    updateText('.story-section h2.section-title', landingPageTranslations.theStory);
    const storyTexts = document.querySelectorAll('.story-text');
    if (storyTexts.length >= 2) {
        storyTexts[0].textContent = languageManager.translate(landingPageTranslations.storyText1);
        storyTexts[1].textContent = languageManager.translate(landingPageTranslations.storyText2);
    }
    updateText('.story-question', landingPageTranslations.storyQuestion);
    
    // Gameplay features
    updateText('.gameplay-section h2.section-title', landingPageTranslations.gameplayFeatures);
    const gameplayItems = document.querySelectorAll('.gameplay-item');
    if (gameplayItems.length >= 5) {
        const gameplayTexts = [
            { strong: landingPageTranslations.dynamicDialogue, desc: landingPageTranslations.dynamicDialogueDesc },
            { strong: landingPageTranslations.characterRelationships, desc: landingPageTranslations.characterRelationshipsDesc },
            { strong: landingPageTranslations.evidenceCollection, desc: landingPageTranslations.evidenceCollectionDesc },
            { strong: landingPageTranslations.multipleEndings, desc: landingPageTranslations.multipleEndingsDesc },
            { strong: landingPageTranslations.immersiveFirstPerson, desc: landingPageTranslations.immersiveFirstPersonDesc }
        ];
        gameplayItems.forEach((item, index) => {
            if (gameplayTexts[index]) {
                const strong = item.querySelector('strong');
                const desc = item.querySelector('div > div');
                if (strong) strong.textContent = languageManager.translate(gameplayTexts[index].strong);
                if (desc) desc.textContent = languageManager.translate(gameplayTexts[index].desc);
            }
        });
    }
    
    // Themes
    updateText('.themes-section h2.section-title', landingPageTranslations.coreThemes);
    const themeItems = document.querySelectorAll('.theme-item');
    if (themeItems.length >= 4) {
        const themes = [
            { title: landingPageTranslations.justice, desc: landingPageTranslations.justiceDesc },
            { title: landingPageTranslations.integrity, desc: landingPageTranslations.integrityDesc },
            { title: landingPageTranslations.sacrifice, desc: landingPageTranslations.sacrificeDesc },
            { title: landingPageTranslations.truth, desc: landingPageTranslations.truthDesc }
        ];
        themeItems.forEach((item, index) => {
            if (themes[index]) {
                item.querySelector('h4').textContent = languageManager.translate(themes[index].title);
                item.querySelector('p').textContent = languageManager.translate(themes[index].desc);
            }
        });
    }
    
    // CTA section
    updateText('.cta-title', landingPageTranslations.readyToMakeStand);
    updateText('.cta-text', landingPageTranslations.ctaText);
    updateText('.btn-text', landingPageTranslations.beginJourney);
    
    // Partners section
    updateText('.partners-section h2.section-title', landingPageTranslations.ourPartners);
    updateText('.partners-intro', landingPageTranslations.partnersIntro);
    updateText('.made-by-title', landingPageTranslations.madeWithLove);
    updateText('.made-by-text', landingPageTranslations.madeByText);
    
    // Name input screen
    updateText('.welcome-title', landingPageTranslations.welcomeTitle);
    updateText('.name-input-label', landingPageTranslations.enterYourName);
    const nameInput = document.querySelector('#name-input');
    if (nameInput) {
        nameInput.placeholder = languageManager.translate(landingPageTranslations.namePlaceholder);
    }
    const nameButton = document.querySelector('#name-input-button span');
    if (nameButton) {
        nameButton.textContent = languageManager.translate(landingPageTranslations.continue);
    }
    
    // Character selection screen
    updateText('.character-select-title', landingPageTranslations.selectCharacter);
    updateText('.character-select-subtitle', landingPageTranslations.selectCharacterSubtitle);
    const avatarLabels = document.querySelectorAll('.avatar-label');
    if (avatarLabels.length >= 2) {
        avatarLabels[0].textContent = languageManager.translate(landingPageTranslations.male);
        avatarLabels[1].textContent = languageManager.translate(landingPageTranslations.female);
    }
    
    // Controls info
    updateText('.controls-info-title', landingPageTranslations.gameControls);
    const controlItems = document.querySelectorAll('.control-item');
    if (controlItems.length >= 4) {
        const controlTexts = [
            landingPageTranslations.walkControls,
            landingPageTranslations.runControl,
            landingPageTranslations.jumpControl,
            landingPageTranslations.lookControl
        ];
        controlItems.forEach((item, index) => {
            if (controlTexts[index]) {
                const strong = item.querySelector('strong');
                const translated = languageManager.translate(controlTexts[index]);
                if (strong) {
                    // Keep the key part (e.g., "W/A/S/D") and translate the rest
                    const keyPart = strong.textContent;
                    item.innerHTML = `<strong>${keyPart}</strong> - ${translated.split(' - ')[1] || translated}`;
                } else {
                    item.textContent = translated;
                }
            }
        });
    }
}

// Initialize landing page language on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateLandingPageLanguage();
    });
} else {
    updateLandingPageLanguage();
}
