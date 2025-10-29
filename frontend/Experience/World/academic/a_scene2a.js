import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene2A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.npcDeskmate = null;
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

        console.log("Academic Scene 2A loaded");
    }

    createNPC() {
        console.log("[AcademicScene2A] Creating Deskmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene2A] Female avatar model not found!");
            return;
        }

        this.npcDeskmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcDeskmate.position.set(-10, 0.5, 23); // Different position from scene 1
        this.npcDeskmate.rotation.y = -Math.PI / 2;
        this.npcDeskmate.scale.set(10, 10, 10);
        this.scene.add(this.npcDeskmate);

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene2A] Deskmate NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ text: "Beberapa hari setelah ujian... Situasi berubah drastis.", onChoice: () => setTimeout(() => this.showIncident(), 50) });
    }

    showIncident() {
        this.dialogManager.showDialog({ speaker: "Guru", text: "STOP! Saya melihat kamu dan temanmu! Kalian mencontek! Ini sangat mengecewakan!", onChoice: () => setTimeout(() => this.showConsequence(), 50) });
    }

    showConsequence() {
        this.dialogManager.showDialog({ text: "Ternyata ada siswa lain yang melaporkan bahwa kalian mencontek. Guru mencoret nilai ujian kalian berdua. Temanmu yang memberikan contekan dipanggil ke BK dan mendapat surat peringatan.", onChoice: () => this.showFriendReaction() });
    }

    showFriendReaction() {
        const speaker = "Teman Sebangku";
        const text = "Ini semua gara-gara kamu! Harusnya kamu lebih hati-hati! Sekarang aku kena masalah juga! Aku gak mau ngomong sama kamu lagi!";
        this.create3DSpeechBubble(speaker, text, () => this.showIsolation());
    }

    showIsolation() {
        this.dialogManager.showDialog({ text: "Sejak kejadian itu, teman sebangkumu menjauhi kamu. Kalian sekarang dalam situasi yang sangat canggung. Dan yang lebih buruk, kalian harus mengerjakan tugas makalah biologi bersama...", onChoice: () => setTimeout(() => this.showAssignment(), 50) });
    }

    showAssignment() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Baik semuanya, kalian harus membuat makalah 10 halaman tentang topik biologi. Dikerjakan berpasangan. Deadline-nya seminggu lagi!", onChoice: () => setTimeout(() => this.showDilemma(), 50) });
    }

    showDilemma() {
        this.dialogManager.showDialog({ text: "Kamu dan teman sebangkumu yang masih marah sama kamu ternyata satu kelompok. Kalian tidak punya waktu untuk berdiskusi karena dia menolak berbicara denganmu. Sehari sebelum pengumpulan, kamu memaksa untuk bertemu.", onChoice: () => this.showFriendSuggestion() });
    }

    showFriendSuggestion() {
        const speaker = "Teman Sebangku";
        const text = "Dengar, aku gak punya waktu buat urusan ini. Pake AI aja buat bikin makalahnya. Cepat dan gampang. Selesai!";
        this.create3DSpeechBubble(speaker, text, () => this.showMainChoice());
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Kamu harus memutuskan. Waktu tinggal satu hari lagi...",
            choices: [
                { text: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena terburu-buru dan kelelahan.", score: 0, nextScene: 'a_scene3a' },
                { text: "Menggunakan AI untuk membuat makalah. Hasilnya bagus dan selesai cepat.", score: 20, nextScene: 'a_scene3b' }
            ],
            sublimentMessage: "Korupsi sering dimulai dari rasa putus asa mencari jalan mudah.",
            onChoice: (choice) => this.handleChoice(choice)
        });
    }

    handleChoice(choice) {
        if (choice.nextScene === 'a_scene3a') {
            this.showPathA();
        } else {
            this.showPathB();
        }
    }

    showPathA() {
        this.dialogManager.showDialog({ text: "Kamu memutuskan untuk mengerjakan sendiri. Semalam suntuk kamu begadang, mengetik dengan mata yang hampir terpejam. Paginya, kamu selesai... tapi makalahnya terlihat berantakan dan penuh kesalahan.", onChoice: () => this.showPathAResult() });
    }

    showPathAResult() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Hmm... makalah kalian kurang rapi dan ada beberapa kesalahan konsep. Tapi saya menghargai usaha kalian. Nilai: 70.", onChoice: () => this.transitionToNextScene('a_scene3a') });
    }

    showPathB() {
        this.dialogManager.showDialog({ text: "Kamu membuka AI dan mengetikkan topik makalah. Dalam 30 menit, makalah 10 halaman siap. Kamu edit sedikit agar terlihat natural. Besoknya kamu kumpulkan dengan percaya diri.", onChoice: () => this.showPathBResult() });
    }

    showPathBResult() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Wow, makalah kalian sangat bagus! Rapi, lengkap, dan mendalam. Ini contoh yang sempurna! Nilai: 95!", onChoice: () => this.showPathBTwist() });
    }

    showPathBTwist() {
        this.dialogManager.showDialog({ text: "Kamu merasa lega... untuk sementara. Tapi perasaan bersalah mulai menumpuk. Dan yang tidak kamu sadari, guru mulai curiga karena gaya penulisan makalahmu sangat berbeda dari tulisan biasamu...", onChoice: () => this.transitionToNextScene('a_scene3b') });
    }

    // --- Speech Bubble Logic (Copied and adapted) ---

    create3DSpeechBubble(speaker, text, callback) {
        this.cleanupSpeechBubble();
        this.speechBubbleGroup = new THREE.Group();
        this.speechBubbleGroup.userData = { speaker, text, callback };

        const bubblePlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide, depthWrite: false }));
        this.speechBubbleMaterial = bubblePlane.material;
        const border = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.2), new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.FrontSide, depthWrite: false }));
        this.speechBubbleGroup.add(border, bubblePlane);
        
        this.createSpeechTextTexture(speaker, text);

        const npcPosition = this.npcDeskmate.position.clone();
        this.speechBubbleGroup.position.set(npcPosition.x, npcPosition.y + 15, npcPosition.z);
        this.speechBubbleGroup.rotation.y = Math.PI;

        this.scene.add(this.speechBubbleGroup);
        this.createAlternativeButton(speaker, text, callback);
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 40px Arial'; context.fillStyle = 'black'; context.textAlign = 'center';
        context.fillText(speaker + ':', canvas.width / 2, 80);
        context.font = '30px Arial';
        const lines = this.getLines(context, text, canvas.width - 40);
        lines.forEach((line, index) => context.fillText(line, canvas.width / 2, 150 + (index * 40)));
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 3.9), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
        textPlane.position.z = 0.01;
        this.speechBubbleGroup.add(textPlane);
    }

    getLines(ctx, text, maxWidth) {
        const words = text.split(' '); const lines = []; let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i]; const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) { currentLine += ' ' + word; } else { lines.push(currentLine); currentLine = word; }
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
        this.alternativeButton.innerHTML = `<button style="position: fixed; bottom: 20px; right: 20px; z-index: 10001; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Baca Percakapan</button>`;
        document.body.appendChild(this.alternativeButton);
        this.alternativeButton.querySelector('button').addEventListener('click', () => {
            this.showScreenSpeechBubble(speaker, text, callback);
        });
    }

    showScreenSpeechBubble(speaker, text, callback) {
        this.cleanupScreenSpeechBubble();
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 2px solid black; padding: 20px; border-radius: 10px; z-index: 10002; max-width: 80%; cursor: pointer;`;
        screenBubble.innerHTML = `<h3>${speaker}</h3><p>${text}</p><small>Klik untuk menutup</small>`;
        screenBubble.addEventListener('click', () => {
            screenBubble.remove();
            this.cleanupSpeechBubble();
            if (callback) callback();
        });
        document.body.appendChild(screenBubble);
    }

    cleanupSpeechBubble() {
        if (this.speechBubbleGroup) { this.scene.remove(this.speechBubbleGroup); this.speechBubbleGroup = null; }
        this.cleanupAlternativeButton();
        this.cleanupScreenSpeechBubble();
    }

    cleanupAlternativeButton() {
        if (this.alternativeButton) { this.alternativeButton.remove(); this.alternativeButton = null; }
    }

    cleanupScreenSpeechBubble() {
        const existingBubble = document.getElementById('screen-speech-bubble');
        if (existingBubble) existingBubble.remove();
    }

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene2A] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene2A] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene2A] Disposing...");
        this.cleanupSpeechBubble();
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        if (this.dialogManager) this.dialogManager.hideAll();
        if (this.classModel && this.classModel.parent) this.scene.remove(this.classModel.parent);
        if (this.npcDeskmate) this.scene.remove(this.npcDeskmate);
        if (this.npcMixer) this.npcMixer.stopAllAction();
    }
}