import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class AcademicScene2A {
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

        // Set collision objects for camera
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[AcademicScene2A] Camera collision objects set");
        }

        console.log("Academic Scene 2A (Class) loaded with full collision enabled.");
    }

    createPortals() {
        // Portal ke Westgate atau scene lain (sesuaikan posisi dengan lokasi pintu)
        this.westgatePortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu)
            "westgate", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Westgate" // Nama ruangan
        );
    }

    update() {
        // Update portal animation
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }
    }

    dispose() {
        console.log("[AcademicScene2A] Disposing Academic Scene 2A (Class)...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }

        console.log("[AcademicScene2A] Academic Scene 2A (Class) disposed");
    }
}
