import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene4A {
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

        // Back to classroom
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

    startStory() {
        this.dialogManager.showDialog({
            text: "Lanjutan dari ujian praktik biologi adalah presentasi individu. Setiap siswa harus mempresentasikan hasil praktiknya di depan kelas.",
            onChoice: () => {
                this.showDoubt();
            }
        });
    }

    showDoubt() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Aku ragu dengan hasil praktik ku... Nilainya pasti tidak bagus. Apa aku harus minta bantuan kakak kelas lagi ya? Dia punya materi lengkap dari tahun lalu...",
            onChoice: () => {
                this.showRemembrance();
            }
        });
    }

    showRemembrance() {
        this.dialogManager.showDialog({
            text: "Kamu teringat kakak kelas yang pernah kamu hubungi untuk bocoran. Dia sempat bilang masih punya materi presentasi lengkap. Kamu menghubunginya...",
            onChoice: () => {
                this.showSeniorResponse();
            }
        });
    }

    showSeniorResponse() {
        this.dialogManager.showDialog({
            speaker: "Kakak Kelas (via chat)",
            text: "Oh iya, aku masih punya materi presentasinya. Lengkap sama slide PowerPoint-nya. Tapi... ini gak gratis ya. Transfer 50rb dulu, baru aku kasih materinya.",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Ini keputusan terakhir dalam pelajaran semester ini. Pilihanmu akan menentukan akhir cerita...",
            choices: [
                {
                    text: "Menolak dan mengerjakan semampunya. Presentasi gagal dan nilainya jelek.",
                    score: 0,
                    ending: true
                },
                {
                    text: "Membeli materi seharga 50rb. Presentasi berjalan lancar dengan nilai bagus.",
                    score: 25,
                    ending: true
                }
            ],
            sublimentMessage: "Kejujuran mungkin membuatmu tampak gagal, tapi kebohongan yang dibeli akan selalu terbongkar pada waktunya.",
            onChoice: (choice) => {
                this.handleChoice(choice);
            }
        });
    }

    handleChoice(choice) {
        if (choice.score === 0) {
            this.showRefusePath();
        } else {
            this.showBuyPath();
        }
    }

    showRefusePath() {
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Tidak, terima kasih. Aku akan kerjakan sendiri.",
            onChoice: () => {
                this.showRefuseResult();
            }
        });
    }

    showRefuseResult() {
        this.dialogManager.showDialog({
            text: "Kamu mempresentasikan hasil praktikmu dengan kemampuan terbatas. Beberapa pertanyaan dari guru tidak bisa kamu jawab dengan baik. Nilaimu: 65. Tidak sempurna, tapi ini hasil kerja kerasmu sendiri.",
            onChoice: () => {
                this.showEnding();
            }
        });
    }

    showBuyPath() {
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Oke, aku transfer sekarang.",
            onChoice: () => {
                this.showBuyResult();
            }
        });
    }

    showBuyResult() {
        this.dialogManager.showDialog({
            text: "Kamu menerima materi lengkap dari kakak kelas. Kamu mempelajarinya semalam dan presentasi berjalan sangat lancar. Guru terkesan. Nilaimu: 90. Tapi uang jajanmu habis, dan perasaan bersalah semakin menumpuk.",
            onChoice: () => {
                this.showEnding();
            }
        });
    }

    showEnding() {
        console.log("[AcademicScene4A] Showing ending...");
        
        // Hide dialog and show ending screen
        this.dialogManager.hideAll();
        
        setTimeout(() => {
            this.dialogManager.showEnding();
        }, 1000);
    }

    update() {}

    dispose() {
        console.log("[AcademicScene4A] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
    }
}