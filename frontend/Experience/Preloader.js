import * as THREE from "three";
import Experience from "./Experience.js";

import lerp from "./Utils/functions/lerp.js";
import elements from "./Utils/functions/elements.js";

import gsap from "gsap";

export default class Preloader {
    constructor() {
        console.log('[Preloader] Initializing Preloader...');
        
        // Use the singleton instance to access socket and other resources
        this.experience = Experience.instance;
        console.log('[Preloader] Experience instance:', this.experience);
        this.resources = this.experience.resources;

        this.matchmedia = gsap.matchMedia();

        this.loaded = 0;
        this.queue = 0;

        this.counter = 0;
        this.amountDone = 0;

        this.domElements = elements({
            preloader: ".preloader",
            text1: ".preloader-percentage1",
            text2: ".preloader-percentage2",
            progressBar: ".progress-bar",
            svgLogo: ".svgLogo",
            progressBarContainer: ".progress-bar-container",
            progressWrapper: ".progress-wrapper",
            preloaderTitle: ".preloader-title",
            preloaderWrapper: ".preloader-wrapper",
            landingContainer: ".landing-container",
            startButton: "#start-experience-button",
            welcomeTitle: ".welcome-title",
            nameFormContainer: ".name-form-container",
            nameForm: ".name-form",
            nameInput: "#name-input",
            nameInputButton: "#name-input-button",
            characterSelectContainer: ".character-select-container",
            characterSelectTitle: ".character-select-title",
            characterSelectSubtitle: ".character-select-subtitle",
            avatarWrapper: ".avatar-img-wrapper",
            avatarLeftImg: ".avatar-left",
            avatarRightImg: ".avatar-right",
            avatarOptions: ".avatar-option", // Array of avatar option containers
            controlsInfo: ".controls-info",
            customizeButton: ".customize-character-btn",
            description: ".description",
        });

        console.log('[Preloader] DOM elements found:', {
            startButton: !!this.domElements.startButton,
            landingContainer: !!this.domElements.landingContainer
        });

        // Show preloader by adding 'active' class
        this.domElements.preloader.classList.add('active');
        
        // Disable canvas interaction when preloader is active
        const experienceWrapper = document.querySelector('.experience-wrapper');
        const experienceCanvas = document.querySelector('.experience-canvas');
        if (experienceWrapper) {
            experienceWrapper.style.pointerEvents = 'none';
            experienceWrapper.style.zIndex = '0';
            console.log('[Preloader] Canvas wrapper disabled for button clicks');
        }
        if (experienceCanvas) {
            experienceCanvas.style.pointerEvents = 'none';
            console.log('[Preloader] Canvas disabled for button clicks');
        }

        // **** This is for updating a percentage ****
        this.resources.on("loading", (loaded, queue) => {
            this.updateProgress(loaded, queue);
        });

        this.resources.on("ready", () => {
            console.log('[Preloader] Resources ready!');
            this.onResourcesReady();
        });

        this.addEventListeners();
        console.log('[Preloader] Initialized successfully');
    }

    updateProgress(loaded, queue) {
        this.amountDone = Math.round((loaded / queue) * 100);
    }

    async onResourcesReady() {
        // When resources are loaded, hide loading elements and show landing page
        return new Promise((resolve) => {
            this.timeline = new gsap.timeline();
            this.timeline
                .to(this.domElements.svgLogo, {
                    opacity: 0,
                    duration: 1.2,
                    delay: 0.5,
                    ease: "power4.out",
                })
                .to(
                    [
                        this.domElements.progressBarContainer,
                        this.domElements.progressWrapper,
                        this.domElements.preloaderWrapper
                    ],
                    {
                        opacity: 0,
                        duration: 1.2,
                        ease: "power4.out",
                        onComplete: () => {
                            // Remove all loading elements
                            this.domElements.svgLogo.remove();
                            this.domElements.progressBarContainer.remove();

                            if (this.domElements.progressWrapper) {
                                this.domElements.progressWrapper.remove();
                            }
                            if (this.domElements.preloaderWrapper) {
                                this.domElements.preloaderWrapper.remove();
                            }
                            if (this.domElements.preloaderTitle) {
                                this.domElements.preloaderTitle.remove();
                            }
                            if (this.domElements.text1) {
                                this.domElements.text1.remove();
                            }
                            if (this.domElements.text2) {
                                this.domElements.text2.remove();
                            }
                        },
                    },
                    "-=1.05"
                )
                .to(
                    this.domElements.landingContainer,
                    {
                        opacity: 1,
                        duration: 1.5,
                        ease: "power4.out",
                        onComplete: () => {
                            resolve();
                        },
                    },
                    "-=0.5"
                );
        });
    }

    onStartButtonClick = () => {
        console.log('[Preloader] Start button clicked!');
        // Play click sound
        if (this.experience && this.experience.soundManager) {
            this.experience.soundManager.play('click', 0.6);
        }
        // Hide landing page and show name input
        this.landingToNameInput();
    };

    async landingToNameInput() {
        return new Promise((resolve) => {
            console.log('[Preloader] Starting transition to name input...');
            console.log('[Preloader] Welcome title exists:', !!this.domElements.welcomeTitle);
            console.log('[Preloader] Name form container exists:', !!this.domElements.nameFormContainer);
            
            // Ensure elements are visible and accessible
            if (this.domElements.welcomeTitle) {
                this.domElements.welcomeTitle.style.pointerEvents = 'auto';
                this.domElements.welcomeTitle.style.zIndex = '1000';
            }
            if (this.domElements.nameFormContainer) {
                this.domElements.nameFormContainer.style.pointerEvents = 'auto';
                this.domElements.nameFormContainer.style.zIndex = '1000';
                // Ensure name input button is visible
                if (this.domElements.nameInputButton) {
                    this.domElements.nameInputButton.style.pointerEvents = 'auto';
                }
            }
            
            this.timeline2 = new gsap.timeline();
            this.timeline2
                .to(this.domElements.landingContainer, {
                    opacity: 0,
                    duration: 1.2,
                    ease: "power4.out",
                    onComplete: () => {
                        console.log('[Preloader] Landing container removed');
                        this.domElements.landingContainer.remove();
                    },
                })
                .to(
                    this.domElements.welcomeTitle,
                    {
                        opacity: 1,
                        duration: 1.2,
                        top: "25%",
                        ease: "power4.out",
                        onStart: () => {
                            console.log('[Preloader] Welcome title fade in started');
                            // Ensure it's visible
                            if (this.domElements.welcomeTitle) {
                                this.domElements.welcomeTitle.style.display = 'block';
                                this.domElements.welcomeTitle.style.visibility = 'visible';
                            }
                        },
                    },
                    "-=0.5"
                )
                .to(
                    this.domElements.nameFormContainer,
                    {
                        opacity: 1,
                        duration: 1.2,
                        ease: "power4.out",
                        onStart: () => {
                            console.log('[Preloader] Name form container fade in started');
                            // Ensure it's visible
                            if (this.domElements.nameFormContainer) {
                                this.domElements.nameFormContainer.style.display = 'flex';
                                this.domElements.nameFormContainer.style.visibility = 'visible';
                            }
                            // Show name input button
                            if (this.domElements.nameInputButton) {
                                this.domElements.nameInputButton.style.opacity = '1';
                            }
                        },
                        onComplete: () => {
                            console.log('[Preloader] Name input screen fully visible');
                            resolve();
                        },
                    },
                    "-=1"
                );
        });
    }

    onNameInput = () => {
        if (this.domElements.nameInput.value === "") return;

        // Play click sound
        if (this.experience && this.experience.soundManager) {
            this.experience.soundManager.play('click', 0.6);
        }

        // Save username to localStorage
        localStorage.setItem('impuratea-username', this.domElements.nameInput.value);

        this.nameInputOutro();
    };

    onCharacterSelect = (event) => {
        // Play click sound
        if (this.experience && this.experience.soundManager) {
            this.experience.soundManager.play('click', 0.6);
        }

        // Determine which avatar was selected
        // Check if clicked element or its parent is avatar-left or avatar-right
        let target = event.target;
        let avatarSkin = null;

        // Check target and its parents for avatar classes
        while (target && target !== document.body) {
            if (target.classList && target.classList.contains('avatar-left')) {
                avatarSkin = 'male';
                break;
            } else if (target.classList && target.classList.contains('avatar-right')) {
                avatarSkin = 'female';
                break;
            }
            target = target.parentElement;
        }

        // Fallback: if no match found, try direct class check
        if (!avatarSkin) {
            avatarSkin = event.target.classList.contains('avatar-left') ? 'male' : 'female';
        }

        if (!avatarSkin) {
            console.warn('[Preloader] Could not determine avatar selection');
            return;
        }

        // Save avatar selection to localStorage
        localStorage.setItem('impuratea-avatar', avatarSkin);

        // Get saved username
        const savedUsername = localStorage.getItem('impuratea-username');

        // Emit to socket to create player avatar
        if (this.experience && this.experience.socket) {
            this.experience.socket.emit('setAvatar', avatarSkin);
            if (savedUsername) {
                this.experience.socket.emit('setName', savedUsername);
            }
            console.log(`[Preloader] Avatar selected: ${avatarSkin}, Username: ${savedUsername}`);
        }

        this.preloaderOutro();
    };

    async nameInputOutro() {
        return new Promise((resolve) => {
            this.timeline3 = new gsap.timeline();
            this.timeline3
                .to(this.domElements.welcomeTitle, {
                    opacity: 0,
                    duration: 1.2,
                    ease: "power4.out",
                })
                .to(
                    this.domElements.nameFormContainer,
                    {
                        opacity: 0,
                        duration: 1.2,
                        ease: "power4.out",
                        onComplete: () => {
                            this.domElements.welcomeTitle.remove();
                            this.domElements.nameFormContainer.remove();
                            // Enable pointer events untuk avatar selection
                            this.domElements.avatarLeftImg.style.pointerEvents = "auto";
                            this.domElements.avatarRightImg.style.pointerEvents = "auto";
                        },
                    },
                    "-=1.05"
                )
                .to(
                    this.domElements.characterSelectContainer,
                    {
                        opacity: 1,
                        duration: 1.2,
                        ease: "power4.out",
                        onComplete: () => {
                            resolve();
                        },
                    },
                    "-=1.05"
                );
        });
    }

    async preloaderOutro() {
        return new Promise((resolve) => {
            // Immediately disable pointer events so camera can move
            this.domElements.preloader.style.pointerEvents = 'none';
            this.domElements.preloader.style.touchAction = 'auto';
            // Re-enable canvas interaction before removing preloader
            const experienceWrapper = document.querySelector('.experience-wrapper');
            const experienceCanvas = document.querySelector('.experience-canvas');
            if (experienceWrapper) {
                experienceWrapper.style.pointerEvents = 'auto';
                experienceWrapper.style.zIndex = '1';
            }
            if (experienceCanvas) {
                experienceCanvas.style.pointerEvents = 'auto';
            }

            this.timeline4 = new gsap.timeline();
            this.timeline4.to(this.domElements.preloader, {
                duration: 1.7,
                // top: "-150%",
                opacity: 0,
                ease: "power3.out",
                onComplete: () => {
                    this.domElements.preloader.remove();
                    console.log('[Preloader] Preloader removed, camera should be moveable now');
                    resolve();
                },
            });
        });
    }

    addEventListeners() {
        // Debug: Check if button exists
        if (!this.domElements.startButton) {
            console.error('[Preloader] Start button not found!');
        } else {
            console.log('[Preloader] Start button found, adding event listener');
            
            // Ensure button can receive clicks - use very high z-index
            this.domElements.startButton.style.pointerEvents = 'auto';
            this.domElements.startButton.style.cursor = 'pointer';
            this.domElements.startButton.style.zIndex = '99999999999999';
            this.domElements.startButton.style.position = 'relative';
            this.domElements.startButton.style.userSelect = 'none';
            this.domElements.startButton.style.WebkitUserSelect = 'none';
            
            // Make button more clickable by ensuring no overlays
            const buttonRect = this.domElements.startButton.getBoundingClientRect();
            console.log('[Preloader] Button position:', buttonRect);
            console.log('[Preloader] Button computed style:', window.getComputedStyle(this.domElements.startButton));
            
            // Add event listener with explicit binding
            this.domElements.startButton.addEventListener(
                "click",
                this.onStartButtonClick.bind(this),
                { passive: false } // Ensure event can be handled
            );
            
            // Also add mousedown for better compatibility
            this.domElements.startButton.addEventListener(
                "mousedown",
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.onStartButtonClick();
                },
                { passive: false }
            );
            
            // Touch events for mobile
            this.domElements.startButton.addEventListener(
                "touchend",
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.onStartButtonClick();
                },
                { passive: false }
            );
        }
        if (this.domElements.nameInputButton) {
            this.domElements.nameInputButton.addEventListener(
                "click",
                this.onNameInput.bind(this)
            );
        }
        this.domElements.avatarLeftImg.addEventListener(
            "click",
            this.onCharacterSelect
        );
        this.domElements.avatarRightImg.addEventListener(
            "click",
            this.onCharacterSelect
        );
        
        // Add event listeners to avatar option containers (if they exist)
        if (this.domElements.avatarOptions) {
            // avatarOptions might be a NodeList or single element
            const options = this.domElements.avatarOptions.length 
                ? Array.from(this.domElements.avatarOptions) 
                : [this.domElements.avatarOptions];
            
            options.forEach(option => {
                if (option) {
                    option.addEventListener("click", this.onCharacterSelect);
                }
            });
        }
    }

    update() {
        if (this.counter < this.amountDone) {
            this.counter++;
            this.domElements.text1.innerText = Math.round(this.counter / 10);

            if (Math.round(this.counter / 10) !== 10) {
                this.domElements.text2.innerText = Math.round(
                    this.counter % 10
                );
                this.flag = false;
            } else {
                this.domElements.text2.innerText = 0;
                this.flag = true;
            }

            this.domElements.progressBar.style.width =
                Math.round(this.counter) + "%";

            if (this.flag) {
                this.domElements.progressBar.style.width = "100%";
            }
        }
    }
}

