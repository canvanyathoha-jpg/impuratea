import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import DialogManager from "../../Utils/DialogManager.js";
import SpeechAudioManager from "../../Utils/SpeechAudioManager.js";

export default class AcademicScene1 {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        // Reset corruption score when starting from scene 1 (new game)
        // This ensures fresh start every time player begins the academic storyline
        if (this.experience.scoreManager) {
            console.log("[AcademicScene1] Resetting corruption score for new game start");
            this.experience.scoreManager.resetScore();
        }

        this.dialogManager = new DialogManager(this.experience);
        this.speechAudioManager = new SpeechAudioManager(); // Initialize speech audio manager
        this.npcGender = 'female'; // NPC di scene 1 menggunakan model female
        this.npcDeskmate = null;
        this.speechBubbleGroup = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.setWorld();
        this.createPortals();
        this.createNPC();
        
        // Start ambient classroom sound
        if (this.experience.soundManager) {
            this.experience.soundManager.playAmbient('ambientClassroom', 0.2);
        }
        
        setTimeout(() => {
            this.startStory();
        }, 1000);
    }

    setWorld() {
        const collidableGroup = new THREE.Group();
        this.classModel = this.resources.items.class.scene;
        this.classModel.position.set(0, 0, 0);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10);
        collidableGroup.add(this.classModel);

        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(10, 10, 10);

        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
        collidableGroup.add(this.collider);

        this.scene.add(collidableGroup);
        this.octree.fromGraphNode(collidableGroup);

        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[AcademicScene1] Camera collision objects set");
        }

        console.log("Academic Scene 1 (Class) loaded with full collision enabled.");
    }

    createPortals() {
        console.log("[AcademicScene1] No portals in this scene - story mode");
    }

    createNPC() {
        console.log("[AcademicScene1] Creating Deskmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene1] Female avatar model not found!");
            return;
        }

        this.npcDeskmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcDeskmate.position.set(-47, 1.5, 23);
        // Rotate NPC to face towards the player (origin/center of room)
        // NPC is at position (-47, z: 23), facing towards (0, z: 0)
        this.npcDeskmate.rotation.y = Math.atan2(0 - this.npcDeskmate.position.x, 0 - this.npcDeskmate.position.z) + Math.PI / 2;
        this.npcDeskmate.scale.set(9, 9, 9);
        this.scene.add(this.npcDeskmate);
        
        // Initialize story started flag
        this.storyStarted = false;
        this.hoverSoundPlayed = false; // Flag to prevent hover sound spam

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        // Setup all animations
        this.npcActions.idle = this.npcMixer.clipAction(this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1]);
        this.npcActions.waving = this.npcMixer.clipAction(this.npcAnimations.find(clip => clip.name === 'waving') || this.npcAnimations[5]);

        // Start with idle
        this.npcActions.idle.play();
        this.currentNPCAnimation = 'idle';
        
        // Create highlight effect for NPC
        this.createNPCHighlight();
        
        console.log("[AcademicScene1] Deskmate NPC created.");
    }

    /**
     * Create highlight effect around NPC
     */
    createNPCHighlight() {
        // Create a ring/glow effect around NPC
        const highlightGeometry = new THREE.RingGeometry(5, 7, 32);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x2196f3,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.npcHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        this.npcHighlight.rotation.x = -Math.PI / 2; // Lay flat on ground
        this.npcHighlight.position.copy(this.npcDeskmate.position);
        this.npcHighlight.position.y = 0.1; // Slightly above ground
        this.npcHighlight.visible = false;
        this.scene.add(this.npcHighlight);
        
        this.isNPCHovered = false;
    }

    /**
     * Play waving animation when dialog starts
     */
    playWavingAnimation() {
        if (!this.npcActions.waving) return;
        
        // Fade from idle to waving
        this.npcActions.waving.reset();
        this.npcActions.waving.setLoop(THREE.LoopOnce);
        this.npcActions.waving.play();
        this.npcActions.waving.crossFadeFrom(this.npcActions.idle, 0.3);
        
        // Return to idle after animation
        this.npcActions.waving.clampWhenFinished = true;
        this.npcActions.waving.addEventListener('finished', () => {
            this.npcActions.idle.reset().play();
            this.npcActions.idle.crossFadeFrom(this.npcActions.waving, 0.3);
            this.currentNPCAnimation = 'idle';
        });
        
        this.currentNPCAnimation = 'waving';
    }

    startStory() {
        console.log("[AcademicScene1] Starting story sequence...");
        this.storyStarted = true;
        this.hideNPCHighlight(); // Hide highlight when story starts
        
        this.dialogManager.showDialog({
            text: "Kamu memasuki ruangan kelas yang sedang disibukkan dengan persiapan ujian harian fisika hari ini. Suasana tegang, semua orang membuka-buka catatan mereka dengan cemas.",
            onChoice: () => {
                this.showScene1Part2();
            }
        });
    }
    
    startStoryNow() {
        // Alias for startStory for consistency with manual mode scenes
        this.startStory();
    }

    showScene1Part2() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Aduh... aku tidak belajar dengan baik untuk ujian ini. Kalau nilainya jelek, pasti orang tua bakal menyita HP ku dan mengurangi uang jajan... Gimana nih?",
            onChoice: () => {
                this.showScene1Part3();
            }
        });
    }

    showScene1Part3() {
        const speaker = "Teman Sebangku";
        const text = "Eh, kayaknya kamu belum siap ya? Tenang aja, nanti aku kasih contekan. Dijamin nilaimu bagus!";
        
        // Create the 3D bubble and pass the next story function as a callback.
        // The story will now pause until the player interacts with the bubble.
        this.create3DSpeechBubble(speaker, text, () => {
            this.showScene1Part4();
        });
    }

    showScene1Part4() {
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku",
            text: "Nih, nanti pas ujian kamu tinggal lihat kertas jawaban ku. Udah deh, pasti aman. Gak ada yang tau kok!",
            onChoice: () => {
                this.dialogManager.showDialog({
                    text: "Temanmu menyodorkan kertas jawabannya. Apa yang akan kamu lakukan?",
                    choices: [
                        {
                            text: "Menolak contekan dan mengerjakan sendiri. Risikonya nilaimu jelek dan HP disita orang tua.",
                            score: 0,
                            nextScene: 'a_scene2b'
                        },
                        {
                            text: "Menerima contekan. Nilaimu bagus dan tidak ketahuan oleh guru.",
                            score: 20,
                            nextScene: 'a_scene2a'
                        }
                    ],
                    sublimentMessage: "Jalan pintas sering terlihat mudah, tapi setiap langkah meninggalkan jejak.",
                    onChoice: (choice) => {
                        this.handleChoice(choice);
                    }
                });
            }
        });
    }

    handleChoice(choice) {
        console.log("[AcademicScene1] Player choice:", choice);
        if (choice.nextScene === 'a_scene2b') {
            this.showPathA();
        } else {
            this.showPathB();
        }
    }

    showPathA() {
        this.dialogManager.showDialog({
            text: "Kamu menolak tawaran temanmu dengan sopan. \"Terima kasih, tapi aku mau coba kerjakan sendiri.\" Temanmu tampak sedikit kesal tetapi tidak memaksa lagi.",
            onChoice: () => this.showPathAResult()
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({
            text: "Ujian dimulai. Kamu mengerjakan soal-soal dengan kemampuan terbaikmu, meskipun tidak yakin dengan banyak jawabanmu. Beberapa hari kemudian, nilaimu keluar: 60. Cukup untuk lulus, tapi orang tuamu kecewa.",
            onChoice: () => this.transitionToNextScene('a_scene2b')
        });
    }

    showPathB() {
        this.dialogManager.showDialog({
            text: "Kamu menerima tawaran temanmu. \"Oke deh, terima kasih ya...\" Saat ujian berlangsung, kamu beberapa kali melirik jawaban temanmu. Guru tidak menyadari apa-apa.",
            onChoice: () => this.showPathBResult()
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({
            text: "Beberapa hari kemudian, nilaimu keluar: 85! Orang tuamu sangat bangga. Kamu merasa lega... tapi ada perasaan tidak enak di hatimu.",
            onChoice: () => this.transitionToNextScene('a_scene2a')
        });
    }

    // --- Speech Bubble Logic ---

    create3DSpeechBubble(speaker, text, callback) {
        this.cleanupSpeechBubble();
        this.speechBubbleGroup = new THREE.Group();
        this.speechBubbleGroup.userData = { speaker, text, callback }; // Store data for click events

        // Create enhanced bubble with better visual design
        // Main bubble plane dengan background yang lebih terang dan kontras lebih baik
        const bubblePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 5),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffff, // Background putih lebih terang
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0 // Start invisible for fade-in
            })
        );
        this.speechBubbleMaterial = bubblePlane.material;

        // Outer glow effect untuk depth
        const outerGlow = new THREE.Mesh(
            new THREE.PlaneGeometry(9.4, 5.4),
            new THREE.MeshBasicMaterial({ 
                color: 0x2196f3, // Biru cerah untuk glow
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0 // Start invisible for fade-in
            })
        );
        
        // Enhanced border yang lebih tebal dan jelas
        const border = new THREE.Mesh(
            new THREE.PlaneGeometry(9.2, 5.2),
            new THREE.MeshBasicMaterial({ 
                color: 0x1976d2, // Biru solid untuk border
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0 // Start invisible for fade-in
            })
        );

        // Tambahkan semua elemen dalam urutan yang benar (dari belakang ke depan)
        this.speechBubbleGroup.add(outerGlow);
        this.speechBubbleGroup.add(border);
        this.speechBubbleGroup.add(bubblePlane);
        
        this.createSpeechTextTexture(speaker, text);

        const npcPosition = this.npcDeskmate.position.clone();
        // Position speech bubble to the left side of NPC, slightly above eye level
        // Offset left by 12 units to avoid overlapping with NPC
        this.speechBubbleGroup.position.set(npcPosition.x - 6, npcPosition.y + 15, npcPosition.z);
        // Rotate bubble to face the player (opposite of NPC rotation)
        this.speechBubbleGroup.rotation.y = Math.PI; 

        // Add subtle animation
        this.speechBubbleGroup.userData.animPhase = 0;
        this.speechBubbleGroup.userData.hoverScale = 1;

        this.scene.add(this.speechBubbleGroup);
        // Dialog muncul otomatis tanpa perlu klik tombol "Baca Percakapan"
        setTimeout(() => {
            this.showScreenSpeechBubble(speaker, text, callback);
        }, 300);
        
        // Play dialog open sound
        if (this.experience.soundManager) {
            this.experience.soundManager.play('dialogOpen');
        }
        
        // Play speech audio menggunakan Web Speech API dengan voice sesuai gender NPC
        if (this.speechAudioManager && this.speechAudioManager.isSupported) {
            const fullText = `${speaker}: ${text}`;
            // Jangan set pitch/rate secara eksplisit - biarkan SpeechAudioManager set otomatis berdasarkan gender
            this.speechAudioManager.speak(fullText, {
                gender: this.npcGender, // Gunakan gender NPC yang sesuai (female untuk scene 1)
                // Pitch dan rate akan otomatis di-set:
                // Female: pitch 1.35, rate 0.95
                // Male: pitch 0.8, rate 0.95
                volume: 0.85,
                onError: (error) => {
                    console.warn('[AcademicScene1] Speech audio error, falling back to text only:', error);
                }
            });
        }
        
        // Fade in animation
        this.fadeInSpeechBubble();
    }
    
    /**
     * Fade in speech bubble smoothly
     */
    fadeInSpeechBubble() {
        if (!this.speechBubbleGroup) return;
        
        const duration = 300; // 300ms
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // Update opacity of all materials
            const opacity = eased * 0.98;
            const glowOpacity = eased * 0.3;
            const borderOpacity = eased * 0.95;
            
            this.speechBubbleGroup.children.forEach((child, index) => {
                if (child.material) {
                    if (index === 0) {
                        child.material.opacity = glowOpacity; // Outer glow
                    } else if (index === 1) {
                        child.material.opacity = borderOpacity; // Border
                    } else {
                        child.material.opacity = opacity; // Main bubble
                    }
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }
    
    /**
     * Fade out speech bubble smoothly
     */
    fadeOutSpeechBubble() {
        if (!this.speechBubbleGroup) return;
        
        const duration = 200; // 200ms
        const startTime = Date.now();
        const startOpacity = this.speechBubbleGroup.children[2]?.material?.opacity || 0.98;
        const startGlowOpacity = this.speechBubbleGroup.children[0]?.material?.opacity || 0.3;
        const startBorderOpacity = this.speechBubbleGroup.children[1]?.material?.opacity || 0.95;
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in)
            const eased = Math.pow(progress, 2);
            
            // Update opacity of all materials
            const opacity = startOpacity * (1 - eased);
            const glowOpacity = startGlowOpacity * (1 - eased);
            const borderOpacity = startBorderOpacity * (1 - eased);
            
            this.speechBubbleGroup.children.forEach((child, index) => {
                if (child.material) {
                    if (index === 0) {
                        child.material.opacity = glowOpacity;
                    } else if (index === 1) {
                        child.material.opacity = borderOpacity;
                    } else {
                        child.material.opacity = opacity;
                    }
                }
            });
            
            if (progress >= 1) {
                // Remove from scene after fade out
                this.scene.remove(this.speechBubbleGroup);
                this.speechBubbleGroup = null;
            } else {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        // Increase canvas resolution untuk kualitas text yang lebih baik
        canvas.width = 2048;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Enable text rendering yang lebih baik
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Create beautiful gradient background yang lebih terang dan kontras lebih baik
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff'); // Putih murni di atas
        gradient.addColorStop(0.3, '#fafbff'); // Putih sedikit kebiruan
        gradient.addColorStop(0.7, '#f5f7ff'); // Biru sangat terang
        gradient.addColorStop(1, '#eff3ff'); // Biru terang di bawah
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw speaker name with MUCH LARGER font untuk visibility yang jauh lebih baik
        context.font = 'bold 140px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#0d47a1'; // Biru lebih gelap untuk kontras lebih baik
        context.textAlign = 'center';
        context.textBaseline = 'top';
        // Enhanced shadow untuk depth
        context.shadowColor = 'rgba(25, 118, 210, 0.5)';
        context.shadowBlur = 12;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 3;
        context.fillText(speaker + ':', canvas.width / 2, 120);
        
        // Reset shadow untuk text body
        context.shadowColor = 'rgba(0, 0, 0, 0.2)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        // Draw text dengan font JAUH LEBIH BESAR untuk visibility maksimal
        context.font = 'bold 110px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#000000'; // Hitam murni untuk kontras maksimal
        context.textAlign = 'center';
        
        const lines = this.getLines(context, text, canvas.width - 200); // Margin lebih besar untuk font sangat besar
        const lineHeight = 130; // Line spacing jauh lebih besar untuk readability
        const startY = 320; // Start position lebih bawah untuk speaker name yang lebih besar
        
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Gunakan texture filtering yang lebih baik
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, 
            depthWrite: false,
            alphaTest: 0.01 // Anti-aliasing yang lebih baik
        });
        // Sesuaikan ukuran plane dengan bubble yang lebih besar
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.6), textMaterial);
        textPlane.position.z = 0.02; // Sedikit lebih ke depan

        this.speechBubbleGroup.add(textPlane);
    }

    getLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const width = ctx.measureText(testLine).width;
            
            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        
        // Check NPC hover (only if story hasn't started yet or manual mode)
        if (this.npcDeskmate && !this.storyStarted) {
            const npcIntersects = this.raycaster.intersectObject(this.npcDeskmate, true);
            if (npcIntersects.length > 0 && !this.isNPCHovered) {
                // Hover started
                this.isNPCHovered = true;
                this.canvas.style.cursor = 'pointer';
                this.showNPCHighlight();
                // Play hover sound only once when entering hover state
                if (this.experience.soundManager && !this.hoverSoundPlayed) {
                    this.experience.soundManager.play('hover', 0.3); // Lower volume for hover
                    this.hoverSoundPlayed = true;
                }
            } else if (npcIntersects.length === 0 && this.isNPCHovered) {
                // Hover ended
                this.isNPCHovered = false;
                this.hoverSoundPlayed = false; // Reset flag when hover ends
                this.canvas.style.cursor = 'default';
                this.hideNPCHighlight();
            }
        }
        
        // Check speech bubble hover
        if (this.speechBubbleGroup) {
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
            if (intersects.length > 0) {
                this.canvas.style.cursor = 'pointer';
            } else if (!this.isNPCHovered) {
                this.canvas.style.cursor = 'default';
            }
        }
    }
    
    showNPCHighlight() {
        if (!this.npcHighlight) return;
        this.npcHighlight.visible = true;
        
        // Animate highlight appearance
        if (this.highlightAnimation) {
            cancelAnimationFrame(this.highlightAnimation);
        }
        
        let opacity = 0;
        const animate = () => {
            opacity += 0.05;
            if (opacity >= 0.6) {
                opacity = 0.6;
                this.npcHighlight.material.opacity = opacity;
                return;
            }
            this.npcHighlight.material.opacity = opacity;
            this.highlightAnimation = requestAnimationFrame(animate);
        };
        animate();
    }
    
    hideNPCHighlight() {
        if (!this.npcHighlight) return;
        
        // Animate highlight disappearance
        if (this.highlightAnimation) {
            cancelAnimationFrame(this.highlightAnimation);
        }
        
        let opacity = this.npcHighlight.material.opacity;
        const animate = () => {
            opacity -= 0.05;
            if (opacity <= 0) {
                opacity = 0;
                this.npcHighlight.material.opacity = opacity;
                this.npcHighlight.visible = false;
                return;
            }
            this.npcHighlight.material.opacity = opacity;
            this.highlightAnimation = requestAnimationFrame(animate);
        };
        animate();
    }

    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        
        // Check NPC click (only if story hasn't started yet)
        if (this.npcDeskmate && !this.storyStarted) {
            const npcIntersects = this.raycaster.intersectObject(this.npcDeskmate, true);
            if (npcIntersects.length > 0) {
                console.log('[AcademicScene1] NPC clicked');
                // Play click sound
                if (this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
                
                // Play waving animation
                this.playWavingAnimation();
                
                // Start story
                setTimeout(() => {
                    this.startStoryNow();
                }, 300); // Small delay for animation
                return;
            }
        }
        
        // Check speech bubble click
        if (this.speechBubbleGroup) {
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        if (intersects.length > 0) {
                console.log('[AcademicScene1] Speech bubble clicked');
                // Play click sound
                if (this.experience.soundManager) {
                    this.experience.soundManager.play('click', 0.6);
                }
                
            const dialogData = this.speechBubbleGroup.userData;
            this.showScreenSpeechBubble(dialogData.speaker, dialogData.text, dialogData.callback);
            }
        }
    }

    createAlternativeButton(speaker, text, callback) {
        this.cleanupAlternativeButton();
        this.alternativeButton = document.createElement('div');
        this.alternativeButton.id = 'alternative-speech-button';
        
        const buttonStyle = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10001;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        this.alternativeButton.innerHTML = `<button style="${buttonStyle}">💬 Baca Percakapan</button>`;
        document.body.appendChild(this.alternativeButton);
        
        const button = this.alternativeButton.querySelector('button');
        button.addEventListener('click', () => {
            // Play click sound for button
            if (this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.showScreenSpeechBubble(speaker, text, callback);
        });
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
    }

    showScreenSpeechBubble(speaker, text, callback) {
        this.cleanupScreenSpeechBubble(); // Ensure no duplicates
        
        // TIDAK PERLU BACKDROP GELAP - Dialog muncul jelas tanpa overlay
        // Hapus backdrop untuk visibility yang lebih baik
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
            border: 3px solid #1976d2;
            padding: 30px 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            z-index: 10002;
            max-width: 600px;
            width: 90%;
            cursor: pointer;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s ease;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        screenBubble.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0; color: #1565c0; font-size: 22px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                    👤 ${speaker}
                </h3>
            </div>
            <p style="margin: 15px 0; color: #000000; font-size: 18px; line-height: 1.7; font-weight: 500;">
                ${text}
            </p>
            <small style="color: #757575; font-size: 12px; font-style: italic;">
                💡 Klik untuk melanjutkan
            </small>
        `;
        
        const closeBubble = () => {
            screenBubble.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                screenBubble.remove();
                this.cleanupSpeechBubble(); // Clean up the 3D bubble as well
                if (callback) {
                    callback(); // Continue the story
                }
            }, 300);
        };
        
        screenBubble.addEventListener('click', closeBubble);
        
        document.body.appendChild(screenBubble);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideUp {
                from { transform: translate(-50%, -45%); opacity: 0; }
                to { transform: translate(-50%, -50%); opacity: 1; }
            }
            @keyframes slideDown {
                from { transform: translate(-50%, -50%); opacity: 1; }
                to { transform: translate(-50%, -45%); opacity: 0; }
            }
        `;
        if (!document.getElementById('speechBubbleAnimations')) {
            style.id = 'speechBubbleAnimations';
            document.head.appendChild(style);
        }
    }

    cleanupSpeechBubble() {
        if (this.speechBubbleGroup) {
            // Stop any ongoing speech audio
            if (this.speechAudioManager) {
                this.speechAudioManager.stop();
            }
            
            // Play dialog close sound
            if (this.experience.soundManager) {
                this.experience.soundManager.play('dialogClose');
            }
            // Fade out instead of immediate removal
            this.fadeOutSpeechBubble();
        }
        this.cleanupAlternativeButton();
        this.cleanupScreenSpeechBubble();
    }

    cleanupAlternativeButton() {
        if (this.alternativeButton) {
            this.alternativeButton.remove();
            this.alternativeButton = null;
        }
    }

    cleanupScreenSpeechBubble() {
        const existingBubble = document.getElementById('screen-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }
    }

    // --- End Speech Bubble Logic ---

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene1] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene1] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene1] Disposing Academic Scene 1...");
        this.cleanupSpeechBubble();
        
        // Stop ambient sound
        if (this.experience.soundManager) {
            this.experience.soundManager.stopAmbient('ambientClassroom');
        }
        
        // Cleanup highlight
        if (this.npcHighlight) {
            this.scene.remove(this.npcHighlight);
            this.npcHighlight = null;
        }
        if (this.highlightAnimation) {
            cancelAnimationFrame(this.highlightAnimation);
        }
        
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));

        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
        if (this.npcDeskmate) {
            this.scene.remove(this.npcDeskmate);
        }
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
        }
        console.log("[AcademicScene1] Academic Scene 1 disposed");
    }
}