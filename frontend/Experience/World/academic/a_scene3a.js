import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class AcademicScene3A {
    constructor() {
        console.log("[AcademicScene3A] Constructor called");
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        console.log("[AcademicScene3A] Calling setWorld()");
        this.setWorld();
        console.log("[AcademicScene3A] Calling createPortals()");
        this.createPortals();
        console.log("[AcademicScene3A] Constructor completed");
    }

    setWorld() {
        console.log("[AcademicScene3A] setWorld() called");
        const collidableGroup = new THREE.Group();

        console.log("[AcademicScene3A] Loading science-room model");
        console.log("[AcademicScene3A] Available resources:", Object.keys(this.resources.items));

        if (!this.resources.items["science-room"]) {
            console.error("[AcademicScene3A] ❌ science-room model not found in resources!");
            return;
        }

        this.model = this.resources.items["science-room"].scene;
        console.log("[AcademicScene3A] Model loaded:", this.model);
        this.model.position.set(0, 1.8, 0);
        this.model.rotation.set(0, 0, 0);
        this.model.scale.set(3, 3, 3);
        collidableGroup.add(this.model);

        console.log("[AcademicScene3A] Adding to scene");
        this.scene.add(collidableGroup);

        console.log("[AcademicScene3A] ⚠️ SKIPPING octree build to avoid crash - no collision for now");
        // SKIP OCTREE UNTUK SEMENTARA - nanti bisa ditambahkan setelah portal berfungsi
        // this.octree.fromGraphNode(this.model);

        console.log("[AcademicScene3A] Academic Scene 3A (Science Room) loaded (without collision).");
    }

    createPortals() {
        // Portal kembali ke Kelas
        this.classPortal = new Portal(
            new THREE.Vector3(0, 0.1, 5), // Sesuaikan posisi ini
            "class",
            new THREE.Vector3(49, 10, 30), // Spawn di depan portal kelas (lebih tinggi)
            "Kelas"
        );
    }

    update() {
        if (this.classPortal) {
            this.classPortal.update();
        }
    }

    dispose() {
        console.log("[AcademicScene3A] Disposing Academic Scene 3A (Science Room)...");

        // Hapus portal
        if (this.classPortal) {
            this.classPortal.dispose();
            this.classPortal = null;
        }

        // Hapus model dari scene
        if (this.model) {
            this.scene.remove(this.model.parent); // Hapus group
        }

        console.log("[AcademicScene3A] Academic Scene 3A (Science Room) disposed");
    }
}