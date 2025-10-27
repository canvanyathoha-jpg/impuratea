import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene3B {
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

        // Lab scene
        this.scienceModel = this.resources.items.scienceRoom.scene;
        this.scienceModel.position.set(0, 0, 0);
        this.scienceModel.rotation.set(0, 0, 0);
        this.scienceModel.scale.set(10, 10, 10);
        collidableGroup.add(this.scienceModel);

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

        console.log("Academic Scene 3B (Lab) loaded");
    }

    startStory() {
        this.dialogManager.showDialog({
            text: "Hari presentasi makalah kimia...",
            onChoice: () => {
                this.showBusted();
            }
        });
    }

    showBusted() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Setelah saya periksa lebih detail, makalah kalian ini... terlalu sempurna. Gaya bahasanya sama sekali tidak seperti tulisan kalian biasanya. Ini hasil AI kan?",
            onChoice: () => {
                this.showEmbarrassment();
            }
        });
    }

    showEmbarrassment() {
        this.dialogManager.showDialog({
            text: "Guru mempermalukan kalian di depan kelas. Semua mata tertuju padamu. Teman sebangkumu menyalahkanmu karena ide menggunakan AI datang darimu (setidaknya menurutnya).",
            onChoice: () => {
                this.showConsequence();
            }
        });
    }

    showConsequence() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Nilai makalah kalian saya batalkan. Kalian harus mengerjakan ulang dengan pengawasan saya. Dan saya akan melaporkan ini ke wali kelas kalian.",
            onChoice: () => {
                this.showReputation();
            }
        });
    }

    showReputation() {
        this.dialogManager.showDialog({
            text: "Berita cepat menyebar di kelas. Teman-temanmu mulai meragukan integritasmu. Ada yang membela, ada yang menghakimi. Suasana menjadi canggung.",
            onChoice: () => {
                this.showBiologyLab();
            }
        });
    }

    showBiologyLab() {
        this.dialogManager.showDialog({
            text: "Beberapa hari kemudian, ujian praktik biologi berkelompok dimulai. Kamu masuk lab dengan perasaan malu. Teman-teman kelompokmu menatapmu dengan ragu.",
            onChoice: () => {
                this.showFirstChoice();
            }
        });
    }

    showFirstChoice() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Jadi... kamu mau ikut bantu atau gimana? Soalnya... ya, kamu tau lah situasinya.",
            choices: [
                {
                    text: "Bertanya bagian mana yang bisa dikerjakan. Hasilnya percobaan gagal karena memecahkan fokus teman.",
                    score: 0,
                    path: 'try_help'
                },
                {
                    text: "Diam saja dan tidak membantu apa-apa.",
                    score: 25,
                    path: 'silent'
                }
            ],
            onChoice: (choice) => {
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
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Aku mau bantu. Kasih tau aku bagian mana yang bisa aku kerjakan.",
            onChoice: () => {
                this.showTryHelpResult();
            }
        });
    }

    showTryHelpResult() {
        this.dialogManager.showDialog({
            text: "Teman-temanmu ragu tapi memberimu bagian kecil. Karena kamu tidak familiar dengan alat lab, kamu malah membuat percobaan gagal. Teman-temanmu semakin kesal.",
            onChoice: () => {
                this.showLeakOffer();
            }
        });
    }

    showSilentPath() {
        this.dialogManager.showDialog({
            text: "Kamu memutuskan diam saja, duduk di pojok lab. Teman-temanmu mengerjakan praktik sendiri, sesekali menyindir: \"Enak ya cuma duduk doang, tapi dapat nilai kelompok.\"",
            onChoice: () => {
                this.showLeakOffer();
            }
        });
    }

    showLeakOffer() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Dari pada kamu diam aja atau malah bikin masalah... lebih baik kamu bantu dengan cara lain. Kamu kan kenal kakak kelas? Minta bocoran soal praktik dari dia. Dia kan udah pernah praktik ini tahun lalu!",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Ini kesempatanmu untuk 'menebus kesalahan' di mata teman-temanmu. Tapi apakah dengan cara yang salah lagi?",
            choices: [
                {
                    text: "Menolak. Teman sekelompok mencoret namamu dari kelompok. Kamu harus praktik sendiri.",
                    score: 0,
                    nextScene: 'a_scene4b'
                },
                {
                    text: "Meminta bocoran kepada kakak kelas untuk mendapat kepercayaan kelompok kembali.",
                    score: 25,
                    nextScene: 'a_scene4b'
                }
            ],
            sublimentMessage: "Menolak kecurangan memang menyakitkan, namun jalan pintas selalu membuka kedok korupsi.",
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
            text: "Aku tidak akan melakukan itu lagi. Aku sudah pernah salah, aku tidak mau mengulanginya.",
            onChoice: () => {
                this.showRefuseResult();
            }
        });
    }

    showRefuseResult() {
        this.dialogManager.showDialog({
            speaker: "Teman Kelompok",
            text: "Ya udah terserah kamu! Tapi jangan harap kamu dapat nilai dari kelompok kami. Namamu kami coret!",
            onChoice: () => {
                this.showRefuseConsequence();
            }
        });
    }

    showRefuseConsequence() {
        this.dialogManager.showDialog({
            text: "Kamu terpaksa mengerjakan praktik sendiri dengan hasil yang kurang maksimal. Tapi kali ini, kamu merasa lebih baik. Setidaknya kamu tidak menambah kesalahan.",
            onChoice: () => {
                this.transitionToNextScene('a_scene4b');
            }
        });
    }

    showAcceptPath() {
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Baiklah... aku akan coba minta.",
            onChoice: () => {
                this.showAcceptResult();
            }
        });
    }

    showAcceptResult() {
        this.dialogManager.showDialog({
            text: "Kamu menghubungi kakak kelas dan mendapat bocoran jawaban. Teman-teman kelompokmu senang dan praktik berjalan sempurna. Mereka mulai 'memaafkan' kesalahanmu sebelumnya.",
            onChoice: () => {
                this.showAcceptConsequence();
            }
        });
    }

    showAcceptConsequence() {
        this.dialogManager.showDialog({
            text: "Tapi di dalam hati, kamu tahu... kamu hanya menambah daftar kebohongan. Kapan ini akan berhenti?",
            onChoice: () => {
                this.transitionToNextScene('a_scene4b');
            }
        });
    }

    transitionToNextScene(sceneName) {
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('scene', sceneName);
        window.history.pushState({}, '', url);
        console.log(`URL updated to: ${url.toString()}`);

        console.log(`[AcademicScene3B] Transitioning to ${sceneName}...`);
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
        console.log("[AcademicScene3B] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.scienceModel && this.scienceModel.parent) {
            this.scene.remove(this.scienceModel.parent);
        }
    }
}