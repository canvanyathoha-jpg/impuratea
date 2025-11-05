import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";
import SpeechAudioManager from "../../Utils/SpeechAudioManager.js";
import { languageManager } from "../../Utils/LanguageManager.js";

export default class AcademicScene4A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.speechAudioManager = new SpeechAudioManager();
        this.npcGender = 'male'; // NPC di scene 4a menggunakan model male
        this.npcSenior = null;
        this.speechBubbleGroup = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.setWorld();
        this.createNPC();
        
        // Sistem manual - dialog hanya dimulai saat player mengklik NPC atau tombol
        // TIDAK ADA timeout otomatis, player bebas menjelajah sepuasnya
        this.storyStarted = false;
        this.setupManualInteraction();
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
        this.npcSenior.position.set(-15, 1.5, 6); // Positioned at the side
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

    // Setup sistem interaksi manual: player harus klik NPC atau tombol untuk mulai dialog
    setupManualInteraction() {
        // Buat tombol manual yang selalu tersedia
        this.createManualDialogButton();
        
        // Tambahkan area interaksi di sekitar NPC yang bisa diklik
        this.createNPCInteractionZone();
        
        // Update raycast untuk deteksi klik pada NPC
        console.log("[AcademicScene4A] Manual interaction system ready. Player can click NPC or button to start dialog.");
    }
    
    // Membuat tombol manual yang selalu terlihat untuk mulai dialog
    createManualDialogButton() {
        this.manualDialogButton = document.createElement('div');
        this.manualDialogButton.id = 'manual-dialog-button';
        
        const buttonStyle = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
            padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; border-radius: 30px; cursor: pointer;
            font-size: 14px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease; font-family: 'Segoe UI', Arial, sans-serif;
            display: ${this.storyStarted ? 'none' : 'block'};
        `;
        
        this.manualDialogButton.innerHTML = `
            <button style="${buttonStyle}">💬 Mulai Percakapan</button>
        `;
        document.body.appendChild(this.manualDialogButton);
        
        const button = this.manualDialogButton.querySelector('button');
        button.addEventListener('click', () => {
            // Play click sound for button
            if (this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            if (!this.storyStarted) {
                this.startStory();
            }
        });
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateX(-50%) translateY(-2px) scale(1.05)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
    }
    
    // Membuat zona interaksi 3D di sekitar NPC yang bisa diklik
    createNPCInteractionZone() {
        if (!this.npcSenior) return;
        
        // Buat sphere invisible yang lebih besar di sekitar NPC untuk area klik
        const interactionGeometry = new THREE.SphereGeometry(8, 16, 16);
        const interactionMaterial = new THREE.MeshBasicMaterial({ 
            visible: false, 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        this.npcInteractionZone = new THREE.Mesh(interactionGeometry, interactionMaterial);
        this.npcInteractionZone.position.copy(this.npcSenior.position);
        this.npcInteractionZone.position.y += 5; // Naikkan sedikit dari ground
        this.npcInteractionZone.userData.isNPC = true;
        
        // Tambahkan ke scene
        this.scene.add(this.npcInteractionZone);
        
        console.log("[AcademicScene4A] NPC interaction zone created at:", this.npcInteractionZone.position);
    }

    startStory() {
        // Pastikan hanya dimulai sekali
        if (this.storyStarted) return;
        this.storyStarted = true;
        
        // Sembunyikan tombol manual
        if (this.manualDialogButton) {
            this.manualDialogButton.style.display = 'none';
        }
        
        // Hapus interaction zone (tidak perlu lagi setelah dialog dimulai)
        if (this.npcInteractionZone) {
            this.scene.remove(this.npcInteractionZone);
            this.npcInteractionZone = null;
        }
        
        console.log("[AcademicScene4A] Starting story dialog manually...");
        this.dialogManager.showDialog({ text: "Lanjutan dari ujian praktik biologi adalah presentasi individu. Setiap siswa harus mempresentasikan hasil praktiknya di depan kelas.", onChoice: () => this.showDoubt() });
    }

    showDoubt() {
        this.dialogManager.showDialog({ speaker: "Kamu (batin)", text: "Aku ragu dengan hasil praktik ku... Nilainya pasti tidak bagus. Apa aku harus minta bantuan kakak kelas lagi ya? Dia punya materi lengkap dari tahun lalu...", onChoice: () => this.showRemembrance() });
    }

    showRemembrance() {
        this.dialogManager.showDialog({ text: "Kamu teringat kakak kelas yang pernah kamu hubungi untuk bocoran. Dia sempat bilang masih punya materi presentasi lengkap. Kamu menghubunginya...", onChoice: () => this.showSeniorResponse() });
    }

    showSeniorResponse() {
        const speaker = "Kakak Kelas (via chat)"
        const text = "Oh iya, aku masih punya materi presentasinya. Lengkap sama slide PowerPoint-nya. Tapi... ini gak gratis ya. Transfer 50ribu dulu, baru aku kasih materinya.";

        // JANGAN tampilkan showScreenSpeechBubble karena akan ada DialogManager dengan choices
        this.create3DSpeechBubble(speaker, text, false);
        
        setTimeout(() => {
            this.cleanupScreenSpeechBubble();
            this.dialogManager.showDialog({
                speaker: speaker,
                text: text,
                onChoice: () => {
                    this.cleanupSpeechBubble();
                    this.showMainChoice();
                }
            });
        }, 350);
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

    create3DSpeechBubble(speaker, text, showScreenDialog = true) {
        // showScreenDialog: apakah harus menampilkan screen dialog otomatis
        // false jika akan ada DialogManager.showDialog yang dipanggil setelahnya
        this.cleanupSpeechBubble();
        this.speechBubbleGroup = new THREE.Group();

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

        const npcPosition = this.npcSenior.position.clone();
        // NPC berada di posisi (-15, 1.5, 6) dengan rotasi y = Math.PI / 2 (menghadap kanan)
        // NPC memiliki scale 10x, jadi tinggi NPC sekitar 10-15 unit
        // Posisikan speech bubble di samping kanan NPC, setinggi kepala NPC
        // Offset ke kanan (X positif karena NPC di X = -15), setinggi kepala (sekitar 10-12 unit dari ground)
        this.speechBubbleGroup.position.set(
            npcPosition.x + 8,      // 8 unit di kanan NPC (di samping kanan)
            npcPosition.y + 13,     // 13 unit di atas NPC (setinggi kepala: NPC base 1.5 + tinggi ~12-15 unit = ~13.5-16.5)
            npcPosition.z + 1       // Sedikit ke depan untuk visibility
        );
        
        // Rotasi speech bubble agar selalu menghadap ke depan (selaras dengan NPC)
        // NPC menghadap ke kanan (rotation.y = Math.PI / 2), maka bubble harus menghadap ke depan juga
        this.speechBubbleGroup.rotation.y = Math.PI / 2; // Menghadap ke kanan/ke depan sesuai NPC

        this.scene.add(this.speechBubbleGroup);
        // Dialog muncul otomatis HANYA jika showScreenDialog = true
        // Jika false, biarkan DialogManager yang menampilkan (untuk avoid overlap dengan choices)
        if (showScreenDialog) {
            setTimeout(() => {
                this.showScreenSpeechBubble(speaker, text);
            }, 300);
        }
        
        // Play speech audio menggunakan Web Speech API dengan voice sesuai gender NPC
        if (this.speechAudioManager && this.speechAudioManager.isSupported) {
            const fullText = `${speaker}: ${text}`;
            // Jangan set pitch/rate secara eksplisit - biarkan SpeechAudioManager set otomatis berdasarkan gender
            this.speechAudioManager.speak(fullText, {
                gender: this.npcGender, // Gunakan gender NPC yang sesuai (male untuk scene 4a)
                // Pitch dan rate akan otomatis di-set berdasarkan gender
                volume: 0.85
            });
        }
        
        // Flag untuk update rotasi agar selalu menghadap kamera
        this.needsSpeechBubbleUpdate = true;
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
        context.fillStyle = '#0d47a1';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.shadowColor = 'rgba(25, 118, 210, 0.5)';
        context.shadowBlur = 12;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 3;
        context.fillText(speaker + ':', canvas.width / 2, 120);
        
        context.shadowColor = 'rgba(0, 0, 0, 0.2)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        // Draw text dengan font JAUH LEBIH BESAR untuk visibility maksimal
        context.font = 'bold 110px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        
        const lines = this.getLines(context, text, canvas.width - 200);
        const lineHeight = 130;
        const startY = 320;
        
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

    // Override onMouseMove untuk update cursor dan hover effect
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (this.storyStarted && this.speechBubbleGroup) {
            // Jika dialog sudah dimulai, cek hover pada speech bubble
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
            return;
    }

        // Jika dialog belum dimulai, cek hover pada NPC
        if (!this.storyStarted && (this.npcSenior || this.npcInteractionZone)) {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const objectsToCheck = [];
            if (this.npcSenior) objectsToCheck.push(this.npcSenior);
            if (this.npcInteractionZone) objectsToCheck.push(this.npcInteractionZone);
            
            const intersects = this.raycaster.intersectObjects(objectsToCheck, true);
            this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        }
    }

    // Override onMouseClick untuk menangani klik pada NPC
    onMouseClick(event) {
        if (this.storyStarted) {
            // Jika dialog sudah dimulai, cek klik pada speech bubble (kode lama)
            if (this.speechBubbleGroup) {
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        if (intersects.length > 0) {
            const dialogData = JSON.parse(this.speechBubbleGroup.userData.dialog);
            this.showScreenSpeechBubble(dialogData.speaker, dialogData.text);
                }
            }
            return;
        }
        
        // Jika dialog belum dimulai, cek klik pada NPC atau interaction zone
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        
        // Cek intersect dengan NPC atau interaction zone
        const objectsToCheck = [];
        if (this.npcSenior) objectsToCheck.push(this.npcSenior);
        if (this.npcInteractionZone) objectsToCheck.push(this.npcInteractionZone);
        
        const intersects = this.raycaster.intersectObjects(objectsToCheck, true);
        
        if (intersects.length > 0) {
            console.log("[AcademicScene4A] NPC clicked! Starting dialog...");
            this.startStory();
        }
    }

    createAlternativeButton(speaker, text) {
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
            this.showScreenSpeechBubble(speaker, text);
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

    showScreenSpeechBubble(speaker, text) {
        this.cleanupScreenSpeechBubble();
        
        // TIDAK PERLU BACKDROP GELAP - Dialog muncul jelas tanpa overlay
        // Hapus backdrop untuk visibility yang lebih baik
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%); border: 3px solid #1976d2;
            padding: 30px 40px; border-radius: 20px; z-index: 10002; max-width: 700px; width: 85%;
            cursor: pointer; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25); animation: slideUp 0.4s ease;
            font-family: 'Segoe UI', Arial, sans-serif; backdrop-filter: blur(10px);
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
            setTimeout(() => {
                screenBubble.remove();
            }, 300);
        };
        
        screenBubble.addEventListener('click', closeBubble);
        
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
        // Stop any ongoing speech audio
        if (this.speechAudioManager) {
            this.speechAudioManager.stop();
        }
        
        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
        }
        this.needsSpeechBubbleUpdate = false; // Reset flag saat cleanup
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

    // Update rotasi speech bubble agar selalu menghadap ke kamera
    updateSpeechBubbleRotation() {
        if (!this.speechBubbleGroup || !this.experience.camera) return;
        
        // Dapatkan posisi kamera
        const cameraPosition = this.experience.camera.instance.position.clone();
        
        // Posisi speech bubble
        const bubblePosition = this.speechBubbleGroup.position.clone();
        
        // Hitung arah dari speech bubble ke kamera
        const direction = new THREE.Vector3();
        direction.subVectors(cameraPosition, bubblePosition).normalize();
        
        // Hitung rotasi Y agar speech bubble menghadap ke kamera
        const angle = Math.atan2(direction.x, direction.z);
        this.speechBubbleGroup.rotation.y = angle;
    }

    // --- End Speech Bubble Logic ---

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene4A] Loading scene: ${sceneName}`);
        
        // Hide dialog first
        this.dialogManager.hideAll();
        this.cleanupSpeechBubble();
        
        // Use World's switchSceneWithPosition to show loading bar
        if (this.experience.world && this.experience.world.switchSceneWithPosition) {
            const spawnPoint = this.experience.world.spawnPoints?.[sceneName] || new THREE.Vector3(0, 10, 0);
            console.log(`[AcademicScene4A] Switching to ${sceneName} at position:`, spawnPoint);
            this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
        } else {
            console.error("[AcademicScene4A] World.switchSceneWithPosition not available, falling back to reload");
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            window.location.href = newUrl;
        }
    }

    update() {
        // Update NPC animations
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
        
        // TIDAK perlu update rotasi lagi - speech bubble sudah di-set rotation tetap menghadap ke depan
        // if (this.needsSpeechBubbleUpdate && this.speechBubbleGroup) {
        //     this.updateSpeechBubbleRotation();
        // }
    }

    dispose() {
        console.log("[AcademicScene4A] Disposing...");
        this.cleanupSpeechBubble();
        
        // Hapus tombol manual
        if (this.manualDialogButton) {
            this.manualDialogButton.remove();
            this.manualDialogButton = null;
        }
        
        // Hapus interaction zone
        if (this.npcInteractionZone) {
            this.scene.remove(this.npcInteractionZone);
            this.npcInteractionZone = null;
        }
        
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