import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class ScienceRoom {
    constructor() {
        console.log("[ScienceRoom] Constructor called");
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        console.log("[ScienceRoom] Calling setWorld()");
        this.setWorld();
        console.log("[ScienceRoom] Calling createPortals()");
        this.createPortals();
        console.log("[ScienceRoom] Constructor completed");
    }

    setWorld() {
        console.log("[ScienceRoom] setWorld() called");
        const collidableGroup = new THREE.Group();

        console.log("[ScienceRoom] Loading science-room model");
        console.log("[ScienceRoom] Available resources:", Object.keys(this.resources.items));

        if (!this.resources.items["science-room"]) {
            console.error("[ScienceRoom] ❌ science-room model not found in resources!");
            return;
        }

        this.model = this.resources.items["science-room"].scene;
        console.log("[ScienceRoom] Model loaded:", this.model);
        this.model.position.set(0, 1.8, 0);
        this.model.rotation.set(0, 0, 0);
        this.model.scale.set(3, 3, 3);
        collidableGroup.add(this.model);

        console.log("[ScienceRoom] Adding to scene");
        this.scene.add(collidableGroup);

        console.log("[ScienceRoom] ⚠️ SKIPPING octree build to avoid crash - no collision for now");
        // SKIP OCTREE UNTUK SEMENTARA - nanti bisa ditambahkan setelah portal berfungsi
        // this.octree.fromGraphNode(this.model);

        console.log("[ScienceRoom] Science Room scene loaded (without collision).");
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
        // Hapus model dari scene
        if (this.model) {
            this.scene.remove(this.model.parent); // Hapus group
        }

        // Hapus portal
        if (this.classPortal) {
            this.classPortal.dispose();
        }
        
        console.log("ScienceRoom disposed");
    }
}