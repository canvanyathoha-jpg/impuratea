import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene3A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);

        this.setWorld();
        
        setTimeout(() => {
            this.startStory();
        }, 1000);
    }

    setWorld() {
        const collidableGroup = new THREE.Group();

        // Load science room model for lab scene
        this.scienceModel = this.resources.items.scienceRoom.scene;
        this.scienceModel.position.set(0, 0, 0);
        this.scienceModel.rotation.set(0, 0, 0);
        this.scienceModel.scale.set(10, 10, 10);
        collidableGroup.add(this.scienceModel);

        // Collider
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

        console.log("Academic Scene 3A (Lab) loaded");
    }

    startStory() {
        this.dialogManager.showDialog({
            text: "Tugas makalah kimia belum selesai, tapi kamu sudah dihadapkan dengan ujian praktik biologi berkelompok. Kamu masuk ke laboratorium biologi yang dipenuhi mikroskop dan alat-alat percobaan.",
            onChoice: () => {
                this.showDilemma1();
            }
        });
    }

    showDilemma1() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Tugas makalah kimia ku belum selesai, sekarang harus praktik biologi juga. Kalau aku fokus ke yang mana ya?",
            onChoice: () => {
                this.showChoice1();
            }
        });
    }

    showChoice1() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Eh, kamu mau ikutan praktik atau mau ngerjain tugas makalahmu? Soalnya kita butuh semua orang fokus nih.",
            choices: [
                {
                    text: "Mengerjakan tugas makalah Kimia dan numpang nama di kelompok biologi.",
                    score: 10,
                    path: 'makalah'
                },
                {
                    text: "Ikut andil dalam kelompok biologi dan bayar joki untuk tugas makalah Kimia.",
                    score: 5,
                    path: 'biologi'
                }
            ],
            onChoice: (choice) => {
                this.handleFirstChoice(choice);
            }
        });
    }

    handleFirstChoice(choice) {
        if (choice.path === 'makalah') {
            this.showMakalahPath();
        } else {
            this.showBiologiPath();
        }
    }

    showMakalahPath() {
        this.dialogManager.showDialog({
            text: "Kamu memutuskan untuk duduk di pojok lab sambil mengerjakan makalah kimia. Teman-teman kelompokmu melakukan praktik sendiri. Mereka sesekali melirikmu dengan tatapan tidak puas.",
            onChoice: () => {
                this.showLeakInfo();
            }
        });
    }

    showBiologiPath() {
        this.dialogManager.showDialog({
            text: "Kamu memutuskan ikut praktik biologi. Untuk makalah kimia, kamu diam-diam kontak kakak kelas yang terkenal menerima joki tugas dengan bayaran.",
            onChoice: () => {
                this.showLeakInfo();
            }
        });
    }

    showLeakInfo() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Eh, aku dapat info dari kakak kelas! Soal praktik biologi kita ini SAMA persis dengan tahun lalu! Kita bisa minta bocoran jawaban dari kakak kelas!",
            onChoice: () => {
                this.showLeakProposal();
            }
        });
    }

    showLeakProposal() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Kamu kan kenal sama kakak kelas itu kan? Minta tolong dong! Kalau kita pakai bocoran, praktik kita pasti sempurna!",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Kelompokmu memandangmu dengan penuh harap. Mereka menunggu keputusanmu...",
            choices: [
                {
                    text: "Menolak meminta bocoran. Teman sekelompok marah dan mencoret namamu dari kelompok. Kamu harus praktik sendiri.",
                    score: 0,
                    nextScene: 'a_scene4a'
                },
                {
                    text: "Meminta bocoran kepada kakak kelas. Praktik kalian berjalan sempurna.",
                    score: 25,
                    nextScene: 'a_scene4a'
                }
            ],
            sublimentMessage: "Integritas sering membuatmu sendirian, sementara janji manis jalan pintas hanya berakhir dengan kekecewaan — dan di situlah benih korupsi tumbuh.",
            onChoice: (choice) => {
                this.handleMainChoice(choice);
            }
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
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Maaf, aku tidak bisa melakukan itu. Itu tidak jujur.",
            onChoice: () => {
                this.showRefuseResult();
            }
        });
    }

    showRefuseResult() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Serius?! Kamu terlalu idealis! Ya udah, kalau gitu namamu kami coret aja dari kelompok. Kerjain sendiri praktikmu!",
            onChoice: () => {
                this.showRefuseConsequence();
            }
        });
    }

    showRefuseConsequence() {
        this.dialogManager.showDialog({
            text: "Kamu harus mengerjakan praktik biologi sendirian. Tanpa bantuan kelompok, hasilnya tidak maksimal. Tapi setidaknya kamu bisa tidur nyenyak malam itu, tanpa beban kebohongan.",
            onChoice: () => {
                this.transitionToNextScene('a_scene4a');
            }
        });
    }

    showAcceptPath() {
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Oke... aku akan coba minta.",
            onChoice: () => {
                this.showAcceptResult();
            }
        });
    }

    showAcceptResult() {
        this.dialogManager.showDialog({
            text: "Kamu menghubungi kakak kelas. Dia mengirimkan semua jawaban praktik tahun lalu. Kelompokmu sangat senang. Praktik berjalan mulus, semua jawaban benar. Kalian mendapat nilai A.",
            onChoice: () => {
                this.showAcceptConsequence();
            }
        });
    }

    showAcceptConsequence() {
        this.dialogManager.showDialog({
            text: "Teman-temanmu merayakan kesuksesan ini. Tapi kamu merasa ada yang salah. Ini bukan hasil kerja kalian. Ini hanya... menyontek.",
            onChoice: () => {
                this.transitionToNextScene('a_scene4a');
            }
        });
    }

    transitionToNextScene(sceneName) {
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('scene', sceneName);
        window.history.pushState({}, '', url);
        console.log(`URL updated to: ${url.toString()}`);

        console.log(`[AcademicScene3A] Transitioning to ${sceneName}...`);
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

        setTimeout(() => fadeDiv.style.opacity = '1', 10);

        setTimeout(() => {
            this.dialogManager.hideAll();
            
            if (this.experience.world && this.experience.world.switchSceneWithPosition) {
                const spawnPoint = new THREE.Vector3(0, 10, 0);
                this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
                
                setTimeout(() => {
                    fadeDiv.style.opacity = '0';
                    setTimeout(() => fadeDiv.remove(), 500);
                }, 1000);
            }
        }, 500);
    }

    update() {}

    dispose() {
        console.log("[AcademicScene3A] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.scienceModel && this.scienceModel.parent) {
            this.scene.remove(this.scienceModel.parent);
        }
    }
}