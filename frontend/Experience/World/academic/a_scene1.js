import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene1 {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        // Initialize dialog manager
        this.dialogManager = new DialogManager();

        this.setWorld();
        this.createPortals();
        
        // Start story after a short delay
        setTimeout(() => {
            this.startStory();
        }, 1000);
    }

    setWorld() {
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the class model (Kelas-C.glb)
        this.classModel = this.resources.items.class.scene;
        this.classModel.position.set(0, 0, 0);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10);
        collidableGroup.add(this.classModel);

        // Setup collider for physics
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(10, 10, 10);

        // Make collider invisible
        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
        collidableGroup.add(this.collider);

        // Add the group to the scene
        this.scene.add(collidableGroup);

        // Build the octree
        this.octree.fromGraphNode(collidableGroup);

        // Set collision objects for camera
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[AcademicScene1] Camera collision objects set");
        }

        console.log("Academic Scene 1 (Class) loaded with full collision enabled.");
    }

    createPortals() {
        // No portals in scene 1 - story-driven progression only
        console.log("[AcademicScene1] No portals in this scene - story mode");
    }

    startStory() {
        console.log("[AcademicScene1] Starting story sequence...");

        // Introduction
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
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku",
            text: "Eh, kayaknya kamu belum siap ya? Tenang aja, nanti aku kasih contekan. Dijamin nilaimu bagus!",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku",
            text: "Nih, nanti pas ujian kamu tinggal lihat kertas jawaban ku. Udah deh, pasti aman. Gak ada yang tau kok!",
            choices: [
                {
                    text: "Menolak contekan dan mengerjakan sendiri. Risikonya nilaimu jelek dan HP disita orang tua.",
                    score: 0,
                    nextScene: 'a_scene2b' // Path jujur → Scene 2B
                },
                {
                    text: "Menerima contekan. Nilaimu bagus dan tidak ketahuan oleh guru.",
                    score: 20,
                    nextScene: 'a_scene2a' // Path curang → Scene 2A
                }
            ],
            sublimentMessage: "Jalan pintas sering terlihat mudah, tapi setiap langkah meninggalkan jejak.",
            onChoice: (choice) => {
                this.handleChoice(choice);
            }
        });
    }

    handleChoice(choice) {
        console.log("[AcademicScene1] Player choice:", choice);

        if (choice.nextScene === 'a_scene2b') {
            // Path A: Menolak
            this.showPathA();
        } else {
            // Path B: Menerima
            this.showPathB();
        }
    }

    showPathA() {
        this.dialogManager.showDialog({
            text: "Kamu menolak tawaran temanmu dengan sopan. \"Terima kasih, tapi aku mau coba kerjakan sendiri.\" Temanmu tampak sedikit kesal tetapi tidak memaksa lagi.",
            onChoice: () => {
                this.showPathAResult();
            }
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({
            text: "Ujian dimulai. Kamu mengerjakan soal-soal dengan kemampuan terbaikmu, meskipun tidak yakin dengan banyak jawabanmu. Beberapa hari kemudian, nilaimu keluar: 60. Cukup untuk lulus, tapi orang tuamu kecewa.",
            onChoice: () => {
                this.transitionToNextScene('a_scene2b');
            }
        });
    }

    showPathB() {
        this.dialogManager.showDialog({
            text: "Kamu menerima tawaran temanmu. \"Oke deh, terima kasih ya...\" Saat ujian berlangsung, kamu beberapa kali melirik jawaban temanmu. Guru tidak menyadari apa-apa.",
            onChoice: () => {
                this.showPathBResult();
            }
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({
            text: "Beberapa hari kemudian, nilaimu keluar: 85! Orang tuamu sangat bangga. Kamu merasa lega... tapi ada perasaan tidak enak di hatimu.",
            onChoice: () => {
                this.transitionToNextScene('a_scene2a');
            }
        });
    }

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene1] Transitioning to ${sceneName}...`);
        
        // Fade effect
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.5s;
        `;
        document.body.appendChild(fadeDiv);

        setTimeout(() => {
            fadeDiv.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            // Hide dialog before switching
            this.dialogManager.hideAll();
            
            // Switch scene
            if (this.experience.world && this.experience.world.switchSceneWithPosition) {
                const spawnPoint = new THREE.Vector3(0, 10, 0);
                this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
                
                // Remove fade after scene loads
                setTimeout(() => {
                    fadeDiv.style.opacity = '0';
                    setTimeout(() => fadeDiv.remove(), 500);
                }, 1000);
            }
        }, 500);
    }

    update() {
        // No portal updates needed in scene 1
    }

    dispose() {
        console.log("[AcademicScene1] Disposing Academic Scene 1...");

        // Hide dialogs
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }

        // Remove models from scene
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }

        console.log("[AcademicScene1] Academic Scene 1 disposed");
    }
}