import Experience from "../Experience.js";
import * as THREE from "three";
import Portal from "./Portal.js"; // Import Portal

export default class Class {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
        this.createPortals(); // Tambahkan portal
    }

    setWorld() {
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the class model (Kelas-C.glb)
        this.classModel = this.resources.items.class.scene;
        this.classModel.position.set(0, 0, 0);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10);
        collidableGroup.add(this.classModel);

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

        console.log("Class scene loaded with full collision enabled.");
    }
    
    createPortals() {
        // Portal ke Lab (sesuaikan posisi dengan lokasi pintu)
        this.labPortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (depan pintu)
            "science-room", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru (tinggi dari lantai)
            "Lab" // Nama ruangan
        );
    }

    update() {
        // Update portal animation
        if (this.labPortal) {
            this.labPortal.update();
        }
    }

    dispose() {
        console.log("[Class] Disposing Class scene...");

        // Hapus portal
        if (this.labPortal) {
            this.labPortal.dispose();
            this.labPortal = null;
        }

        // Hapus model dari scene
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }

        console.log("[Class] Class scene disposed");
    }
}