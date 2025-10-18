import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class AcademicScene3B {
    constructor() {
        console.log("[AcademicScene3B] Constructor called");
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        console.log("[AcademicScene3B] Calling setWorld()");
        this.setWorld();
        console.log("[AcademicScene3B] Calling createPortals()");
        this.createPortals();
        console.log("[AcademicScene3B] Constructor completed");
    }

    setWorld() {
        console.log("[AcademicScene3B] setWorld() called");
        const collidableGroup = new THREE.Group();

        console.log("[AcademicScene3B] Loading science-room model");
        console.log("[AcademicScene3B] Available resources:", Object.keys(this.resources.items));

        if (!this.resources.items["science-room"]) {
            console.error("[AcademicScene3B] L science-room model not found in resources!");
            return;
        }

        this.model = this.resources.items["science-room"].scene;
        console.log("[AcademicScene3B] Model loaded:", this.model);
        this.model.position.set(0, 1.8, 0);
        this.model.rotation.set(0, 0, 0);
        this.model.scale.set(3, 3, 3);
        collidableGroup.add(this.model);

        console.log("[AcademicScene3B] Adding to scene");
        this.scene.add(collidableGroup);

        console.log("[AcademicScene3B]   SKIPPING octree build to avoid crash - no collision for now");
        // SKIP OCTREE UNTUK SEMENTARA - nanti bisa ditambahkan setelah portal berfungsi
        // this.octree.fromGraphNode(this.model);

        console.log("[AcademicScene3B] Academic Scene 3B (Science Room) loaded (without collision).");
    }

    createPortals() {
        // Portal ke Westgate
        this.westgatePortal = new Portal(
            new THREE.Vector3(0, 0.1, 5), // Sesuaikan posisi ini
            "westgate",
            new THREE.Vector3(0, 10, 0), // Spawn di westgate
            "Westgate"
        );
    }

    update() {
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }
    }

    dispose() {
        console.log("[AcademicScene3B] Disposing Academic Scene 3B (Science Room)...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.model) {
            this.scene.remove(this.model.parent); // Hapus group
        }

        console.log("[AcademicScene3B] Academic Scene 3B (Science Room) disposed");
    }
}
