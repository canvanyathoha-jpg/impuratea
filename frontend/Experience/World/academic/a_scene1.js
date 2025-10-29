import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import DialogManager from "../../Utils/DialogManager.js";

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

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene1] Deskmate NPC created.");
    }

    startStory() {
        console.log("[AcademicScene1] Starting story sequence...");
        this.dialogManager.showDialog({
            text: "Kamu memasuki ruangan kelas yang sedang disibukkan dengan persiapan ujian harian fisika hari ini. Suasana tegang, semua orang membuka-buka catatan mereka dengan cemas.",
            onChoice: () => {
                this.showScene1Part2();
            }
        });
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

        // Create gradient bubble with modern styling
        const bubblePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(8.5, 4.5),
            new THREE.MeshBasicMaterial({ 
                color: 0xe3f2fd, 
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0.95
            })
        );
        this.speechBubbleMaterial = bubblePlane.material;

        // Enhanced border with gradient effect
        const border = new THREE.Mesh(
            new THREE.PlaneGeometry(8.8, 4.8),
            new THREE.MeshBasicMaterial({ 
                color: 0x1976d2, 
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true
            })
        );

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
        this.createAlternativeButton(speaker, text, callback);
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Create beautiful gradient background
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f4ff');
        gradient.addColorStop(1, '#e8f0fe');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw speaker name with enhanced styling
        context.font = 'bold 42px "Segoe UI", Arial, sans-serif';
        context.fillStyle = '#1565c0';
        context.textAlign = 'center';
        context.shadowColor = 'rgba(0, 0, 0, 0.1)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(speaker + ':', canvas.width / 2, 80);
        
        // Reset shadow for text
        context.shadowColor = 'transparent';
        
        // Draw text with better typography
        context.font = '32px "Segoe UI", Arial, sans-serif';
        context.fillStyle = '#212121';
        const lines = this.getLines(context, text, canvas.width - 60);
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, 160 + (index * 42));
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.2), textMaterial);
        textPlane.position.z = 0.01;

        this.speechBubbleGroup.add(textPlane);
    }

    getLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    onMouseMove(event) {
        if (!this.speechBubbleGroup) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) return;
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        if (intersects.length > 0) {
            const dialogData = this.speechBubbleGroup.userData;
            this.showScreenSpeechBubble(dialogData.speaker, dialogData.text, dialogData.callback);
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
        
        // Create backdrop overlay
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
            border: 3px solid #1976d2;
            padding: 30px 40px;
            border-radius: 20px;
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
            <p style="margin: 15px 0; color: #212121; font-size: 16px; line-height: 1.6;">
                ${text}
            </p>
            <small style="color: #757575; font-size: 12px; font-style: italic;">
                💡 Klik untuk melanjutkan
            </small>
        `;
        
        const closeBubble = () => {
            screenBubble.style.animation = 'slideDown 0.3s ease';
            backdrop.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                screenBubble.remove();
                backdrop.remove();
                this.cleanupSpeechBubble(); // Clean up the 3D bubble as well
                if (callback) {
                    callback(); // Continue the story
                }
            }, 300);
        };
        
        screenBubble.addEventListener('click', closeBubble);
        backdrop.addEventListener('click', closeBubble);
        
        document.body.appendChild(backdrop);
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
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
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