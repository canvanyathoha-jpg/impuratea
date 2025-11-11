import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";
import SpeechAudioManager from "../../Utils/SpeechAudioManager.js";
import { languageManager } from "../../Utils/LanguageManager.js";

export default class AcademicScene2A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.speechAudioManager = new SpeechAudioManager();
        this.npcGender = 'female'; // NPC di scene 2a menggunakan model female
        this.npcDeskmate = null;
        this.speechBubbleGroup = null;
        this.teacherNPC = null;
        this.teacherMixer = null;
        this.teacherActions = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Show loading indicator and load scene asynchronously
        this.initWithPreloader();
    }

    initWithPreloader() {
        console.log("[AcademicScene2A] Loading scene in background first...");
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load scene models asynchronously (non-blocking)
        this.loadSceneAsync().then(() => {
            console.log("[AcademicScene2A] Scene loaded successfully!");
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            // Start story after scene is loaded
            setTimeout(() => {
                this.startStory();
            }, 1000);
        }).catch((error) => {
            console.error("[AcademicScene2A] Error loading scene:", error);
            this.hideLoadingIndicator();
        });
    }

    setWorld() {
        const collidableGroup = new THREE.Group();

        console.log("Available resources in a_scene2a:", this.resources.items);
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

        // Safely clone animations - check if animations array exists
        this.npcAnimations = (femaleModel.animations && Array.isArray(femaleModel.animations)) 
            ? femaleModel.animations.map((clip) => clip.clone()) 
            : [];
        
        console.log("[AcademicScene2A] Available animations:", this.npcAnimations.length);
        console.log("[AcademicScene2A] Animation names:", this.npcAnimations.map(clip => clip.name));
        
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        // Safely setup animations - only create clipActions for animations that exist
        const idleClip = this.npcAnimations.find(clip => clip && clip.name && clip.name.toLowerCase().includes('idle')) 
            || this.npcAnimations.find(clip => clip && clip.name) 
            || (this.npcAnimations.length > 0 ? this.npcAnimations[0] : null);
        
        if (idleClip) {
            try {
                this.npcActions.idle = this.npcMixer.clipAction(idleClip);
                console.log("[AcademicScene2A] Idle animation created:", idleClip.name);
                this.npcActions.idle.play();
            } catch (error) {
                console.warn("[AcademicScene2A] Failed to create/play idle animation:", error);
            }
        } else {
            console.warn("[AcademicScene2A] No idle animation found, NPC will be static");
        }

        console.log("[AcademicScene2A] Deskmate NPC created.");
    }

    // Membuat model 3D guru yang akan muncul saat menegur siswa
    createTeacherNPC() {
        console.log("[AcademicScene2A] Creating Teacher (Guru) NPC...");
        console.log("[AcademicScene2A] Available resources:", Object.keys(this.resources.items));
        
        const guruModel = this.resources.items.guru;
        if (!guruModel) {
            console.error("[AcademicScene2A] Guru model not found in resources!");
            console.error("[AcademicScene2A] Available items:", this.resources.items);
            return;
        }

        console.log("[AcademicScene2A] Guru model found:", guruModel);
        console.log("[AcademicScene2A] Guru model scene:", guruModel.scene);
        console.log("[AcademicScene2A] Guru model scene children:", guruModel.scene.children.length);

        // Clone model guru untuk digunakan di scene
        // Gunakan SkeletonUtils.clone seperti NPC lainnya untuk memastikan skeleton dan materials ter-copy dengan benar
        this.teacherNPC = SkeletonUtils.clone(guruModel.scene);
        
        // Log struktur model setelah clone
        console.log("[AcademicScene2A] Teacher NPC cloned, children count:", this.teacherNPC.children.length);
        let meshCount = 0;
        this.teacherNPC.traverse((child) => {
            console.log("[AcademicScene2A] Child:", child.type, child.name || 'unnamed', "visible:", child.visible);
            if (child.isMesh) {
                meshCount++;
                console.log("[AcademicScene2A] Mesh found:", child.name, "material:", child.material ? "exists" : "missing");
            }
        });
        console.log("[AcademicScene2A] Total meshes:", meshCount);
        
        // Position guru di depan kelas (menghadap ke siswa)
        // Posisi di depan kelas, menghadap ke arah siswa
        // Y position disesuaikan dengan ground level (sama dengan NPC lainnya yang menggunakan 1.5)
        this.teacherNPC.position.set(0, 1.5, 25);
        this.teacherNPC.rotation.y = Math.PI; // Rotate 180 derajat untuk menghadap ke kelas
        this.teacherNPC.scale.set(10, 10, 10); // Scale sama dengan NPC lainnya
        this.teacherNPC.visible = false; // Hidden by default, akan muncul saat dialog "STOP!" muncul
        
        // Pastikan semua children juga INVISIBLE (tidak visible) sampai saatnya muncul
        this.teacherNPC.traverse((child) => {
            child.visible = false; // Set semua children juga invisible
        });
        
        this.scene.add(this.teacherNPC);
        
        console.log("[AcademicScene2A] Teacher NPC added to scene");
        console.log("[AcademicScene2A] Position:", this.teacherNPC.position);
        console.log("[AcademicScene2A] Scale:", this.teacherNPC.scale);
        console.log("[AcademicScene2A] Visible:", this.teacherNPC.visible);
        console.log("[AcademicScene2A] In scene:", this.scene.children.includes(this.teacherNPC));

        // Setup animations jika ada - safely handle animations
        this.teacherAnimations = (guruModel.animations && Array.isArray(guruModel.animations)) 
            ? guruModel.animations.map((clip) => clip.clone()) 
            : [];
        console.log("[AcademicScene2A] Teacher animations count:", this.teacherAnimations.length);
        console.log("[AcademicScene2A] Teacher animation names:", this.teacherAnimations.map(clip => clip.name));
        this.teacherMixer = new THREE.AnimationMixer(this.teacherNPC);
        this.teacherActions = {};

        // JANGAN play animasi idle karena kita akan set pose marah secara manual
        // Pose marah akan di-set dengan rotasi bones langsung

        // HAPUS pose - biarkan model murni tanpa pose
        // this.setTeacherAngryPose();

        console.log("[AcademicScene2A] Teacher (Guru) NPC created successfully.");
    }

    // Fungsi untuk mengatur pose marah/menegur dengan rotasi bones
    setTeacherAngryPose() {
        if (!this.teacherNPC) {
            console.error("[AcademicScene2A] teacherNPC is null!");
            return;
        }

        console.log("[AcademicScene2A] Setting angry/scolding pose for teacher...");

        // Traverse semua mesh untuk menemukan skinned mesh dengan skeleton
        this.teacherNPC.traverse((child) => {
            if (child.isSkinnedMesh && child.skeleton) {
                const bones = child.skeleton.bones;
                
                // Log semua bones dengan detail untuk debugging
                console.log("[AcademicScene2A] ===== ALL BONES =====");
                bones.forEach((bone, index) => {
                    console.log(`[${index}] ${bone.name} (type: ${bone.type})`);
                });
                console.log("[AcademicScene2A] ====================");
                
                // Helper function untuk mencari bone berdasarkan nama exact atau pattern
                // Prioritas: exact match > pattern dengan "right"/"left" > pattern generic
                const findBone = (exactNames, patterns) => {
                    // Cari exact match terlebih dahulu
                    if (exactNames && exactNames.length > 0) {
                        for (const exactName of exactNames) {
                            const found = bones.find(b => b.name === exactName);
                            if (found) return found;
                        }
                    }
                    
                    // Jika tidak ditemukan, cari dengan pattern
                    if (patterns && patterns.length > 0) {
                        for (const pattern of patterns) {
                            const found = bones.find(b => {
                                const name = b.name.toLowerCase();
                                if (typeof pattern === 'string') {
                                    return name.includes(pattern);
                                } else if (pattern instanceof RegExp) {
                                    return pattern.test(name);
                                }
                                return false;
                            });
                            if (found) return found;
                        }
                    }
                    return null;
                };
                
                // Cari bones dengan nama exact terlebih dahulu (berdasarkan log console)
                // Tangan kanan (hand) - RightHand_49
                const rightHand = findBone(
                    ['RightHand_49'],
                    [/^righthand/i, /hand.*right/i, /right.*hand/i]
                );
                
                // Lengan kanan (upper arm) - RightArm_51
                const rightUpperArm = findBone(
                    ['RightArm_51'],
                    [/^rightarm/i, /arm.*right/i, /right.*arm/i, /upper.*arm.*right/i]
                );
                
                // Lengan bawah kanan (forearm) - RightForeArm_50
                const rightForearm = findBone(
                    ['RightForeArm_50'],
                    [/^rightforearm/i, /forearm.*right/i, /right.*forearm/i]
                );
                
                // Bahu kanan - RightShoulder_52
                const rightShoulder = findBone(
                    ['RightShoulder_52'],
                    [/^rightshoulder/i, /shoulder.*right/i, /right.*shoulder/i]
                );
                
                // Tangan kiri - LeftHand_25
                const leftHand = findBone(
                    ['LeftHand_25'],
                    [/^lefthand/i, /hand.*left/i, /left.*hand/i]
                );
                
                // Lengan kiri - LeftArm_27
                const leftUpperArm = findBone(
                    ['LeftArm_27'],
                    [/^leftarm/i, /arm.*left/i, /left.*arm/i, /upper.*arm.*left/i]
                );
                
                // Kepala - Head_3
                const head = findBone(
                    ['Head_3'],
                    [/^head_3$/i, /^head$/i]
                );
                
                // Spine - Spine_55, Spine1_54, atau Spine2_53
                const spine = findBone(
                    ['Spine_55', 'Spine1_54', 'Spine2_53'],
                    [/^spine/i]
                );
                
                // Cari semua spine bones untuk efek condong yang lebih natural
                const spine1 = bones.find(b => b.name === 'Spine1_54');
                const spine2 = bones.find(b => b.name === 'Spine2_53');
                
                console.log("[AcademicScene2A] Found bones:");
                console.log("  Right Hand:", rightHand?.name || "NOT FOUND");
                console.log("  Right Upper Arm:", rightUpperArm?.name || "NOT FOUND");
                console.log("  Right Forearm:", rightForearm?.name || "NOT FOUND");
                console.log("  Right Shoulder:", rightShoulder?.name || "NOT FOUND");
                console.log("  Left Hand:", leftHand?.name || "NOT FOUND");
                console.log("  Left Upper Arm:", leftUpperArm?.name || "NOT FOUND");
                console.log("  Head:", head?.name || "NOT FOUND");
                console.log("  Spine:", spine?.name || "NOT FOUND");
                console.log("  Spine1:", spine1?.name || "NOT FOUND");
                console.log("  Spine2:", spine2?.name || "NOT FOUND");
                
                // Apply rotations - gunakan local rotation jika tersedia
                if (rightHand) {
                    rightHand.rotation.x = THREE.MathUtils.degToRad(-10);
                    rightHand.rotation.y = THREE.MathUtils.degToRad(5);
                    rightHand.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated right hand: ${rightHand.name}`);
                }
                
                if (rightForearm) {
                    rightForearm.rotation.x = THREE.MathUtils.degToRad(-30);
                    rightForearm.rotation.y = THREE.MathUtils.degToRad(0);
                    rightForearm.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated right forearm: ${rightForearm.name}`);
                }
                
                if (rightUpperArm) {
                    rightUpperArm.rotation.x = THREE.MathUtils.degToRad(-45);
                    rightUpperArm.rotation.y = THREE.MathUtils.degToRad(0);
                    rightUpperArm.rotation.z = THREE.MathUtils.degToRad(10);
                    console.log(`[AcademicScene2A] ✓ Rotated right upper arm: ${rightUpperArm.name}`);
                }
                
                if (rightShoulder) {
                    rightShoulder.rotation.x = THREE.MathUtils.degToRad(-10);
                    rightShoulder.rotation.y = THREE.MathUtils.degToRad(0);
                    rightShoulder.rotation.z = THREE.MathUtils.degToRad(5);
                    console.log(`[AcademicScene2A] ✓ Rotated right shoulder: ${rightShoulder.name}`);
                }
                
                if (leftHand) {
                    leftHand.rotation.x = THREE.MathUtils.degToRad(0);
                    leftHand.rotation.y = THREE.MathUtils.degToRad(0);
                    leftHand.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated left hand: ${leftHand.name}`);
                }
                
                if (leftUpperArm) {
                    leftUpperArm.rotation.x = THREE.MathUtils.degToRad(0);
                    leftUpperArm.rotation.y = THREE.MathUtils.degToRad(0);
                    leftUpperArm.rotation.z = THREE.MathUtils.degToRad(-5);
                    console.log(`[AcademicScene2A] ✓ Rotated left upper arm: ${leftUpperArm.name}`);
                }
                
                if (head) {
                    head.rotation.x = THREE.MathUtils.degToRad(0);
                    head.rotation.y = THREE.MathUtils.degToRad(0);
                    head.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated head: ${head.name}`);
                }
                
                if (spine) {
                    spine.rotation.x = THREE.MathUtils.degToRad(-5);
                    spine.rotation.y = THREE.MathUtils.degToRad(0);
                    spine.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated spine: ${spine.name}`);
                }
                
                // Rotasi spine1 dan spine2 untuk efek condong yang lebih natural
                if (spine1) {
                    spine1.rotation.x = THREE.MathUtils.degToRad(-3);
                    spine1.rotation.y = THREE.MathUtils.degToRad(0);
                    spine1.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated spine1: ${spine1.name}`);
                }
                
                if (spine2) {
                    spine2.rotation.x = THREE.MathUtils.degToRad(-5);
                    spine2.rotation.y = THREE.MathUtils.degToRad(0);
                    spine2.rotation.z = THREE.MathUtils.degToRad(0);
                    console.log(`[AcademicScene2A] ✓ Rotated spine2: ${spine2.name}`);
                }
                
                // Update skeleton matrix untuk apply changes
                child.skeleton.update();
                
                // Force update matrix world
                this.teacherNPC.updateMatrixWorld(true);
            }
        });
        
        console.log("[AcademicScene2A] Teacher angry/scolding pose set.");
    }

    startStory() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Beberapa hari setelah ujian... Situasi berubah drastis.",
                en: "A few days after the exam... The situation changed drastically."
            }, 
            onChoice: () => setTimeout(() => this.showIncident(), 50) 
        });
    }

    showIncident() {
        // Tampilkan dialog DULU, baru munculkan model setelah dialog muncul
        console.log("[AcademicScene2A] showIncident called");
        
        // Tampilkan dialog terlebih dahulu
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru",
                en: "Teacher"
            }, 
            text: {
                id: "STOP! Saya melihat kamu dan temanmu! Kalian mencontek! Ini sangat mengecewakan!",
                en: "STOP! I saw you and your friend! You were cheating! This is very disappointing!"
            }, 
            onChoice: () => setTimeout(() => this.showConsequence(), 50) 
        });
        
        // Munculkan model 3D guru SETELAH dialog muncul (delay kecil untuk memastikan dialog sudah ter-render)
        // Delay 100ms untuk memastikan dialog sudah muncul di layar
        setTimeout(() => {
            console.log("[AcademicScene2A] Making teacher NPC visible...");
            console.log("[AcademicScene2A] teacherNPC exists:", !!this.teacherNPC);
            
            if (this.teacherNPC) {
                this.teacherNPC.visible = true;
                // Pastikan semua children juga visible
                this.teacherNPC.traverse((child) => {
                    child.visible = true;
                });
                
                console.log("[AcademicScene2A] Teacher NPC is now visible");
                console.log("[AcademicScene2A] Teacher NPC position:", this.teacherNPC.position);
                console.log("[AcademicScene2A] Teacher NPC scale:", this.teacherNPC.scale);
                console.log("[AcademicScene2A] Teacher NPC in scene:", this.scene.children.includes(this.teacherNPC));
            } else {
                console.error("[AcademicScene2A] Teacher NPC is null!");
            }
        }, 100);
    }

    showConsequence() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Ternyata ada siswa lain yang melaporkan bahwa kalian mencontek. Guru mencoret nilai ujian kalian berdua. Temanmu yang memberikan contekan dipanggil ke BK dan mendapat surat peringatan.",
                en: "It turns out another student reported that you were cheating. The teacher crossed out both of your exam scores. Your friend who provided the cheat sheet was called to the guidance counselor and received a warning letter."
            }, 
            onChoice: () => this.showFriendReaction() 
        });
    }

    showFriendReaction() {
        const speaker = {
            id: "Teman Sebangku",
            en: "Deskmate"
        };
        const text = {
            id: "Ini semua gara-gara kamu! Harusnya kamu lebih hati-hati! Sekarang aku kena masalah juga! Aku gak mau ngomong sama kamu lagi!",
            en: "This is all your fault! You should have been more careful! Now I'm in trouble too! I don't want to talk to you anymore!"
        };
        this.create3DSpeechBubble(speaker, text, () => this.showIsolation());
    }

    showIsolation() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Sejak kejadian itu, teman sebangkumu menjauhi kamu. Kalian sekarang dalam situasi yang sangat canggung. Dan yang lebih buruk, kalian harus mengerjakan tugas makalah biologi bersama...",
                en: "Since that incident, your deskmate has been avoiding you. You are now in a very awkward situation. And worse, you have to work on a biology paper assignment together..."
            }, 
            onChoice: () => setTimeout(() => this.showAssignment(), 50) 
        });
    }

    showAssignment() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Baik semuanya, kalian harus membuat makalah 10 halaman tentang topik biologi. Dikerjakan berpasangan. Deadline-nya seminggu lagi!",
                en: "Alright everyone, you must create a 10-page paper on a biology topic. Work in pairs. The deadline is in one week!"
            }, 
            onChoice: () => setTimeout(() => this.showDilemma(), 50) 
        });
    }

    showDilemma() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu dan teman sebangkumu yang masih marah sama kamu ternyata satu kelompok. Kalian tidak punya waktu untuk berdiskusi karena dia menolak berbicara denganmu. Sehari sebelum pengumpulan, kamu memaksa untuk bertemu.",
                en: "You and your deskmate who is still angry with you are in the same group. You don't have time to discuss because they refuse to talk to you. One day before submission, you force a meeting."
            }, 
            onChoice: () => this.showFriendSuggestion() 
        });
    }

    showFriendSuggestion() {
        const speaker = {
            id: "Teman Sebangku",
            en: "Deskmate"
        };
        const text = {
            id: "Dengar, aku gak punya waktu buat urusan ini. Pake AI aja buat bikin makalahnya. Cepat dan gampang. Selesai!",
            en: "Listen, I don't have time for this. Just use AI to make the paper. Fast and easy. Done!"
        };
        this.create3DSpeechBubble(speaker, text, () => this.showMainChoice());
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: {
                id: "Kamu harus memutuskan. Waktu tinggal satu hari lagi...",
                en: "You must decide. Only one day left..."
            },
            choices: [
                { 
                    text: {
                        id: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena terburu-buru dan kelelahan.",
                        en: "Work alone through the night without sleep. The result isn't good because you're rushing and exhausted."
                    }, 
                    score: 0, 
                    nextScene: 'a_scene3a' 
                },
                { 
                    text: {
                        id: "Menggunakan AI untuk membuat makalah. Hasilnya bagus dan selesai cepat.",
                        en: "Use an AI tool to create the paper. The result looks great and it's finished quickly."
                    }, 
                    score: 20, 
                    nextScene: 'a_scene3b' 
                }
            ],
            sublimentMessage: {
                id: "Korupsi sering dimulai dari rasa putus asa mencari jalan mudah.",
                en: "Corruption often starts with desperation for an easy way out."
            },
            onChoice: (choice) => this.handleChoice(choice)
        });
    }

    handleChoice(choice) {
        if (!choice) {
            console.warn("[AcademicScene2A] Choice timer expired, moving to honest branch without altering score.");
            this.showPathA();
            return;
        }

        if (choice.nextScene === 'a_scene3a') {
            this.showPathA();
        } else {
            this.showPathB();
        }
    }

    showPathA() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu memutuskan untuk mengerjakan sendiri. Semalam suntuk kamu begadang, mengetik dengan mata yang hampir terpejam. Paginya, kamu selesai... tapi makalahnya terlihat berantakan dan penuh kesalahan.",
                en: "You decide to work alone. You stay up all night, typing with eyes barely open. By morning you're done, but the paper looks messy and full of errors."
            }, 
            onChoice: () => this.showPathAResult() 
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Hmm... your paper isn't very neat and has some conceptual errors. But I appreciate your effort. Score: 70.",
                en: "Hmm... your paper isn't very neat and has some conceptual errors. But I appreciate your effort. Score: 70."
            }, 
            onChoice: () => this.transitionToNextScene('a_scene3a') 
        });
    }

    showPathB() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu membuka AI dan mengetikkan topik makalah. Dalam 30 menit, makalah 10 halaman siap. Kamu edit sedikit agar terlihat natural. Besoknya kamu kumpulkan dengan percaya diri.",
                en: "You open an AI tool and type in the paper topic. In 30 minutes, a 10-page paper is ready. You edit it a bit to make it look natural. The next day you submit it confidently."
            }, 
            onChoice: () => this.showPathBResult() 
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Wow, your paper is excellent! Neat, complete, and in-depth. This is a perfect example! Score: 95!",
                en: "Wow, your paper is excellent! Neat, complete, and in-depth. This is a perfect example! Score: 95!"
            }, 
            onChoice: () => this.showPathBTwist() 
        });
    }

    showPathBTwist() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu merasa lega... untuk sementara. Tapi perasaan bersalah mulai menumpuk. Dan yang tidak kamu sadari, guru mulai curiga karena gaya penulisan makalahmu sangat berbeda dari tulisan biasamu...",
                en: "You feel relieved... temporarily. But guilt starts to build up. What you don't notice is that the teacher starts to suspect you because this paper's writing style is very different from your usual work..."
            }, 
            onChoice: () => this.transitionToNextScene('a_scene3b') 
        });
    }

    // --- Speech Bubble Logic (Copied and adapted) ---

    create3DSpeechBubble(speaker, text, callback) {
        this.cleanupSpeechBubble();
        // Translate speaker and text
        const translatedSpeaker = languageManager.translate(speaker);
        const translatedText = languageManager.translate(text);
        this.speechBubbleGroup = new THREE.Group();
        this.speechBubbleGroup.userData = { speaker: translatedSpeaker, text: translatedText, callback };

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

        const npcPosition = this.npcDeskmate.position.clone();
        // Position speech bubble to the left side of NPC, slightly above eye level
        // Offset left by 6 units to avoid overlapping with NPC
        this.speechBubbleGroup.position.set(npcPosition.x - 6, npcPosition.y + 15, npcPosition.z);
        
        // Rotate bubble to face the player
        // Use lookAt method to make bubble always face towards player position (0, 0, 0)
        const playerPos = new THREE.Vector3(0, 10, 0);
        this.speechBubbleGroup.lookAt(playerPos);

        this.scene.add(this.speechBubbleGroup);
        // Dialog muncul otomatis tanpa perlu klik tombol "Baca Percakapan"
        // Panggil langsung showScreenSpeechBubble setelah speech bubble dibuat
        setTimeout(() => {
            this.showScreenSpeechBubble(translatedSpeaker, translatedText, callback);
        }, 300); // Delay kecil untuk animasi yang smooth
        
        // Play speech audio menggunakan Web Speech API dengan voice sesuai gender NPC
        if (this.speechAudioManager && this.speechAudioManager.isSupported) {
            const fullText = `${translatedSpeaker}: ${translatedText}`;
            // Jangan set pitch/rate secara eksplisit - biarkan SpeechAudioManager set otomatis berdasarkan gender
            this.speechAudioManager.speak(fullText, {
                gender: this.npcGender, // Gunakan gender NPC yang sesuai (female untuk scene 2a)
                // Pitch dan rate akan otomatis di-set berdasarkan gender
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
        if (!this.speechBubbleGroup) return;
        
        // Check if camera is available before using raycaster
        if (!this.experience || !this.experience.camera || !this.experience.camera.instance) {
            return; // Camera not ready yet, skip raycasting
        }
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        try {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
            this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        } catch (error) {
            console.warn("[AcademicScene2A] Error setting raycaster from camera:", error);
        }
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) return;
        
        // Check if camera is available before using raycaster
        if (!this.experience || !this.experience.camera || !this.experience.camera.instance) {
            return; // Camera not ready yet, skip raycasting
        }
        
        try {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
            if (intersects.length > 0) {
                const dialogData = this.speechBubbleGroup.userData;
                this.showScreenSpeechBubble(dialogData.speaker, dialogData.text, dialogData.callback);
            }
        } catch (error) {
            console.warn("[AcademicScene2A] Error setting raycaster from camera:", error);
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
        
        // TIDAK PERLU BACKDROP GELAP - Dialog muncul jelas tanpa overlay
        // Hapus backdrop untuk visibility yang lebih baik
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%); border: 3px solid #1976d2;
            padding: 30px 40px; border-radius: 20px; z-index: 10002; max-width: 700px; width: 85%;
            cursor: pointer; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25); animation: slideUp 0.4s ease;
            font-family: 'Segoe UI', Arial, sans-serif;
            backdrop-filter: blur(10px);
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
                this.cleanupSpeechBubble();
                if (callback) callback();
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

    showLoadingIndicator() {
        const existingLoader = document.getElementById('scene-loading-indicator');
        if (existingLoader) {
            existingLoader.remove();
        }

        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.id = 'scene-loading-indicator';
        this.loadingIndicator.style.pointerEvents = 'none';
        this.loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                border: 3px solid rgba(255, 215, 0, 0.8);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                z-index: 10000001;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                pointer-events: none;
            ">
                <div style="
                    color: #FFD700;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Gilroy', Arial, sans-serif;
                ">
                    Memuat Scene...
                </div>
                <div style="
                    width: 300px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 0 auto;
                ">
                    <div id="loading-progress-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #1E407C, #8B0000, #FFD700);
                        border-radius: 10px;
                        transition: width 0.3s ease;
                        animation: pulse 1.5s ease-in-out infinite;
                    "></div>
                </div>
                <div style="
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    margin-top: 15px;
                    font-family: 'Gilroy', Arial, sans-serif;
                ">
                    Mohon tunggu sebentar...
                </div>
            </div>
        `;
        
        if (!document.getElementById('scene-loading-pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'scene-loading-pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(this.loadingIndicator);
    }

    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.opacity = '0';
            this.loadingIndicator.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (this.loadingIndicator && document.body.contains(this.loadingIndicator)) {
                    this.loadingIndicator.remove();
                }
                this.loadingIndicator = null;
            }, 500);
        }
    }

    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    async loadSceneAsync() {
        return new Promise((resolve, reject) => {
            try {
                this.updateLoadingProgress(20);
                this.setWorld();
                this.updateLoadingProgress(40);
                this.createNPC();
                this.updateLoadingProgress(60);
                
                setTimeout(() => {
                    this.createTeacherNPC();
                    this.updateLoadingProgress(80);
                    this.ensurePlayerSpawned();
                    this.updateLoadingProgress(100);
                    resolve();
                }, 500);
            } catch (error) {
                console.error("[AcademicScene2A] Error in loadSceneAsync:", error);
                reject(error);
            }
        });
    }

    ensurePlayerSpawned() {
        if (this.experience.world && this.experience.world.player) {
            const spawnPoint = this.experience.world.spawnPoints?.a_scene2a || new THREE.Vector3(0, 10, 0);
            console.log("[AcademicScene2A] Setting player spawn point to:", spawnPoint);
            this.experience.world.player.setSpawnPoint(spawnPoint);
        }
    }

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene2A] Loading scene: ${sceneName}`);
        
        // Hide dialog first
        this.dialogManager.hideAll();
        this.cleanupSpeechBubble();
        
        // Use World's switchSceneWithPosition to show loading bar
        if (this.experience.world && this.experience.world.switchSceneWithPosition) {
            const spawnPoint = this.experience.world.spawnPoints?.[sceneName] || new THREE.Vector3(0, 10, 0);
            console.log(`[AcademicScene2A] Switching to ${sceneName} at position:`, spawnPoint);
            this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
        } else {
            console.error("[AcademicScene2A] World.switchSceneWithPosition not available, falling back to reload");
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            window.location.href = newUrl;
        }
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
        // Update teacher mixer jika ada animasi
        if (this.teacherMixer) {
            this.teacherMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene2A] Disposing...");
        this.cleanupSpeechBubble();
        
        // Clean up loading indicator
        if (this.loadingIndicator) {
            this.hideLoadingIndicator();
        }
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        if (this.dialogManager) this.dialogManager.hideAll();
        if (this.classModel && this.classModel.parent) this.scene.remove(this.classModel.parent);
        if (this.npcDeskmate) this.scene.remove(this.npcDeskmate);
        if (this.npcMixer) this.npcMixer.stopAllAction();
        if (this.teacherNPC) this.scene.remove(this.teacherNPC);
        if (this.teacherMixer) this.teacherMixer.stopAllAction();
    }
}