import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene4B {
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

        console.log("Academic Scene 4B (Presentation) loaded");
    }

    startStory() {
        this.dialogManager.showDialog({
            text: "Lanjutan dari ujian praktik biologi adalah presentasi individu. Kamu yang menjadi alasan nilai praktik kelompokmu jelek merasa sangat bersalah dan malu.",
            onChoice: () => {
                this.showGuilt();
            }
        });
    }

    showGuilt() {
        this.dialogManager.showDialog({
            speaker: "Kamu (batin)",
            text: "Aku merasa sangat bersalah... Teman-teman kelompok pasti menyalahkan aku. Aku tidak berani minta mereka untuk ajari materinya...",
            onChoice: () => {
                this.showDesperation();
            }
        });
    }

    showDesperation() {
        this.dialogManager.showDialog({
            text: "Kamu merasa putus asa. Tidak ada yang mau membantumu. Tapi kemudian kamu teringat kakak kelas yang pernah kamu hubungi untuk bocoran soal. Dia bilang punya materi lengkap untuk presentasi.",
            onChoice: () => {
                this.showContact();
            }
        });
    }

    showContact() {
        this.dialogManager.showDialog({
            speaker: "Kakak Kelas (via chat)",
            text: "Iya aku masih punya materi presentasi lengkap dari tahun lalu. Slide PowerPoint, catatan, semuanya ada. Tapi harganya 50rb ya. Mau?",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Ini momen terakhir. Pilihanmu akan menentukan ending dari perjalanan semester ini...",
            choices: [
                {
                    text: "Menolak dan mengerjakan semampunya meski tanpa persiapan baik. Presentasi gagal.",
                    score: 0,
                    ending: true
                },
                {
                    text: "Membeli materi seharga 50rb. Presentasi berjalan lancar.",
                    score: 25,
                    ending: true
                }
            ],
            sublimentMessage: "Rasa malu karena jujur hanya sebentar, tapi korupsi kecil menukar harga diri dengan malu yang lebih besar.",
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
            text: "Tidak, aku sudah terlalu sering berbuat curang. Kali ini aku akan hadapi konsekuensinya.",
            onChoice: () => {
                this.showRefuseResult();
            }
        });
    }

    showRefuseResult() {
        this.dialogManager.showDialog({
            text: "Kamu presentasi dengan persiapan seadanya. Gugup, terbata-bata, dan banyak pertanyaan yang tidak bisa kamu jawab. Nilaimu: 60. Guru melihat kesungguhanmu untuk berubah, meski hasilnya tidak maksimal.",
            onChoice: () => {
                this.showRefuseEpilogue();
            }
        });
    }

    showRefuseEpilogue() {
        this.dialogManager.showDialog({
            speaker: "Guru",
            text: "Saya tahu kamu mengalami masa sulit semester ini. Tapi saya menghargai bahwa kamu akhirnya memilih untuk jujur. Tetap pertahankan itu.",
            onChoice: () => {
                this.showEnding();
            }
        });
    }

    showBuyPath() {
        this.dialogManager.showDialog({
            speaker: "Kamu",
            text: "Oke, aku butuh ini. Aku transfer sekarang.",
            onChoice: () => {
                this.showBuyResult();
            }
        });
    }

    showBuyResult() {
        this.dialogManager.showDialog({
            text: "Kamu membeli materi dan mempelajarinya semalam. Presentasi berjalan sempurna. Guru memuji. Teman-teman terkesan. Nilaimu: 92. Tapi ada perasaan kosong di hati...",
            onChoice: () => {
                this.showBuyEpilogue();
            }
        });
    }

    showBuyEpilogue() {
        this.dialogManager.showDialog({
            text: "Uang jajanmu habis. Daftar kebohonganmu bertambah. Dan pertanyaan besar menghantuimu: \"Sampai kapan aku akan terus seperti ini?\"",
            onChoice: () => {
                this.showEnding();
            }
        });
    }

    showEnding() {
        console.log("[AcademicScene4B] Showing ending...");
        
        this.dialogManager.hideAll();
        
        setTimeout(() => {
            this.dialogManager.showEnding();
        }, 1000);
    }

    update() {}

    dispose() {
        console.log("[AcademicScene4B] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
    }
}