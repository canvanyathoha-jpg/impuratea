import Experience from "../../Experience.js";
import * as THREE from "three";
import DialogManager from "../../Utils/DialogManager.js";

export default class AcademicScene2A {
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

        // Load the class model
        this.classModel = this.resources.items.class.scene;
        this.classModel.position.set(0, 0, 0);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10);
        collidableGroup.add(this.classModel);

        // Setup collider
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

    startStory() {
        this.dialogManager.showDialog({
            text: "Beberapa hari setelah ujian... Situasi berubah drastis.",
            onChoice: () => {
                this.showIncident();
            }
        });
    }

    showIncident() {
        this.dialogManager.showDialog({
            speaker: "Guru",
            text: "STOP! Saya melihat kamu dan temanmu! Kalian mencontek! Ini sangat mengecewakan!",
            onChoice: () => {
                this.showConsequence();
            }
        });
    }

    showConsequence() {
        this.dialogManager.showDialog({
            text: "Ternyata ada siswa lain yang melaporkan bahwa kalian mencontek. Guru mencoret nilai ujian kalian berdua. Temanmu yang memberikan contekan dipanggil ke BK dan mendapat surat peringatan.",
            onChoice: () => {
                this.showFriendReaction();
            }
        });
    }

    showFriendReaction() {
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku",
            text: "Ini semua gara-gara kamu! Harusnya kamu lebih hati-hati! Sekarang aku kena masalah juga! Aku gak mau ngomong sama kamu lagi!",
            onChoice: () => {
                this.showIsolation();
            }
        });
    }

    showIsolation() {
        this.dialogManager.showDialog({
            text: "Sejak kejadian itu, teman sebangkumu menjauhi kamu. Kalian sekarang dalam situasi yang sangat canggung. Dan yang lebih buruk, kalian harus mengerjakan tugas makalah kimia bersama...",
            onChoice: () => {
                this.showAssignment();
            }
        });
    }

    showAssignment() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Baik semuanya, kalian harus membuat makalah 10 halaman tentang reaksi kimia. Dikerjakan berpasangan. Deadline-nya seminggu lagi!",
            onChoice: () => {
                this.showDilemma();
            }
        });
    }

    showDilemma() {
        this.dialogManager.showDialog({
            text: "Kamu dan teman sebangkumu yang masih marah sama kamu ternyata satu kelompok. Kalian tidak punya waktu untuk berdiskusi karena dia menolak berbicara denganmu. Sehari sebelum pengumpulan, kamu memaksa untuk bertemu.",
            onChoice: () => {
                this.showFriendSuggestion();
            }
        });
    }

    showFriendSuggestion() {
        this.dialogManager.showDialog({
            speaker: "Teman Sebangku",
            text: "Dengar, aku gak punya waktu buat urusan ini. Pake AI aja buat bikin makalahnya. Cepat dan gampang. Selesai!",
            onChoice: () => {
                this.showMainChoice();
            }
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: "Kamu harus memutuskan. Waktu tinggal satu hari lagi...",
            choices: [
                {
                    text: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena terburu-buru dan kelelahan.",
                    score: 0,
                    nextScene: 'a_scene3a'
                },
                {
                    text: "Menggunakan AI untuk membuat makalah. Hasilnya bagus dan selesai cepat.",
                    score: 20,
                    nextScene: 'a_scene3b'
                }
            ],
            sublimentMessage: "Korupsi sering dimulai dari rasa putus asa mencari jalan mudah.",
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
            text: "Kamu memutuskan untuk mengerjakan sendiri. Semalam suntuk kamu begadang, mengetik dengan mata yang hampir terpejam. Paginya, kamu selesai... tapi makalahnya terlihat berantakan dan penuh kesalahan.",
            onChoice: () => {
                this.showPathAResult();
            }
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Hmm... makalah kalian kurang rapi dan ada beberapa kesalahan konsep. Tapi saya menghargai usaha kalian. Nilai: 70.",
            onChoice: () => {
                this.transitionToNextScene('a_scene3a');
            }
        });
    }

    showPathB() {
        this.dialogManager.showDialog({
            text: "Kamu membuka AI dan mengetikkan topik makalah. Dalam 30 menit, makalah 10 halaman siap. Kamu edit sedikit agar terlihat natural. Besoknya kamu kumpulkan dengan percaya diri.",
            onChoice: () => {
                this.showPathBResult();
            }
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({
            speaker: "Guru Kimia",
            text: "Wow, makalah kalian sangat bagus! Rapi, lengkap, dan mendalam. Ini contoh yang sempurna! Nilai: 95!",
            onChoice: () => {
                this.showPathBTwist();
            }
        });
    }

    showPathBTwist() {
        this.dialogManager.showDialog({
            text: "Kamu merasa lega... untuk sementara. Tapi perasaan bersalah mulai menumpuk. Dan yang tidak kamu sadari, guru mulai curiga karena gaya penulisan makalahmu sangat berbeda dari tulisan biasamu...",
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
                const spawnPoint = sceneName === 'a_scene3a' 
                    ? new THREE.Vector3(0, 10, 0) // Class for 3A
                    : new THREE.Vector3(0, 10, 0); // Science room for 3B (will load science room model)
                
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
        console.log("[AcademicScene2A] Disposing...");
        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
    }
}