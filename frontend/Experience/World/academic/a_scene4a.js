import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class AcademicScene4A {
    constructor() {
        console.log("[AcademicScene4A] Constructor called");
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        console.log("[AcademicScene4A] Calling setWorld()");
        this.setWorld();
        console.log("[AcademicScene4A] Calling createPortals()");
        this.createPortals();
        console.log("[AcademicScene4A] Constructor completed");
    }

    setWorld() {
        console.log("[AcademicScene4A] setWorld() called");
        const collidableGroup = new THREE.Group();

        console.log("[AcademicScene4A] Loading class model");
        console.log("[AcademicScene4A] Available resources:", Object.keys(this.resources.items));

        if (!this.resources.items["class"]) {
            console.error("[AcademicScene4A] ❌ class model not found in resources!");
            return;
        }

        this.classModel = this.resources.items["class"].scene;
        console.log("[AcademicScene4A] Model loaded:", this.classModel);
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

        console.log("[AcademicScene4A] Adding to scene");
        this.scene.add(collidableGroup);

        // Build the octree
        this.octree.fromGraphNode(collidableGroup);

        // Set collision objects for camera
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[AcademicScene4A] Camera collision objects set");
        }

        console.log("[AcademicScene4A] Academic Scene 4A (Class) loaded with full collision enabled.");
    }

    createPortals() {
        // Portal ke Westgate
        this.westgatePortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu)
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
        console.log("[AcademicScene4A] Disposing Academic Scene 4A (Class)...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }

        console.log("[AcademicScene4A] Academic Scene 4A (Class) disposed");
    }
}
