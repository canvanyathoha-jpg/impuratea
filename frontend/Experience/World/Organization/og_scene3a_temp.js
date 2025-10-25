import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class OrganizationScene3A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
        this.createPortals();
    }

    setWorld() {
        // Load the caffe model (caffe.glb) - show immediately
        this.caffeModel = this.resources.items.caffe.scene;
        this.caffeModel.position.set(0, 0, 0);
        this.caffeModel.rotation.set(0, 0, 0);
        this.caffeModel.scale.set(12, 12, 12);
        this.scene.add(this.caffeModel);

        // Setup collider for physics
        this.collider = this.resources.items.collider.scene.clone();
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(12, 12, 12);

        // Make collider invisible
        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
        this.scene.add(this.collider);

        console.log("[OrganizationScene3A] Scene visible, building collision...");

        // Build octree asynchronously to avoid blocking rendering
        requestAnimationFrame(() => {
            this.octree.fromGraphNode(this.collider);

            // Set collision objects for camera
            if (this.experience.camera && this.experience.camera.controls) {
                this.experience.camera.controls.collisionObjects = this.collider;
            }

            console.log("[OrganizationScene3A] Collision ready");
        });
    }

    createPortals() {
        // Portal ke Westgate atau scene lain (sesuaikan posisi dengan lokasi pintu)
        this.westgatePortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu OSIS)
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
        console.log("[OrganizationScene3A] Disposing Organization Scene 3A (Caffe)...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.caffeModel && this.caffeModel.parent) {
            this.scene.remove(this.caffeModel);
        }
        if (this.collider && this.collider.parent) {
            this.scene.remove(this.collider);
        }

        console.log("[OrganizationScene3A] Organization Scene 3A (Caffe) disposed");
    }
}
