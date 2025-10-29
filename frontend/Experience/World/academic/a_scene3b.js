import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene3B {
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

        console.log("Available resources in a_scene3b:", this.resources.items);
        this.scienceModel = this.resources.items.scienceRoom.scene;
        this.scienceModel.position.set(0, 0, 0);
        this.scienceModel.rotation.set(0, 0, 0);
        this.scienceModel.scale.set(10, 10, 10);
        collidableGroup.add(this.scienceModel);

        this.scene.add(collidableGroup);
        this.octree.fromGraphNode(collidableGroup);

        console.log("Academic Scene 3B (Lab) loaded");
    }

    createNPC() {
        console.log("[AcademicScene3B] Creating Groupmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene3B] Female avatar model not found!");
            return;
        }

        this.npcGroupmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcGroupmate.position.set(5, 0.5, 15);
        this.npcGroupmate.rotation.y = Math.PI;
        this.npcGroupmate.scale.set(10, 10, 10);
        this.scene.add(this.npcGroupmate);

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcGroupmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene3B] Groupmate NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ text: "Hari presentasi makalah kimia...", onChoice: () => this.showBusted() });
    }

    showBusted() {
        this.dialogManager.showDialog({ speaker: "Guru Kimia", text: "Setelah saya periksa lebih detail, makalah kalian ini... terlalu sempurna. Gaya bahasanya sama sekali tidak seperti tulisan kalian biasanya. Ini hasil AI kan?", onChoice: () => this.showEmbarrassment() });
    }

    showEmbarrassment() {
        this.dialogManager.showDialog({ text: "Guru mempermalukan kalian di depan kelas. Semua mata tertuju padamu. Teman sebangkumu menyalahkanmu karena ide menggunakan AI datang darimu (setidaknya menurutnya).", onChoice: () => this.showConsequence() });
    }

    showConsequence() {
        this.dialogManager.showDialog({ speaker: "Guru Kimia", text: "Nilai makalah kalian saya batalkan. Kalian harus mengerjakan ulang dengan pengawasan saya. Dan saya akan melaporkan ini ke wali kelas kalian.", onChoice: () => this.showReputation() });
    }

    showReputation() {
        this.dialogManager.showDialog({ text: "Berita cepat menyebar di kelas. Teman-temanmu mulai meragukan integritasmu. Ada yang membela, ada yang menghakimi. Suasana menjadi canggung.", onChoice: () => this.showBiologyLab() });
    }

    showBiologyLab() {
        this.dialogManager.showDialog({ text: "Beberapa hari kemudian, ujian praktik biologi berkelompok dimulai. Kamu masuk lab dengan perasaan malu. Teman-teman kelompokmu menatapmu dengan ragu.", onChoice: () => this.showFirstChoice() });
    }

    showFirstChoice() {
        const speaker = "Teman Kelompok";
        const text = "Jadi... kamu mau ikut bantu atau gimana? Soalnya... ya, kamu tau lah situasinya.";

        this.create3DSpeechBubble(speaker, text);

        this.dialogManager.showDialog({
            speaker: speaker,
            text: text,
            choices: [
                { text: "Bertanya bagian mana yang bisa dikerjakan. Hasilnya percobaan gagal karena memecahkan fokus teman.", score: 0, path: 'try_help' },
                { text: "Diam saja dan tidak membantu apa-apa.", score: 25, path: 'silent' }
            ],
            onChoice: (choice) => {
                this.cleanupSpeechBubble();
                this.handleFirstChoice(choice);
            }
        });
    }

    handleFirstChoice(choice) {
        if (choice.path === 'try_help') {
            this.showTryHelpPath();
        } else {
            this.showSilentPath();
        }
    }

    showTryHelpPath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Aku mau bantu. Kasih tau aku bagian mana yang bisa aku kerjakan.", onChoice: () => this.showTryHelpResult() });
    }

    showTryHelpResult() {
        this.dialogManager.showDialog({ text: "Teman-temanmu ragu tapi memberimu bagian kecil. Karena kamu tidak familiar dengan alat lab, kamu malah membuat percobaan gagal. Teman-temanmu semakin kesal.", onChoice: () => this.showLeakOffer() });
    }

    showSilentPath() {
        this.dialogManager.showDialog({ text: "Kamu memutuskan diam saja, duduk di pojok lab. Teman-temanmu mengerjakan praktik sendiri, sesekali menyindir: \"Enak ya cuma duduk doang, tapi dapat nilai kelompok.\"", onChoice: () => this.showLeakOffer() });
    }

    showLeakOffer() {
        const speaker = "Teman Kelompok";
        const text = "Dari pada kamu diam aja atau malah bikin masalah... lebih baik kamu bantu dengan cara lain. Kamu kan kenal kakak kelas? Minta bocoran soal praktik dari dia. Dia kan udah pernah praktik ini tahun lalu!";

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
            text: "Ini kesempatanmu untuk 'menebus kesalahan' di mata teman-temanmu. Tapi apakah dengan cara yang salah lagi?",
            choices: [
                { text: "Menolak. Teman sekelompok mencoret namamu dari kelompok. Kamu harus praktik sendiri.", score: 0, nextScene: 'a_scene4b' },
                { text: "Meminta bocoran kepada kakak kelas untuk mendapat kepercayaan kelompok kembali.", score: 25, nextScene: 'a_scene4b' }
            ],
            sublimentMessage: "Menolak kecurangan memang menyakitkan, namun jalan pintas selalu membuka kedok korupsi.",
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
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Aku tidak akan melakukan itu lagi. Aku sudah pernah salah, aku tidak mau mengulanginya.", onChoice: () => this.showRefuseResult() });
    }

    showRefuseResult() {
        const speaker = "Teman Kelompok";
        const text = "Ya udah terserah kamu! Tapi jangan harap kamu dapat nilai dari kelompok kami. Namamu kami coret!";

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
        this.dialogManager.showDialog({ text: "Kamu terpaksa mengerjakan praktik sendiri dengan hasil yang kurang maksimal. Tapi kali ini, kamu merasa lebih baik. Setidaknya kamu tidak menambah kesalahan.", onChoice: () => this.transitionToNextScene('a_scene4a') });
    }

    showAcceptPath() {
        this.dialogManager.showDialog({ speaker: "Kamu", text: "Baiklah... aku akan coba minta.", onChoice: () => this.showAcceptResult() });
    }

    showAcceptResult() {
        this.dialogManager.showDialog({ text: "Kamu menghubungi kakak kelas dan mendapat bocoran jawaban. Teman-teman kelompokmu senang dan praktik berjalan sempurna. Mereka mulai 'memaafkan' kesalahanmu sebelumnya.", onChoice: () => this.showAcceptConsequence() });
    }

    showAcceptConsequence() {
        this.dialogManager.showDialog({ text: "Tapi di dalam hati, kamu tahu... kamu hanya menambah daftar kebohongan. Kapan ini akan berhenti?", onChoice: () => this.transitionToNextScene('a_scene4b') });
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
        console.log(`[AcademicScene3B] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene3B] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene3B] Disposing...");
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