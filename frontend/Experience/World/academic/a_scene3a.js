import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene3A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.npcGroupmate = null;
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

        console.log("Available resources in a_scene3a:", this.resources.items);
        this.scienceModel = this.resources.items.scienceRoom.scene;
        this.scienceModel.position.set(0, 0, 0);
        this.scienceModel.rotation.set(0, 0, 0);
        this.scienceModel.scale.set(10, 10, 10);
        collidableGroup.add(this.scienceModel);

        this.scene.add(collidableGroup);
        this.octree.fromGraphNode(collidableGroup);

        console.log("Academic Scene 3A (Lab) loaded");
    }

    createNPC() {
        console.log("[AcademicScene3A] Creating Groupmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene3A] Female avatar model not found!");
            return;
        }

        this.npcGroupmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcGroupmate.position.set(5, 0.5, 15); // Position in the lab
        this.npcGroupmate.rotation.y = Math.PI;
        this.npcGroupmate.scale.set(10, 10, 10);
        this.scene.add(this.npcGroupmate);

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcGroupmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene3A] Groupmate NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ text: "Walau tugas makalah belum sepenuhnya selesai. Selanjutnya adalah ujian praktik biologi berkelompok. Kamu masuk ke laboratorium biologi yang dipenuhi mikroskop dan alat-alat percobaan.", onChoice: () => this.showDilemma1() });
    }

    showDilemma1() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Sekarang harus praktik biologi juga. Kurasa tidak ada waktu istirahat buatku huh?", onChoice: () => this.showChoice1() });
    }

    showChoice1() {
        const speaker = "Teman Kelompok";
        const text = "Eh, kamu mau ikutan praktik atau mau ngerjain tugas makalahmu? Soalnya kita butuh semua orang fokus nih.";

        this.create3DSpeechBubble(speaker, text);

        this.dialogManager.showDialog({
            speaker: speaker,
            text: text,
            choices: [
                { text: "Mengerjakan tugas makalah Kimia dan numpang nama di kelompok biologi.", score: 10, path: 'makalah' },
                { text: "Ikut andil dalam kelompok biologi dan bayar joki untuk tugas makalah Kimia.", score: 5, path: 'biologi' }
            ],
            onChoice: (choice) => {
                this.cleanupSpeechBubble();
                this.handleFirstChoice(choice);
            }
        });
    }

    handleFirstChoice(choice) {
        if (choice.path === 'makalah') {
            this.showMakalahPath();
        }
        else {
            this.showBiologiPath();
        }
    }

    showMakalahPath() {
        this.dialogManager.showDialog({ text: "Kamu memutuskan untuk duduk di pojok lab sambil mengerjakan makalah kimia. Teman-teman kelompokmu melakukan praktik sendiri. Mereka sesekali melirikmu dengan tatapan tidak puas.", onChoice: () => this.showLeakInfo() });
    }

    showBiologiPath() {
        this.dialogManager.showDialog({ text: "Kamu memutuskan ikut praktik biologi. Untuk makalah kimia, kamu diam-diam kontak kakak kelas yang terkenal menerima joki tugas dengan bayaran.", onChoice: () => this.showLeakInfo() });
    }

    showLeakInfo() {
        const speaker = "Teman Kelompok";
        const text = "Eh, aku dapat info dari kakak kelas! Soal praktik biologi kita ini SAMA persis dengan tahun lalu! Kita bisa minta bocoran jawaban dari kakak kelas!";

        this.create3DSpeechBubble(speaker, text);

        this.dialogManager.showDialog({
            speaker: speaker,
            text: text,
            onChoice: () => {
                this.cleanupSpeechBubble();
                this.showLeakProposal();
            }
        });
    }

    showLeakProposal() {
        const speaker = "Teman Kelompok";
        const text = "Kamu kan kenal sama kakak kelas itu kan? Minta tolong dong! Kalau kita pakai bocoran, praktik kita pasti sempurna!";

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
            text: "Kelompokmu memandangmu dengan penuh harap. Mereka menunggu keputusanmu...",
            choices: [
                { text: "Menolak meminta bocoran. Teman sekelompok marah dan mencoret namamu dari kelompok. Kamu harus praktik sendiri.", score: 0, nextScene: 'a_scene4a' },
                { text: "Meminta bocoran kepada kakak kelas. Praktik kalian berjalan sempurna.", score: 25, nextScene: 'a_scene4b' }
            ],
            sublimentMessage: "Integritas sering membuatmu sendirian, sementara janji manis jalan pintas hanya berakhir dengan kekecewaan — dan di situlah benih korupsi tumbuh.",
            onChoice: (choice) => this.handleMainChoice(choice)
        });
    }

    handleMainChoice(choice) {
        if (choice.score === 0) {
            this.showRefusePath();
        } else {
            this.showAcceptPath();
        }
    }

    showRefusePath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Maaf, aku tidak bisa melakukan itu. Itu tidak jujur.", onChoice: () => this.showRefuseResult() });
    }

    showRefuseResult() {
        const speaker = "Teman Kelompok";
        const text = "Serius?! Kamu terlalu idealis! Ya udah, kalau gitu namamu kami coret aja dari kelompok. Kerjain sendiri praktikmu!";

        this.create3DSpeechBubble(speaker, text);

        this.dialogManager.showDialog({
            speaker: speaker,
            text: text,
            onChoice: () => {
                this.cleanupSpeechBubble();
                this.showRefuseConsequence();
            }
        });
    }

    showRefuseConsequence() {
        this.dialogManager.showDialog({ text: "Kamu harus mengerjakan praktik biologi sendirian. Tanpa bantuan kelompok, hasilnya tidak maksimal. Tapi setidaknya kamu bisa tidur nyenyak malam itu, tanpa beban kebohongan.", onChoice: () => this.transitionToNextScene('a_scene4a') });
    }

    showAcceptPath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Oke... aku akan coba minta.", onChoice: () => this.showAcceptResult() });
    }

    showAcceptResult() {
        this.dialogManager.showDialog({ text: "Kamu menghubungi kakak kelas. Dia mengirimkan semua jawaban praktik tahun lalu. Kelompokmu sangat senang. Praktik berjalan mulus, semua jawaban benar. Kalian mendapat nilai A.", onChoice: () => this.showAcceptConsequence() });
    }

    showAcceptConsequence() {
        this.dialogManager.showDialog({ text: "Teman-temanmu merayakan kesuksesan ini. Tapi kamu merasa ada yang salah. Ini bukan hasil kerja kalian. Ini hanya... menyontek.", onChoice: () => this.transitionToNextScene('a_scene4b') });
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

        const npcPosition = this.npcGroupmate.position.clone();
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
        console.log(`[AcademicScene3A] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene3A] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene3A] Disposing...");
        this.cleanupSpeechBubble();
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));

        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.scienceModel && this.scienceModel.parent) {
            this.scene.remove(this.scienceModel.parent);
        }
        if (this.npcGroupmate) {
            this.scene.remove(this.npcGroupmate);
        }
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
        }
    }
}