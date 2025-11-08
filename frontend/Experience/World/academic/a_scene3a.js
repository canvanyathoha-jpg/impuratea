import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";
import SpeechAudioManager from "../../Utils/SpeechAudioManager.js";
import { languageManager } from "../../Utils/LanguageManager.js";

export default class AcademicScene3A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.speechAudioManager = new SpeechAudioManager();
        this.npcGender = 'female'; // NPC di scene 3a menggunakan model female
        this.npcGroupmate = null;
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

        console.log("Available resources in a_scene3a:", this.resources.items);
        this.scienceModel = this.resources.items.scienceRoom.scene;
        this.scienceModel.position.set(0, 0, 0);
        this.scienceModel.rotation.set(0, 0, 0);
        // Mengurangi scale dari 10 menjadi 3 untuk mengecilkan ruangan dan meja lebih proporsional
        this.scienceModel.scale.set(3, 3, 3);
        collidableGroup.add(this.scienceModel);

        // Add additional collision boxes for floor and walls to ensure no gaps
        this.createCollisionBoxes(collidableGroup);

        // Use science model itself for collision detection
        // The science room model should have built-in collision geometry
        this.collider = this.scienceModel;

        // Add the group to the scene
        this.scene.add(collidableGroup);
        
        // Build octree from the collidable group for physics
        this.octree.fromGraphNode(collidableGroup);

        // Setup camera collision using the science model
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[AcademicScene3A] Camera collision objects set using science room model");
        }

        console.log("Academic Scene 3A (Lab) loaded with full collision enabled.");
    }

    createCollisionBoxes(group) {
        // Create invisible collision boxes for floor and walls
        const collisionMaterial = new THREE.MeshBasicMaterial({ 
            visible: false, 
            transparent: true, 
            opacity: 0 
        });

        // Floor collision box - disesuaikan dengan scale baru (3x lebih kecil)
        // Ukuran floor dikurangi sesuai dengan scale 3 untuk proporsi yang lebih baik
        const floorGeometry = new THREE.BoxGeometry(60, 2, 60);
        const floorCollider = new THREE.Mesh(floorGeometry, collisionMaterial);
        floorCollider.position.set(0, -1, 0); // Slightly below ground level
        group.add(floorCollider);

        // Wall collision boxes (4 walls around the room) - disesuaikan dengan scale baru
        const wallGeometry = new THREE.BoxGeometry(2, 15, 60);
        
        // Left wall
        const leftWall = new THREE.Mesh(wallGeometry, collisionMaterial);
        leftWall.position.set(-30, 7.5, 0);
        group.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(wallGeometry, collisionMaterial);
        rightWall.position.set(30, 7.5, 0);
        group.add(rightWall);
        
        // Front wall
        const frontWallGeometry = new THREE.BoxGeometry(60, 15, 2);
        const frontWall = new THREE.Mesh(frontWallGeometry, collisionMaterial);
        frontWall.position.set(0, 7.5, 30);
        group.add(frontWall);
        
        // Back wall
        const backWall = new THREE.Mesh(frontWallGeometry, collisionMaterial);
        backWall.position.set(0, 7.5, -30);
        group.add(backWall);

        console.log("[AcademicScene3A] Additional collision boxes created for floor and walls");
    }

    createNPC() {
        console.log("[AcademicScene3A] Creating Groupmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene3A] Female avatar model not found!");
            return;
        }

        this.npcGroupmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcGroupmate.position.set(5, 0, 15); // Position in the lab - Y=0 for proper floor alignment
        this.npcGroupmate.rotation.y = Math.PI;
        this.npcGroupmate.scale.set(8.7, 8.7, 8.7);
        this.scene.add(this.npcGroupmate);

        this.npcAnimations = femaleModel.animations.map((clip) => clip.clone());
        this.npcMixer = new THREE.AnimationMixer(this.npcGroupmate);
        this.npcActions = {};

        const idleAnimation = this.npcAnimations.find(clip => clip.name === 'idle') || this.npcAnimations[1];
        this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);

        this.npcActions.idle.play();
        console.log("[AcademicScene3A] Groupmate NPC created.");
    }

    // Setup sistem interaksi manual: player harus klik NPC atau tombol untuk mulai dialog
    setupManualInteraction() {
        // Buat tombol manual yang selalu tersedia
        this.createManualDialogButton();
        
        // Tambahkan area interaksi di sekitar NPC yang bisa diklik
        this.createNPCInteractionZone();
        
        // Update raycast untuk deteksi klik pada NPC
        console.log("[AcademicScene3A] Manual interaction system ready. Player can click NPC or button to start dialog.");
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
        if (!this.npcGroupmate) return;
        
        // Buat sphere invisible yang lebih besar di sekitar NPC untuk area klik
        const interactionGeometry = new THREE.SphereGeometry(8, 16, 16);
        const interactionMaterial = new THREE.MeshBasicMaterial({ 
            visible: false, 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        this.npcInteractionZone = new THREE.Mesh(interactionGeometry, interactionMaterial);
        this.npcInteractionZone.position.copy(this.npcGroupmate.position);
        this.npcInteractionZone.position.y += 5; // Naikkan sedikit dari ground
        this.npcInteractionZone.userData.isNPC = true;
        
        // Tambahkan ke scene
        this.scene.add(this.npcInteractionZone);
        
        // Indikator visual dihilangkan sesuai permintaan user
        // this.createNPCIndicator();
        
        console.log("[AcademicScene3A] NPC interaction zone created at:", this.npcInteractionZone.position);
    }
    
    // Membuat indikator visual bahwa NPC bisa diklik
    createNPCIndicator() {
        if (!this.npcGroupmate) return;
        
        // Buat text sprite atau mesh sederhana di atas NPC
        const indicatorGeometry = new THREE.RingGeometry(3, 4, 16);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        this.npcIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.npcIndicator.position.copy(this.npcGroupmate.position);
        this.npcIndicator.position.y += 20; // Di atas kepala NPC
        this.npcIndicator.rotation.x = -Math.PI / 2; // Horizontal
        this.npcIndicator.userData.isIndicator = true;
        
        this.scene.add(this.npcIndicator);
        
        // Animasi rotasi pelan
        this.indicatorRotationSpeed = 0.005;
        
        console.log("[AcademicScene3A] NPC indicator created");
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
        if (this.npcGroupmate) objectsToCheck.push(this.npcGroupmate);
        if (this.npcInteractionZone) objectsToCheck.push(this.npcInteractionZone);
        
        const intersects = this.raycaster.intersectObjects(objectsToCheck, true);
        
        if (intersects.length > 0) {
            console.log("[AcademicScene3A] NPC clicked! Starting dialog...");
            this.startStory();
        }
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
        if (!this.storyStarted && (this.npcGroupmate || this.npcInteractionZone)) {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const objectsToCheck = [];
            if (this.npcGroupmate) objectsToCheck.push(this.npcGroupmate);
            if (this.npcInteractionZone) objectsToCheck.push(this.npcInteractionZone);
            
            const intersects = this.raycaster.intersectObjects(objectsToCheck, true);
            this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        }
    }

    startStory() {
        // Pastikan hanya dimulai sekali
        if (this.storyStarted) return;
        this.storyStarted = true;
        
        // Sembunyikan tombol manual
        if (this.manualDialogButton) {
            this.manualDialogButton.style.display = 'none';
        }
        
        // Hapus indikator NPC jika ada
        if (this.npcIndicator) {
            this.scene.remove(this.npcIndicator);
            this.npcIndicator = null;
        }
        
        // Hapus interaction zone (tidak perlu lagi setelah dialog dimulai)
        if (this.npcInteractionZone) {
            this.scene.remove(this.npcInteractionZone);
            this.npcInteractionZone = null;
        }
        
        console.log("[AcademicScene3A] Starting story dialog manually...");
        this.dialogManager.showDialog({ 
            text: {
                id: "Walau tugas makalah belum sepenuhnya selesai. Selanjutnya adalah ujian praktik biologi berkelompok. Kamu masuk ke laboratorium biologi yang dipenuhi mikroskop dan alat-alat percobaan.",
                en: "Even though the paper assignment isn't completely finished, next comes a group biology practical exam. You enter the biology laboratory filled with microscopes and experimental equipment."
            }, 
            onChoice: () => this.showDilemma1() 
        });
    }

    showDilemma1() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu (batin)",
                en: "You (inner thoughts)"
            }, 
            text: {
                id: "Sekarang harus praktik biologi juga. Kurasa tidak ada waktu istirahat buatku huh?",
                en: "Now I have to do the biology practical too. I guess there's no rest for me, huh?"
            }, 
            onChoice: () => this.showChoice1() 
        });
    }

    showChoice1() {
        const speaker = {
            id: "Teman Kelompok",
            en: "Groupmate"
        };
        const text = {
            id: "Eh, kamu mau ikutan praktik atau mau ngerjain tugas makalahmu? Soalnya kita butuh semua orang fokus nih.",
            en: "Hey, are you joining the practical or working on your paper? We need everyone to stay focused."
        };

        // JANGAN tampilkan showScreenSpeechBubble karena akan ada DialogManager dengan choices
        // Cleanup screen bubble jika ada, kemudian tampilkan DialogManager
        this.create3DSpeechBubble(speaker, text, false); // false = jangan tampilkan screen dialog
        
        // Cleanup screen bubble sebelum showDialog untuk memastikan tidak overlap
        setTimeout(() => {
            this.cleanupScreenSpeechBubble();
            this.dialogManager.showDialog({
                speaker: speaker,
                text: text,
                choices: [
                { 
                    text: {
                        id: "Mengerjakan tugas makalah Kimia dan numpang nama di kelompok biologi.",
                        en: "Work on the chemistry paper and just leave your name on the biology group project."
                    }, 
                    score: 10, 
                    path: 'makalah' 
                },
                { 
                    text: {
                        id: "Ikut andil dalam kelompok biologi dan bayar joki untuk tugas makalah Kimia.",
                        en: "Join the biology group and pay someone to finish the chemistry paper."
                    }, 
                    score: 5, 
                    path: 'biologi' 
                }
            ],
                    onChoice: (choice) => {
                        this.cleanupSpeechBubble();
                        this.handleFirstChoice(choice);
                    }
                });
            }, 350); // Delay sedikit untuk memastikan cleanup terjadi
    }

    handleFirstChoice(choice) {
        if (!choice) {
            console.warn("[AcademicScene3A] Choice timer expired, defaulting to lower-risk branch without scoring.");
            this.showBiologiPath();
            return;
        }

        if (choice.path === 'makalah') {
            this.showMakalahPath();
        }
        else {
            this.showBiologiPath();
        }
    }

    showMakalahPath() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu memutuskan untuk duduk di pojok lab sambil mengerjakan makalah kimia. Teman-teman kelompokmu melakukan praktik sendiri. Mereka sesekali melirikmu dengan tatapan tidak puas.",
                en: "You decide to sit in the corner of the lab while working on your chemistry paper. Your groupmates do the practical on their own. They occasionally glance at you with disapproving looks."
            }, 
            onChoice: () => this.showLeakInfo() 
        });
    }

    showBiologiPath() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu memutuskan ikut praktik biologi. Untuk makalah kimia, kamu diam-diam kontak kakak kelas yang terkenal menerima joki tugas dengan bayaran.",
                en: "You decide to join the biology practical. For the chemistry paper, you secretly contact an upperclassman known for taking paid assignment requests."
            }, 
            onChoice: () => this.showLeakInfo() 
        });
    }

    showLeakInfo() {
        const speaker = {
            id: "Teman Kelompok",
            en: "Groupmate"
        };
        const text = {
            id: "Eh, aku dapat info dari kakak kelas! Soal praktik biologi kita ini SAMA persis dengan tahun lalu! Kita bisa minta bocoran jawaban dari kakak kelas!",
            en: "Hey, I got info from an upperclassman! The biology practical questions are EXACTLY the same as last year! We can ask that upperclassman for the leaked answers!"
        };

        // JANGAN tampilkan showScreenSpeechBubble karena akan ada DialogManager
        this.create3DSpeechBubble(speaker, text, false);
        
        setTimeout(() => {
            this.cleanupScreenSpeechBubble();
            this.dialogManager.showDialog({
                speaker: speaker,
                text: text,
                onChoice: () => {
                    this.cleanupSpeechBubble();
                    this.showLeakProposal();
                }
            });
        }, 350);
    }

    showLeakProposal() {
        const speaker = {
            id: "Teman Kelompok",
            en: "Groupmate"
        };
        const text = {
            id: "Kamu kan kenal sama kakak kelas itu kan? Minta tolong dong! Kalau kita pakai bocoran, praktik kita pasti sempurna!",
            en: "You know that upperclassman, right? Please ask them! If we use the leaked answers, our practical will be perfect!"
        };

        // JANGAN tampilkan showScreenSpeechBubble karena akan ada DialogManager
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
            text: {
                id: "Kelompokmu memandangmu dengan penuh harap. Mereka menunggu keputusanmu...",
                en: "Your group looks at you with hope. They're waiting for your decision..."
            },
            choices: [
                { 
                    text: {
                        id: "Menolak meminta bocoran. Teman sekelompok marah dan mencoret namamu dari kelompok. Kamu harus praktik sendiri.",
                        en: "Refuse to ask for the leaked answers. Your groupmates get angry and remove your name from the group. You must do the practical alone."
                    }, 
                    score: 0, 
                    nextScene: 'a_scene4a' 
                },
                { 
                    text: {
                        id: "Meminta bocoran kepada kakak kelas. Praktik kalian berjalan sempurna.",
                        en: "Ask the upperclassman for the leaked answers. Your practical goes perfectly."
                    }, 
                    score: 25, 
                    nextScene: 'a_scene4b' 
                }
            ],
            sublimentMessage: {
                id: "Integritas sering membuatmu sendirian, sementara janji manis jalan pintas hanya berakhir dengan kekecewaan — dan di situlah benih korupsi tumbuh.",
                en: "Integrity often leaves you standing alone, while the sweet promises of shortcuts only end in disappointment — that's where the seeds of corruption grow."
            },
            onChoice: (choice) => this.handleMainChoice(choice)
        });
    }

    handleMainChoice(choice) {
        if (!choice) {
            console.warn("[AcademicScene3A] Choice timer expired, keeping integrity path without modifying score.");
            this.showRefusePath();
            return;
        }

        if (choice.score === 0) {
            this.showRefusePath();
        } else {
            this.showAcceptPath();
        }
    }

    showRefusePath() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu",
                en: "You"
            }, 
            text: {
                id: "Maaf, aku tidak bisa melakukan itu. Itu tidak jujur.",
                en: "Sorry, I can't do that. It's not honest."
            }, 
            onChoice: () => this.showRefuseResult() 
        });
    }

    showRefuseResult() {
        const speaker = {
            id: "Teman Kelompok",
            en: "Groupmate"
        };
        const text = {
            id: "Serius?! Kamu terlalu idealis! Ya udah, kalau gitu namamu kami coret aja dari kelompok. Kerjain sendiri praktikmu!",
            en: "Seriously?! You're too idealistic! Fine, then we'll just remove your name from the group. Do your practical alone!"
        };

        // JANGAN tampilkan showScreenSpeechBubble karena akan ada DialogManager
        this.create3DSpeechBubble(speaker, text, false);
        
        setTimeout(() => {
            this.cleanupScreenSpeechBubble();
            this.dialogManager.showDialog({
                speaker: speaker,
                text: text,
                onChoice: () => {
                    this.cleanupSpeechBubble();
                    this.showRefuseConsequence();
                }
            });
        }, 350);
    }

    showRefuseConsequence() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu harus mengerjakan praktik biologi sendirian. Tanpa bantuan kelompok, hasilnya tidak maksimal. Tapi setidaknya kamu bisa tidur nyenyak malam itu, tanpa beban kebohongan.",
                en: "You have to do the biology practical alone. Without their help, the result isn't optimal. But at least you can sleep soundly that night, without the burden of lies."
            }, 
            onChoice: () => this.transitionToNextScene('a_scene4a') 
        });
    }

    showAcceptPath() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu",
                en: "You"
            }, 
            text: {
                id: "Oke... aku akan coba minta.",
                en: "Okay... I'll try asking."
            }, 
            onChoice: () => this.showAcceptResult() 
        });
    }

    showAcceptResult() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu menghubungi kakak kelas. Dia mengirimkan semua jawaban praktik tahun lalu. Kelompokmu sangat senang. Praktik berjalan mulus, semua jawaban benar. Kalian mendapat nilai A.",
                en: "You contact the upperclassman. They send all the answers from last year's practical. Your group is thrilled. The practical runs smoothly; every answer is correct. You get an A."
            }, 
            onChoice: () => this.showAcceptConsequence() 
        });
    }

    showAcceptConsequence() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Teman-temanmu merayakan kesuksesan ini. Tapi kamu merasa ada yang salah. Ini bukan hasil kerja kalian. Ini hanya... menyontek.",
                en: "Your friends celebrate this success. But you feel something is wrong. This isn't your work. This is just... cheating."
            }, 
            onChoice: () => this.transitionToNextScene('a_scene4b') 
        });
    }

    // --- Speech Bubble Logic ---

    create3DSpeechBubble(speaker, text, showScreenDialog = true) {
        // showScreenDialog: apakah harus menampilkan screen dialog otomatis
        // false jika akan ada DialogManager.showDialog yang dipanggil setelahnya
        this.cleanupSpeechBubble();
        // Translate speaker and text
        const translatedSpeaker = languageManager.translate(speaker);
        const translatedText = languageManager.translate(text);
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
        
        this.createSpeechTextTexture(translatedSpeaker, translatedText);

        const npcPosition = this.npcGroupmate.position.clone();
        this.speechBubbleGroup.position.set(npcPosition.x, npcPosition.y + 15, npcPosition.z);
        this.speechBubbleGroup.rotation.y = Math.PI; 

        this.scene.add(this.speechBubbleGroup);
        // Dialog muncul otomatis HANYA jika showScreenDialog = true
        // Jika false, biarkan DialogManager yang menampilkan (untuk avoid overlap dengan choices)
        if (showScreenDialog) {
            setTimeout(() => {
                this.showScreenSpeechBubble(translatedSpeaker, translatedText);
            }, 300);
        }
        
        // Play speech audio menggunakan Web Speech API dengan voice sesuai gender NPC
        if (this.speechAudioManager && this.speechAudioManager.isSupported) {
            const fullText = `${translatedSpeaker}: ${translatedText}`;
            this.speechAudioManager.speak(fullText, {
                gender: this.npcGender, // Gunakan gender NPC yang sesuai
                rate: 0.95,
                pitch: 1.0,
                volume: 0.85
            });
        }
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

    // onMouseMove dan onMouseClick sudah di-override di setupManualInteraction()

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
        
        // Hide dialog first
        this.dialogManager.hideAll();
        this.cleanupSpeechBubble();
        
        // Use World's switchSceneWithPosition to show loading bar
        if (this.experience.world && this.experience.world.switchSceneWithPosition) {
            const spawnPoint = this.experience.world.spawnPoints?.[sceneName] || new THREE.Vector3(0, 10, 0);
            console.log(`[AcademicScene3A] Switching to ${sceneName} at position:`, spawnPoint);
            this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
        } else {
            console.error("[AcademicScene3A] World.switchSceneWithPosition not available, falling back to reload");
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            window.location.href = newUrl;
        }
    }

    update() {
        // Update NPC animations
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
        
        // Update indicator rotation (animasi berputar) - dihilangkan karena indicator tidak digunakan
        // if (this.npcIndicator && !this.storyStarted) {
        //     this.npcIndicator.rotation.z += this.indicatorRotationSpeed;
        // }
    }

    dispose() {
        console.log("[AcademicScene3A] Disposing...");
        this.cleanupSpeechBubble();
        
        // Hapus tombol manual
        if (this.manualDialogButton) {
            this.manualDialogButton.remove();
            this.manualDialogButton = null;
        }
        
        // Hapus indikator dan interaction zone
        if (this.npcIndicator) {
            this.scene.remove(this.npcIndicator);
            this.npcIndicator = null;
        }
        if (this.npcInteractionZone) {
            this.scene.remove(this.npcInteractionZone);
            this.npcInteractionZone = null;
        }
        
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