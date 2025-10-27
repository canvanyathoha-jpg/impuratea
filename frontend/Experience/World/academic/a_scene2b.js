import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene2B {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager();

        this.setWorld();
        
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

    startStory() {
        this.dialogManager.showDialog({
            text: "Beberapa hari setelah ujian... Kamu menerima hasilnya.",
            onChoice: () => {
                this.showResult();
            }
        });
    }

    showResult() {
        this.dialogManager.showDialog({
            text: "Nilai ujianmu: 60. Orang tuamu kecewa dan memang menyita HP-mu untuk sementara. Tapi kamu merasa lega karena mengerjakan dengan jujur. Kamu punya waktu lebih banyak untuk belajar tanpa distraksi HP.",
            onChoice: () => {
                this.showMotivation();
            }
        });
    }

    showMotivation() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Memang awalnya berat, tapi aku merasa lebih tenang. Aku harus lebih giat belajar supaya nilai berikutnya lebih baik!",
            onChoice: () => {
                this.showNewAssignment();
            }
        });
    }

    showNewAssignment() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Hari ini saya akan memberi tugas kelompok. Kalian harus membuat makalah 10 halaman tentang reaksi kimia. Dikerjakan berpasangan dengan teman sebangku. Deadline seminggu lagi!",
            onChoice: () => {
                this.showEagerness();
            }
        });
    }

    showEagerness() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Ini kesempatan untuk membuktikan bahwa aku bisa! Aku harus mendapat nilai terbaik untuk tugas ini!",
            onChoice: () => {
                this.showOverwork();
            }
        });
    }

    showOverwork() {
        this.dialogManager.showDialog({
            text: "Pada hari pertama tugas diberikan, kamu langsung begadang untuk mengerjakan makalah sendirian. Kamu ingin membuktikan kesungguhanmu. Tapi tubuhmu tidak kuat... Keesokan harinya kamu jatuh sakit dan tidak bisa masuk sekolah selama 3 hari.",
            onChoice: () => {
                this.showPanic();
            }
        });
    }

    showPanic() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Sehari lagi deadline! Tapi makalahnya baru setengah jadi... Aku harus bagaimana?!",
            onChoice: () => {
                this.showFriendOffer();
            }
        });
    }

    showFriendOffer() {
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku (via chat)",
            text: "Eh, aku dengar kamu sakit. Makalah kita gimana? Aku liat kamu udah bikin setengah. Mau gampang? Pake AI aja buat selesain sisanya. Cepet kok!",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Kamu dalam dilema besar. Waktu tinggal satu hari, kamu masih lemah karena baru sembuh, dan makalahnya baru setengah...",
            choices: [
                {
                    text: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena kondisi badan masih lemah.",
                    score: 0,
                    nextScene: 'a_scene3a'
                },
                {
                    text: "Menggunakan AI untuk menyelesaikan setengahnya lagi. Hasilnya bagus dan bisa istirahat.",
                    score: 20,
                    nextScene: 'a_scene3b'
                }
            ],
            sublimentMessage: "Ketika nilai jadi segalanya, integritas perlahan digadaikan.",
            onChoice: (choice) => {
                this.handleChoice(choice);
            }
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
        this.dialogManager.showDialog({
            text: "Kamu memaksakan diri untuk begadang lagi meski badan masih lemah. Dengan mata berair dan kepala pusing, kamu menyelesaikan makalah. Hasilnya tidak semaksimal yang kamu inginkan, tapi ini hasil kerja kerasmu sendiri.",
            onChoice: () => {
                this.showPathAResult();
            }
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Makalah kalian... cukup baik. Ada beberapa bagian yang kurang detail, tapi saya bisa lihat usaha kalian. Nilai: 75. Pertahankan semangat ini!",
            onChoice: () => {
                this.transitionToNextScene('a_scene3a');
            }
        });
    }

    showPathB() {
        this.dialogManager.showDialog({
            text: "Kamu membuka AI dan menyalin separuh makalah yang sudah kamu buat, lalu meminta AI melengkapi sisanya. Dalam 1 jam, makalah selesai dengan rapi. Kamu bisa istirahat dan memulihkan kondisi.",
            onChoice: () => {
                this.showPathBResult();
            }
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Excellent! Makalah kalian sangat lengkap dan terstruktur dengan baik! Ini salah satu yang terbaik di kelas. Nilai: 95!",
            onChoice: () => {
                this.showPathBConflict();
            }
        });
    }

    showPathBConflict() {
        this.dialogManager.showDialog({
            text: "Kamu seharusnya senang, tapi ada perasaan hampa. Separuh dari makalah itu bukan hasil kerjamu. Apakah ini yang dimaksud dengan 'sukses'?",
            onChoice: () => {
                this.transitionToNextScene('a_scene3b');
            }
        });
    }

    transitionToNextScene(sceneName) {
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
        console.log("[AcademicScene2B] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
    }
}