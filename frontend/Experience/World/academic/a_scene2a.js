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
        this.npcDeskmate.position.set(-47, 1.5, -34);
        
        // Rotate NPC to face towards the player (origin/center of room)
        // NPC is at (-47, 1.5, -34), player spawns at (0, 10, 0)
        // Calculate direction vector from NPC to player
        const dx = 0 - this.npcDeskmate.position.x;  // 47
        const dz = 0 - this.npcDeskmate.position.z;  // 34
        // Use atan2 to get the angle to face the player
        // Try swapping dx and dz to correct avatar orientation
        this.npcDeskmate.rotation.y = Math.atan2(dz, dx);
        
        this.npcDeskmate.scale.set(9, 9, 9);
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
        
        const border = new THREE.Mesh(
            new THREE.PlaneGeometry(8.8, 4.8),
            new THREE.MeshBasicMaterial({ 
                color: 0x1976d2, 
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true
            })
        );
        this.speechBubbleGroup.add(border, bubblePlane);
        
        this.createSpeechTextTexture(speaker, text);

        const npcPosition = this.npcDeskmate.position.clone();
        // Position speech bubble to the left side of NPC, slightly above eye level
        // Offset left by 6 units to avoid overlapping with NPC
        this.speechBubbleGroup.position.set(npcPosition.x - 6, npcPosition.y + 15, npcPosition.z);
        
        // Rotate bubble to face the player
        // Use lookAt method to make bubble always face towards player position (0, 0, 0)
        const playerPos = new THREE.Vector3(0, 10, 0);
        this.speechBubbleGroup.lookAt(playerPos);

        this.scene.add(this.speechBubbleGroup);
        this.createAlternativeButton(speaker, text, callback);
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f4ff');
        gradient.addColorStop(1, '#e8f0fe');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'bold 42px "Segoe UI", Arial, sans-serif';
        context.fillStyle = '#1565c0';
        context.textAlign = 'center';
        context.shadowColor = 'rgba(0, 0, 0, 0.1)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(speaker + ':', canvas.width / 2, 80);
        
        context.shadowColor = 'transparent';
        
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
        
        const buttonStyle = `
            position: fixed; bottom: 20px; right: 20px; z-index: 10001; padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;
            border-radius: 30px; cursor: pointer; font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        this.alternativeButton.innerHTML = `<button style="${buttonStyle}">💬 Baca Percakapan</button>`;
        document.body.appendChild(this.alternativeButton);
        
        const button = this.alternativeButton.querySelector('button');
        button.addEventListener('click', () => {
            this.showScreenSpeechBubble(speaker, text, callback);
        });
        
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
        this.cleanupScreenSpeechBubble();
        
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6); z-index: 10001; animation: fadeIn 0.3s ease;
        `;
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%); border: 3px solid #1976d2;
            padding: 30px 40px; border-radius: 20px; z-index: 10002; max-width: 600px; width: 90%;
            cursor: pointer; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); animation: slideUp 0.4s ease;
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
                this.cleanupSpeechBubble();
                if (callback) callback();
            }, 300);
        };
        
        screenBubble.addEventListener('click', closeBubble);
        backdrop.addEventListener('click', closeBubble);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(screenBubble);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideUp { from { transform: translate(-50%, -45%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
            @keyframes slideDown { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(-50%, -45%); opacity: 0; } }
        `;
        if (!document.getElementById('speechBubbleAnimations')) {
            style.id = 'speechBubbleAnimations';
            document.head.appendChild(style);
        }
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