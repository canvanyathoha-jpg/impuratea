import Experience from "../Experience.js";
import * as THREE from "three";
import Portal from "./Portal.js";

export default class Westgate {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
        this.createPortals();
    }

    setWorld() {
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the school model (schooll.glb)
        this.schoolModel = this.resources.items.school.scene;
        this.schoolModel.position.set(0, 0, 0);
        this.schoolModel.rotation.set(0, 0, 0);
        this.schoolModel.scale.set(10, 10, 10);
        collidableGroup.add(this.schoolModel);

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

        console.log("Westgate scene loaded with full collision enabled.");
    }

    createPortals() {
        // Portal ke Class atau scene lain (sesuaikan posisi dengan lokasi pintu)
        this.classPortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu)
            "class", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Class" // Nama ruangan
        );
    }

    update() {
        // Update portal animation
        if (this.classPortal) {
            this.classPortal.update();
        }
    }

    dispose() {
        console.log("[Westgate] Disposing Westgate scene...");

        // Hapus portal
        if (this.classPortal) {
            this.classPortal.dispose();
            this.classPortal = null;
        }

        // Hapus model dari scene
        if (this.schoolModel && this.schoolModel.parent) {
            this.scene.remove(this.schoolModel.parent);
        }

        console.log("[Westgate] Westgate scene disposed");
    }
}
