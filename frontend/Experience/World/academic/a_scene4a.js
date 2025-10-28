import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene4A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.npcSenior = null;
        this.speechBubbleGroup = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.setWorld();
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
        }

        console.log("Academic Scene 4A (Presentation) loaded");
    }

    createNPC() {
        console.log("[AcademicScene4A] Creating Senior NPC...");

        const maleModel = this.resources.items.male;
        if (!maleModel) {
            console.error("[AcademicScene4A] Male avatar model not found!");
            return;
        }

        this.npcSenior = SkeletonUtils.clone(maleModel.scene);
        this.npcSenior.position.set(-15, 0.5, 20); // Positioned at the side
        this.npcSenior.rotation.y = Math.PI / 2;
        this.npcSenior.scale.set(10, 10, 10);
        this.scene.add(this.npcSenior);

        this.npcAnimations = maleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcSenior);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene4A] Senior NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ text: "Lanjutan dari ujian praktik biologi adalah presentasi individu. Setiap siswa harus mempresentasikan hasil praktiknya di depan kelas.", onChoice: () => this.showDoubt() });
    }

    showDoubt() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Aku ragu dengan hasil praktik ku... Nilainya pasti tidak bagus. Apa aku harus minta bantuan kakak kelas lagi ya? Dia punya materi lengkap dari tahun lalu...", onChoice: () => this.showRemembrance() });
    }

    showRemembrance() {
        this.dialogManager.showDialog({ text: "Kamu teringat kakak kelas yang pernah kamu hubungi untuk bocoran. Dia sempat bilang masih punya materi presentasi lengkap. Kamu menghubunginya...", onChoice: () => this.showSeniorResponse() });
    }

    showSeniorResponse() {
        const speaker = "Kakak Kelas (via chat)";
        const text = "Oh iya, aku masih punya materi presentasinya. Lengkap sama slide PowerPoint-nya. Tapi... ini gak gratis ya. Transfer 50rb dulu, baru aku kasih materinya.";

        this.create3DSpeechBubble(speaker, text);

        this.dialogManager.showDialog({
            speaker: speaker,
            text: text,
            onChoice: () => {
                this.cleanupSpeechBubble();
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Ini keputusan terakhir dalam pelajaran semester ini. Pilihanmu akan menentukan akhir cerita...",
            choices: [
                { text: "Menolak dan mengerjakan semampunya. Presentasi gagal dan nilainya jelek.", score: 0, ending: true },
                { text: "Membeli materi seharga 50rb. Presentasi berjalan lancar dengan nilai bagus.", score: 25, ending: true }
            ],
            sublimentMessage: "Kejujuran mungkin membuatmu tampak gagal, tapi kebohongan yang dibeli akan selalu terbongkar pada waktunya.",
            onChoice: (choice) => this.handleChoice(choice)
        });
    }

    handleChoice(choice) {
        if (choice.score === 0) {
            this.showRefusePath();
        }
        else {
            this.showBuyPath();
        }
    }

    showRefusePath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Tidak, terima kasih. Aku akan kerjakan sendiri.", onChoice: () => this.showRefuseResult() });
    }

    showRefuseResult() {
        this.dialogManager.showDialog({ text: "Kamu mempresentasikan hasil praktikmu dengan kemampuan terbatas. Beberapa pertanyaan dari guru tidak bisa kamu jawab dengan baik. Nilaimu: 65. Tidak sempurna, tapi ini hasil kerja kerasmu sendiri.", onChoice: () => this.showEnding() });
    }

    showBuyPath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Oke, aku transfer sekarang.", onChoice: () => this.showBuyResult() });
    }

    showBuyResult() {
        this.dialogManager.showDialog({ text: "Kamu menerima materi lengkap dari kakak kelas. Kamu mempelajarinya semalam dan presentasi berjalan sangat lancar. Guru terkesan. Nilaimu: 90. Tapi uang jajanmu habis, dan perasaan bersalah semakin menumpuk.", onChoice: () => this.showEnding() });
    }

    showEnding() {
        console.log("[AcademicScene4A] Showing ending...");
        this.dialogManager.hideAll();
        setTimeout(() => this.dialogManager.showEnding(), 1000);
    }

    // --- Speech Bubble Logic ---

    create3DSpeechBubble(speaker, text) {
        this.cleanupSpeechBubble();
        this.speechBubbleGroup = new THREE.Group();

        const bubblePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 4),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide, depthWrite: false })
        );
        this.speechBubbleMaterial = bubblePlane.material;

        const border = new THREE.Mesh(
            new THREE.PlaneGeometry(8.2, 4.2),
            new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.FrontSide, depthWrite: false })
        );

        this.speechBubbleGroup.add(border);
        this.speechBubbleGroup.add(bubblePlane);
        
        this.createSpeechTextTexture(speaker, text);

        const npcPosition = this.npcSenior.position.clone();
        this.speechBubbleGroup.position.set(npcPosition.x, npcPosition.y + 15, npcPosition.z);
        this.speechBubbleGroup.rotation.y = Math.PI; 

        this.scene.add(this.speechBubbleGroup);
        this.createAlternativeButton(speaker, text);
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 40px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';

        context.fillText(speaker + ':', canvas.width / 2, 80);

        context.font = '30px Arial';
        const lines = this.getLines(context, text, canvas.width - 40);
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, 150 + (index * 40));
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 3.9), textMaterial);
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
            const dialogData = JSON.parse(this.speechBubbleGroup.userData.dialog);
            this.showScreenSpeechBubble(dialogData.speaker, dialogData.text);
        }
    }

    createAlternativeButton(speaker, text) {
        this.cleanupAlternativeButton();
        this.alternativeButton = document.createElement('div');
        this.alternativeButton.id = 'alternative-speech-button';
        this.alternativeButton.innerHTML = `<button style="position: fixed; bottom: 20px; right: 20px; z-index: 10001; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Baca Percakapan</button>`;
        document.body.appendChild(this.alternativeButton);
        this.alternativeButton.querySelector('button').addEventListener('click', () => {
            this.showScreenSpeechBubble(speaker, text);
        });
    }

    showScreenSpeechBubble(speaker, text) {
        this.cleanupScreenSpeechBubble();
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 2px solid black; padding: 20px; border-radius: 10px; z-index: 10002; max-width: 80%;`;
        screenBubble.innerHTML = `<h3>${speaker}</h3><p>${text}</p><small>Klik untuk menutup</small>`;
        document.body.appendChild(screenBubble);
        screenBubble.addEventListener('click', () => this.cleanupScreenSpeechBubble());
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
        console.log(`[AcademicScene4A] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene4A] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene4A] Disposing...");
        this.cleanupSpeechBubble();
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));

        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
        if (this.npcSenior) {
            this.scene.remove(this.npcSenior);
        }
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
        }
    }
}