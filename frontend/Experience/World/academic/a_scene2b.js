import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene2B {
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

        console.log("Academic Scene 2B loaded");
    }

    createNPC() {
        console.log("[AcademicScene2B] Creating Deskmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene2B] Female avatar model not found!");
            return;
        }

        this.npcDeskmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcDeskmate.position.set(-47, 1.5, 23);
        this.npcDeskmate.rotation.y = Math.atan2(0 - this.npcDeskmate.position.x, 0 - this.npcDeskmate.position.z) + Math.PI / 2;
        this.npcDeskmate.scale.set(9, 9, 9);
        this.scene.add(this.npcDeskmate);

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene2B] Deskmate NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ text: "Beberapa hari setelah ujian... Kamu menerima hasilnya.", onChoice: () => setTimeout(() => this.showResult(), 50) });
    }

    showResult() {
        this.dialogManager.showDialog({ text: "Nilai ujianmu: 60. Orang tuamu kecewa dan memang menyita HP-mu untuk sementara. Tapi kamu merasa lega karena mengerjakan dengan jujur. Kamu punya waktu lebih banyak untuk belajar tanpa distraksi HP.", onChoice: () => setTimeout(() => this.showMotivation(), 50) });
    }

    showMotivation() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Memang awalnya berat, tapi aku merasa lebih tenang. Aku harus lebih giat belajar supaya nilai berikutnya lebih baik!", onChoice: () => setTimeout(() => this.showNewAssignment(), 50) });
    }

    showNewAssignment() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Hari ini saya akan memberi tugas kelompok. Kalian harus membuat makalah 10 halaman tentang topik biologi. Dikerjakan berpasangan dengan teman sebangku. Deadline seminggu lagi!", onChoice: () => setTimeout(() => this.showEagerness(), 50) });
    }

    showEagerness() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Ini kesempatan untuk membuktikan bahwa aku bisa! Aku harus mendapat nilai terbaik untuk tugas ini!", onChoice: () => setTimeout(() => this.showOverwork(), 50) });
    }

    showOverwork() {
        this.dialogManager.showDialog({ text: "Pada hari pertama tugas diberikan, kamu langsung begadang untuk mengerjakan makalah sendirian. Kamu ingin membuktikan kesungguhanmu. Tapi tubuhmu tidak kuat... Keesokan harinya kamu jatuh sakit dan tidak bisa masuk sekolah selama 3 hari.", onChoice: () => setTimeout(() => this.showPanic(), 50) });
    }

    showPanic() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Sehari lagi deadline! Tapi makalahnya baru setengah jadi... Aku harus bagaimana?!", onChoice: () => this.showFriendOffer() });
    }

    showFriendOffer() {
        const speaker = "Teman Sebangku (via chat)";
        const text = "Eh, aku dengar kamu sakit. Makalah kita gimana? Aku liat kamu udah bikin setengah. Mau gampang? Pake AI aja buat selesain sisanya. Cepet kok!";

        this.create3DSpeechBubble(speaker, text, () => {
            this.showMainChoice();
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Kamu dalam dilema besar. Waktu tinggal satu hari, kamu masih lemah karena baru sembuh, dan makalahnya baru setengah...",
            choices: [
                { text: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena kondisi badan masih lemah.", score: 0, nextScene: 'a_scene3a' },
                { text: "Menggunakan AI untuk menyelesaikan setengahnya lagi. Hasilnya bagus dan bisa istirahat.", score: 20, nextScene: 'a_scene3b' }
            ],
            sublimentMessage: "Ketika nilai jadi segalanya, integritas perlahan digadaikan.",
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
        this.dialogManager.showDialog({ text: "Kamu memaksakan diri untuk begadang lagi meski badan masih lemah. Dengan mata berair dan kepala pusing, kamu menyelesaikan makalah. Hasilnya tidak semaksimal yang kamu inginkan, tapi ini hasil kerja kerasmu sendiri.", onChoice: () => this.showPathAResult() });
    }

    showPathAResult() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Makalah kalian... cukup baik. Ada beberapa bagian yang kurang detail, tapi saya bisa lihat usaha kalian. Nilai: 75. Pertahankan semangat ini!", onChoice: () => this.transitionToNextScene('a_scene3a') });
    }

    showPathB() {
        this.dialogManager.showDialog({ text: "Kamu membuka AI dan menyalin separuh makalah yang sudah kamu buat, lalu meminta AI melengkapi sisanya. Dalam 1 jam, makalah selesai dengan rapi. Kamu bisa istirahat dan memulihkan kondisi.", onChoice: () => this.showPathBResult() });
    }

    showPathBResult() {
        this.dialogManager.showDialog({ speaker: "Guru Biologi", text: "Excellent! Makalah kalian sangat lengkap dan terstruktur dengan baik! Ini salah satu yang terbaik di kelas. Nilai: 95!", onChoice: () => this.showPathBConflict() });
    }

    showPathBConflict() {
        this.dialogManager.showDialog({ text: "Kamu seharusnya senang, tapi ada perasaan hampa. Separuh dari makalah itu bukan hasil kerjamu. Apakah ini yang dimaksud dengan 'sukses'?", onChoice: () => this.transitionToNextScene('a_scene3b') });
    }

    // --- Speech Bubble Logic ---

    create3DSpeechBubble(speaker, text, callback) {
        this.cleanupSpeechBubble();
        this.speechBubbleGroup = new THREE.Group();
        this.speechBubbleGroup.userData = { speaker, text, callback };

        // Create enhanced bubble with better visual design
        const bubblePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 5),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffff, // Background putih lebih terang
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0.98 // Hampir tidak transparan untuk kontras lebih baik
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
                opacity: 0.3 // Soft glow effect
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
                opacity: 0.95
            })
        );

        // Tambahkan semua elemen dalam urutan yang benar (dari belakang ke depan)
        this.speechBubbleGroup.add(outerGlow);
        this.speechBubbleGroup.add(border);
        this.speechBubbleGroup.add(bubblePlane);
        
        this.createSpeechTextTexture(speaker, text);

        const npcPosition = this.npcDeskmate.position.clone();
        this.speechBubbleGroup.position.set(npcPosition.x - 6, npcPosition.y + 15, npcPosition.z);
        this.speechBubbleGroup.rotation.y = Math.PI; 

        this.scene.add(this.speechBubbleGroup);
        this.createAlternativeButton(speaker, text, callback);
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

        // Draw speaker name with enhanced, clearer styling - diperbesar lagi
        context.font = 'bold 80px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#0d47a1'; // Biru lebih gelap untuk kontras lebih baik
        context.textAlign = 'center';
        context.textBaseline = 'top';
        // Enhanced shadow untuk depth
        context.shadowColor = 'rgba(25, 118, 210, 0.4)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        context.fillText(speaker + ':', canvas.width / 2, 140);
        
        // Reset shadow untuk text body
        context.shadowColor = 'rgba(0, 0, 0, 0.15)';
        context.shadowBlur = 3;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 1;
        
        // Draw text dengan font lebih besar dan kontras lebih baik - diperbesar lagi
        context.font = 'bold 60px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#1a1a1a'; // Hitam lebih gelap untuk readability lebih baik
        context.textAlign = 'center';
        
        const lines = this.getLines(context, text, canvas.width - 160); // Margin lebih besar untuk font besar
        const lineHeight = 85; // Line spacing lebih besar untuk readability
        const startY = 250; // Start position lebih bawah untuk speaker name
        
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
            // Play click sound for button
            if (this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
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
        console.log(`[AcademicScene2B] Loading scene: ${sceneName}`);
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; z-index: 9999; opacity: 0; transition: opacity 0.5s;`;
        document.body.appendChild(fadeDiv);
        setTimeout(() => fadeDiv.style.opacity = '1', 10);
        setTimeout(() => {
            this.dialogManager.hideAll();
            this.cleanupSpeechBubble();
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[AcademicScene2B] Navigating to: ${newUrl}`);
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene2B] Disposing...");
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
    }
}